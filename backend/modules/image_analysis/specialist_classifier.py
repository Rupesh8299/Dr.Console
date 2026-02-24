import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image as keras_image
import os

# --- Model Paths ---
MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'models')

# Class labels per specialist model
# These MUST match the alphabetical folder order from how the datasets were structured
CLASS_LABELS = {
    "ear": [
        "Acute Otitis Media (Infection)",
        "Cerumen Impaction (Earwax)",
        "Chronic Otitis Media",
        "Myringosclerosis",
        "Normal (Healthy)"
    ],
    "eye": [
        "Cataract",
        "Diabetic Retinopathy",
        "Glaucoma",
        "Normal (Healthy)"
    ],
    "tongue": [
        "COVID-19 Affected (Type 1)",
        "COVID-19 Affected (Type 2)",
        "COVID-19 Affected (Type 3)",
        "COVID-19 Affected (Type 4)",
        "COVID-19 Affected (Type 5)",
        "Healthy"
    ]
}

# High-risk classes that need extra warning
HIGH_RISK_CLASSES = {
    "ear": ["Acute Otitis Media (Infection)", "Chronic Otitis Media"],
    "eye": ["Cataract", "Diabetic Retinopathy", "Glaucoma"],
    "tongue": ["COVID-19 Affected (Type 1)", "COVID-19 Affected (Type 2)",
               "COVID-19 Affected (Type 3)", "COVID-19 Affected (Type 4)",
               "COVID-19 Affected (Type 5)"]
}


class SpecialistClassifier:
    """
    A generic, reusable classifier that loads any of the specialist trained models.
    Supports: 'ear', 'eye', 'tongue'
    """
    _models = {}  # Cache loaded models { "ear": model, "eye": model, ... }

    @classmethod
    def load_model(cls, specialist: str):
        """Lazy-loads and caches the requested specialist model."""
        specialist = specialist.lower()
        if specialist not in CLASS_LABELS:
            raise ValueError(f"Unknown specialist: '{specialist}'. Choose from: {list(CLASS_LABELS.keys())}")

        if specialist in cls._models:
            return cls._models[specialist]  # Return cached model

        model_path = os.path.join(MODELS_DIR, f"model_{specialist}.h5")
        print(f"Loading {specialist.upper()} model from {model_path}...")

        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Model file not found: {model_path}\n"
                f"Please place 'model_{specialist}.h5' in the backend/models/ directory."
            )

        try:
            model = tf.keras.models.load_model(model_path)
            cls._models[specialist] = model
            print(f"{specialist.upper()} model loaded successfully. Output classes: {model.output_shape[-1]}")
            return model
        except Exception as e:
            print(f"CRITICAL: Failed to load {specialist} model: {e}")
            raise e

    @classmethod
    def predict(cls, image_path: str, specialist: str) -> dict:
        """
        Runs prediction on an image using the specified specialist model.

        Args:
            image_path: Path to the image file
            specialist: one of 'ear', 'eye', 'tongue'

        Returns:
            dict with condition, confidence, specialist, is_high_risk, warning
        """
        specialist = specialist.lower()
        model = cls.load_model(specialist)
        class_names = CLASS_LABELS[specialist]

        # Preprocess the image (MobileNetV2 expects 224x224, normalized 0-1)
        img = keras_image.load_img(image_path, target_size=(224, 224))
        img_array = keras_image.img_to_array(img) / 255.0  # Normalize
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dim

        # Run prediction
        predictions = model.predict(img_array, verbose=0)
        scores = predictions[0]

        predicted_idx = int(np.argmax(scores))
        confidence = float(round(100 * scores[predicted_idx], 2))

        # Handle case where model output size doesn't match expected class count
        if predicted_idx >= len(class_names):
            condition = f"Class {predicted_idx}"
        else:
            condition = class_names[predicted_idx]

        is_low_confidence = confidence < 55
        is_high_risk = condition in HIGH_RISK_CLASSES.get(specialist, [])

        # Build result
        result = {
            "specialist": specialist,
            "condition": condition,
            "confidence": confidence,
            "all_scores": {
                class_names[i] if i < len(class_names) else f"Class {i}": round(float(scores[i]) * 100, 2)
                for i in range(len(scores))
            },
            "is_low_confidence": is_low_confidence,
            "is_high_risk": is_high_risk,
            "warning": None
        }

        if is_high_risk:
            result["warning"] = f"⚠️ High-risk finding detected: '{condition}'. Please consult a medical specialist immediately."
        elif is_low_confidence:
            result["warning"] = "Low confidence. Please provide a clearer, well-lit image of the area."

        return result
