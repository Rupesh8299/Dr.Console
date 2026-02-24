import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
from tensorflow.keras import layers, models

# Build the model structure
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights=None
)
base_model.trainable = False

model = models.Sequential([
    layers.Rescaling(1./255, input_shape=(224, 224, 3)),
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.2),
    layers.Dense(23, activation='softmax')
])

import os
script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, 'skin_model.keras')
image_path = os.path.join(script_dir, 'images.jpeg')

print("Loading model weights...")
try:
    # Load weights from the saved complete model file
    model.load_weights(model_path)
except Exception as e:
    print(f"Failed to load weights: {e}")
    # Fallback: try loading as a full model if weights fail (though unlikely to work if previous attempt failed)
    print("Attempting legacy load...")
    model = tf.keras.models.load_model(model_path)

class_names = [
    'Acne and Rosacea', 
    'Actinic Keratosis / Basal Cell Carcinoma (Malignant)', 
    'Atopic Dermatitis', 
    'Bullous Disease', 
    'Cellulitis / Impetigo (Bacterial)', 
    'Eczema', 
    'Exanthems and Drug Eruptions', 
    'Alopecia / Hair Loss', 
    'Herpes / HPV / STDs', 
    'Light Diseases / Pigmentation Disorders', 
    'Lupus / Connective Tissue Diseases', 
    'Melanoma / Nevi / Moles', 
    'Nail Fungus / Nail Disease', 
    'Poison Ivy / Contact Dermatitis', 
    'Psoriasis / Lichen Planus', 
    'Scabies / Lyme Disease / Bites', 
    'Seborrheic Keratoses / Benign Tumors', 
    'Systemic Disease', 
    'Tinea / Ringworm / Candidiasis (Fungal)', 
    'Urticaria (Hives)', 
    'Vascular Tumors', 
    'Vasculitis', 
    'Warts / Molluscum / Viral Infections'
]

def predict_skin(image_path):
    # Preprocess the image to match the model (224x224)
    img = image.load_img(image_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = tf.expand_dims(img_array, 0) # Create a batch

    # Make prediction
    predictions = model.predict(img_array)
    score = tf.nn.softmax(predictions[0])
    
    # Get the highest confidence result
    confidence = 100 * np.max(score)
    predicted_class = class_names[np.argmax(score)]

    if confidence < 50:
        print(f"Diagnosis: {predicted_class}")
        print("\nLow confidence detection.")
        print("This result is a 'best guess' based on the 23 known classes.")
    else:
        print(f"Diagnosis: {predicted_class}")
        print(f"Confidence: {confidence:.2f}%")

predict_skin(image_path) 
