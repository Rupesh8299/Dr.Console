# Skin Disease Detection Model Documentation

## Model Overview
- **Model Architecture**: MobileNetV2 (Pre-trained on ImageNet)
- **Dataset**: [Dermnet](https://www.kaggle.com/datasets/shubhamgoel27/dermnet) (Kaggle)
- **Total Images**: 19,500
- **Data Split**: 80% Train, 20% Test
- **Training Environment**: Google Colab

## Performance
- **Epochs**: 15
- **Test Accuracy**: 43.14%

## Detected Classes (23 Categories)
The model can detect the following skin conditions:

1. Acne and Rosacea
2. Actinic Keratosis / Basal Cell Carcinoma (Malignant)
3. Atopic Dermatitis
4. Bullous Disease
5. Cellulitis / Impetigo (Bacterial)
6. Eczema
7. Exanthems and Drug Eruptions
8. Alopecia / Hair Loss
9. Herpes / HPV / STDs
10. Light Diseases / Pigmentation Disorders
11. Lupus / Connective Tissue Diseases
12. Melanoma / Nevi / Moles
13. Nail Fungus / Nail Disease
14. Poison Ivy / Contact Dermatitis
15. Psoriasis / Lichen Planus
16. Scabies / Lyme Disease / Bites
17. Seborrheic Keratoses / Benign Tumors
18. Systemic Disease
19. Tinea / Ringworm / Candidiasis (Fungal)
20. Urticaria (Hives)
21. Vascular Tumors
22. Vasculitis
23. Warts / Molluscum / Viral Infections

## Setup & Data Preparation

### 1. Setup Kaggle Data
Execute the following to download the dataset in Google Colab:

```python
import os

# 1. Setup Kaggle
# Make sure you upload your 'kaggle.json' file to Colab first!
!mkdir -p ~/.kaggle
!cp kaggle.json ~/.kaggle/
!chmod 600 ~/.kaggle/kaggle.json

print("Downloading Dermnet Dataset... (Larger dataset, may take 1-2 mins)")
# Using the 'shubhamgoel27/dermnet' dataset which is well structured
!kaggle datasets download -d shubhamgoel27/dermnet
!unzip -q dermnet.zip

print("Download & Unzip Complete!")

# This dataset is already inside 'train' and 'test' folders, so no organizing script is needed.
num_classes = len(os.listdir('train'))
print(f"Detected {num_classes} different skin conditions!")
```

## Model Training Script

### 2. Training Implementation
The following script configures, builds, and trains the model.

```python
import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np

# --- OPTIMIZATION SETTINGS ---
# Lower batch size reduces RAM usage (try 16, or 8 if it still crashes)
BATCH_SIZE = 16 
IMG_SIZE = (224, 224)

print("Loading training data...")
train_ds = tf.keras.utils.image_dataset_from_directory(
    'train',
    seed=123,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    label_mode='int' # more efficient than 'categorical' for sparse loss
)

print("Loading validation data...")
val_ds = tf.keras.utils.image_dataset_from_directory(
    'test',
    seed=123,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    label_mode='int'
)

class_names = train_ds.class_names
num_classes = len(class_names)
print(f"Training on {num_classes} classes.")

# --- MEMORY FIX ---
# REMOVED .cache() to prevent RAM explosion keeping prefetch, manageable amount.
train_ds = train_ds.prefetch(buffer_size=tf.data.AUTOTUNE)
val_ds = val_ds.prefetch(buffer_size=tf.data.AUTOTUNE)

# Build Model
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False 

model = models.Sequential([
    layers.Rescaling(1./255, input_shape=(224, 224, 3)),
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.2),
    layers.Dense(num_classes, activation='softmax')
])

# 3. Train
model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

print("Starting Low-RAM Training...")
# Since we removed cache, one epoch might be slightly slower, but it won't crash.
history = model.fit(train_ds, validation_data=val_ds, epochs=15)

# 4. Save
model.save('skin_model.keras')
print("Model saved!")

print("\n" + "="*50)
print("CLASS NAMES")
print(class_names)
print("="*50)
```
