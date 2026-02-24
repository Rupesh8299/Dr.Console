import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
from tensorflow.keras import layers, models
import os

# --- Configuration ---
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'models', 'skin_model.keras')

class SkinDiseaseClassifier:
    _model = None
    _class_names = [
        'Acne and Rosacea', 'Actinic Keratosis / Basal Cell Carcinoma (Malignant)', 'Atopic Dermatitis', 
        'Bullous Disease', 'Cellulitis / Impetigo (Bacterial)', 'Eczema', 'Exanthems and Drug Eruptions', 
        'Alopecia / Hair Loss', 'Herpes / HPV / STDs', 'Light Diseases / Pigmentation Disorders', 
        'Lupus / Connective Tissue Diseases', 'Melanoma / Nevi / Moles', 'Nail Fungus / Nail Disease', 
        'Poison Ivy / Contact Dermatitis', 'Psoriasis / Lichen Planus', 'Scabies / Lyme Disease / Bites', 
        'Seborrheic Keratoses / Benign Tumors', 'Systemic Disease', 'Tinea / Ringworm / Candidiasis (Fungal)', 
        'Urticaria (Hives)', 'Vascular Tumors', 'Vasculitis', 'Warts / Molluscum / Viral Infections'
    ]

    @classmethod
    def load_model(cls):
        """Lazy loads the model structure and weights."""
        if cls._model is not None:
            return cls._model

        print(f"Loading Skin Model from {MODEL_PATH}...")
        try:
            # 1. Rebuild Architecture (MobileNetV2)
            base_model = tf.keras.applications.MobileNetV2(
                input_shape=(224, 224, 3),
                include_top=False,
                weights=None  # Load from file
            )
            base_model.trainable = False
            
            model = models.Sequential([
                layers.Rescaling(1./255, input_shape=(224, 224, 3)),
                base_model,
                layers.GlobalAveragePooling2D(),
                layers.Dropout(0.2),
                layers.Dense(23, activation='softmax')
            ])
            
            # 2. Load Weights (Preferred)
            model.load_weights(MODEL_PATH)
            cls._model = model
            print("Skin Model loaded successfully (Weights).")
            
        except Exception as e:
            print(f"Weight load failed: {e}. Trying full model load...")
            try:
                cls._model = tf.keras.models.load_model(MODEL_PATH)
                print("Skin Model loaded successfully (Full Model).")
            except Exception as e2:
                print(f"CRITICAL: Failed to load skin model: {e2}")
                raise e2
        
        return cls._model

    @staticmethod
    def predict(image_path: str):
        """
        Predicts the skin condition from an image path.
        Returns: dict { 'condition': str, 'confidence': float, 'warning': str }
        """
        model = SkinDiseaseClassifier.load_model()
        
        try:
            # Preprocess
            img = image.load_img(image_path, target_size=(224, 224))
            img_array = image.img_to_array(img)
            img_array = tf.expand_dims(img_array, 0) # Batch size 1

            # Predict
            predictions = model.predict(img_array)
            score = tf.nn.softmax(predictions[0])
            
            confidence = 100 * np.max(score)
            predicted_class = SkinDiseaseClassifier._class_names[np.argmax(score)]
            
            result = {
                "condition": predicted_class,
                "confidence": round(confidence, 2),
                "is_low_confidence": confidence < 50,
                "warning": None
            }

            if result["is_low_confidence"]:
                result["warning"] = "Low confidence detection. Please consult a specialist and provide a clearer image."

            return result

        except Exception as e:
            print(f"Prediction Error: {e}")
            return {"error": str(e)}

# Singleton instance for easy import if needed, though static methods work fine here
# skin_classifier = SkinDiseaseClassifier()
