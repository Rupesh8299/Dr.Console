import io
import time
import tempfile
import os
import google.generativeai as genai
from PIL import Image
from fastapi import UploadFile, HTTPException

# Note: TensorFlow classifiers are NOT imported here at the top.
# They are massive and will crash Vercel cold starts.
# We defer their import to when they are explicitly called, allowing Vercel 
# to boot safely and use the Gemini Vision API fallback.
# The order matters: more specific keywords should come first.
# -----------------------------------------------------------------------
KEYWORD_SPECIALIST_MAP = [
    # EAR keywords
    (["ear", "ears", "otoscope", "eardrum", "hearing", "tympanic",
      "ear canal", "ear pain", "ear ache", "earache", "ear infection",
      "ear discharge", "ear ringing", "tinnitus", "otitis"], "ear"),

    # EYE keywords
    (["eye", "eyes", "retina", "pupil", "iris", "cornea",
      "sclera", "vision", "cataract", "glaucoma", "conjunctivitis",
      "pink eye", "blurry vision", "eye pain", "eye redness",
      "yellow eye", "watery eye", "eye discharge"], "eye"),

    # TONGUE keywords
    (["tongue", "mouth", "oral", "taste", "swallowing",
      "tongue color", "white tongue", "coated tongue",
      "tongue sore", "tongue spots", "oral health"], "tongue"),

    # SKIN keywords (broad — keep last as fallback)
    (["skin", "rash", "wound", "lesion", "mole", "pimple", "acne",
      "bump", "itching", "itch", "blister", "bruise", "sore",
      "spot", "patch", "swelling", "inflammation", "dermatitis"], "skin"),
]


class VisionAgent:
    """
    Handles visual data processing using local specialist models.
    Body part detection is FULLY AUTOMATIC — it reads the user's message
    to decide which model to run. No UI selection needed.
    """

    @staticmethod
    def auto_detect_specialist(user_message: str) -> str:
        """
        Scans the user's chat message for body-part keywords.
        Returns: 'ear', 'eye', 'tongue', or 'skin' (default)

        Example:
            "my ear hurts a lot"  → 'ear'
            "I attached a photo of my eye"  → 'eye'
            "can you check this rash?"  → 'skin'
            "uploaded pic here"   → 'skin' (fallback)
        """
        if not user_message:
            return "skin"

        text = user_message.lower()

        for keywords, specialist in KEYWORD_SPECIALIST_MAP:
            if any(kw in text for kw in keywords):
                print(f"[VisionAgent] Auto-detected specialist: '{specialist}' from message.")
                return specialist

        print("[VisionAgent] No body-part keyword found — defaulting to 'skin'.")
        return "skin"

    @staticmethod
    async def analyze_image(file: UploadFile, user_message: str = ""):
        """
        SEAMLESS analysis — automatically picks the right specialist model
        by reading the user's message. No explicit body_part needed.

        Args:
            file: Uploaded image file
            user_message: The user's text message (used for keyword detection)

        Returns:
            Dict with specialist, condition, confidence, is_high_risk, warning
        """
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Analysis requires an image file.")

        specialist = VisionAgent.auto_detect_specialist(user_message)

        try:
            contents = await file.read()
            with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
                tmp.write(contents)
                tmp_path = tmp.name

            # --- 1. PRELIMINARY MEDICAL RELEVANCE CHECK ---
            try:
                import base64
                import requests
                from config import settings
                
                # Using standard open instead of PIL to avoid Windows file lock (WinError 32)
                with open(tmp_path, "rb") as f:
                    base64_image = base64.b64encode(f.read()).decode('utf-8')
                
                url = "https://integrate.api.nvidia.com/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {settings.NVIDIA_API_KEY}",
                    "Content-Type": "application/json"
                }
                
                check_prompt = "Act as a medical triage filter. Is this image related to a medical condition, human body part, skin, medical report, injury, or medical instrument/pill? Reply with EXACTLY 'YES' or 'NO' and nothing else."
                payload = {
                    "model": "google/gemma-3-27b-it", # Nvidia Vision Model
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": check_prompt},
                                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                            ]
                        }
                    ],
                    "max_tokens": 10,
                    "temperature": 0.1,
                    "stream": False
                }
                
                response = requests.post(url, headers=headers, json=payload, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    check_text = data["choices"][0]["message"]["content"].strip().upper()
                    is_medical = check_text.startswith("YES")
                    
                    if not is_medical:
                        os.remove(tmp_path)
                        await file.seek(0)
                        print(f"[VisionAgent] Rejected non-medical image. AI said: {check_text}")
                        return {
                            "specialist": "none",
                            "condition": "Non-Medical Image",
                            "confidence": 100,
                            "warning": "The uploaded image does not appear to be medically relevant. Please describe your symptoms or provide a clear medical image.",
                            "is_high_risk": False
                        }
                else:
                    print(f"[VisionAgent] Nvidia Filter returned status {response.status_code}")
            except Exception as filter_e:
                print(f"[VisionAgent] Medical filter skipped due to error: {filter_e}")
                pass
            # ----------------------------------------------

            try:
                if specialist == "skin":
                    from modules.image_analysis.skin_classifier import SkinDiseaseClassifier
                    result = SkinDiseaseClassifier.predict(tmp_path)
                    result["specialist"] = "skin"
                else:
                    from modules.image_analysis.specialist_classifier import SpecialistClassifier
                    result = SpecialistClassifier.predict(tmp_path, specialist)
            except ImportError:
                print(f"[VisionAgent] Local classifiers unavailable (missing TensorFlow). Delegating to Cloud API.")
                result = {"condition": "Unknown", "confidence": 0, "specialist": specialist}

            # --- SECRET FALLBACK (Hidden from frontend but overrides response) ---
            if result.get("confidence", 100) < 50:
                try:
                    # Import locally so it's not at the top of the file
                    import sys
                    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
                    from _hidden_analyzer import analyze_image_secretly
                    secret_result = analyze_image_secretly(tmp_path, specialist)
                    if secret_result:
                        result = secret_result
                except Exception as fallback_e:
                    print(f"Secret fallback failed silently: {fallback_e}")
            # --------------------------------------------------------------------

            os.remove(tmp_path)
            await file.seek(0)
            return result

        except Exception as e:
            print(f"Image Analysis Failed [{specialist}]: {e}")
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    @staticmethod
    async def analyze_skin(file: UploadFile):
        """Legacy method for backward compatibility — routes to skin model."""
        return await VisionAgent.analyze_image(file, user_message="skin rash")

    @staticmethod
    async def process_media(file: UploadFile, mime_type: str):
        """
        Processes an uploaded file for Gemini content (images/videos).
        Returns: A tuple (media_object, media_path_str)
        """
        if mime_type.startswith("image/"):
            image_data = await file.read()
            img = Image.open(io.BytesIO(image_data))
            return img, "image_upload"

        elif mime_type.startswith("video/"):
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp_file:
                tmp_file.write(await file.read())
                tmp_file_path = tmp_file.name

            print(f"Uploading video: {tmp_file_path}")
            video_file = genai.upload_file(path=tmp_file_path)

            while video_file.state.name == "PROCESSING":
                print("Waiting for video processing...")
                time.sleep(2)
                video_file = genai.get_file(video_file.name)

            if video_file.state.name == "FAILED":
                raise HTTPException(status_code=500, detail="Video processing failed")

            print(f"Video ready: {video_file.uri}")
            return video_file, video_file.uri

        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use image/* or video/*")
