import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import torch
import torch.nn as nn

# Make sure output directories exist
os.makedirs("../ml_models", exist_ok=True)

# -----------------
# 1. CROP RECOMMENDATION MODEL TRAINING
# -----------------
print("Generating synthetic data for crop recommendation...")

# Define profiles for crops
# Features: [Soil_Type, Nitrogen, Phosphorus, Potassium, Temperature, Humidity, Rainfall, pH]
# Soil Types encoded: Sandy=0, Clayey=1, Loamy=2, Silty=3, Peaty=4
crop_profiles = {
    'Rice': {'soil': 2, 'N': (80, 120), 'P': (40, 60), 'K': (30, 50), 'temp': (25, 35), 'hum': (70, 95), 'rain': (180, 280), 'ph': (5.5, 6.8)},
    'Maize': {'soil': 2, 'N': (70, 100), 'P': (40, 60), 'K': (30, 50), 'temp': (20, 32), 'hum': (55, 75), 'rain': (60, 110), 'ph': (5.8, 7.0)},
    'Chickpea': {'soil': 0, 'N': (20, 45), 'P': (50, 70), 'K': (25, 40), 'temp': (17, 25), 'hum': (15, 30), 'rain': (35, 60), 'ph': (6.0, 7.5)},
    'Kidneybeans': {'soil': 2, 'N': (15, 35), 'P': (45, 65), 'K': (30, 45), 'temp': (15, 24), 'hum': (40, 60), 'rain': (70, 120), 'ph': (5.7, 6.5)},
    'Pigeonpeas': {'soil': 0, 'N': (15, 35), 'P': (55, 75), 'K': (20, 35), 'temp': (25, 35), 'hum': (40, 60), 'rain': (80, 130), 'ph': (5.5, 7.0)},
    'Mothbeans': {'soil': 0, 'N': (10, 30), 'P': (35, 50), 'K': (15, 30), 'temp': (28, 38), 'hum': (45, 65), 'rain': (30, 60), 'ph': (6.5, 8.0)},
    'Mungbean': {'soil': 2, 'N': (15, 35), 'P': (35, 55), 'K': (15, 30), 'temp': (27, 35), 'hum': (60, 85), 'rain': (40, 90), 'ph': (6.2, 7.2)},
    'Blackgram': {'soil': 1, 'N': (20, 40), 'P': (40, 60), 'K': (15, 30), 'temp': (25, 35), 'hum': (60, 90), 'rain': (60, 100), 'ph': (6.5, 7.5)},
    'Lentil': {'soil': 2, 'N': (15, 30), 'P': (30, 50), 'K': (15, 30), 'temp': (15, 25), 'hum': (40, 60), 'rain': (40, 70), 'ph': (5.8, 6.8)},
    'Pomegranate': {'soil': 2, 'N': (30, 50), 'P': (10, 25), 'K': (35, 60), 'temp': (20, 35), 'hum': (50, 70), 'rain': (50, 90), 'ph': (6.0, 7.5)},
    'Banana': {'soil': 1, 'N': (90, 130), 'P': (70, 95), 'K': (110, 150), 'temp': (25, 33), 'hum': (75, 90), 'rain': (150, 250), 'ph': (5.5, 6.5)},
    'Mango': {'soil': 2, 'N': (20, 45), 'P': (20, 40), 'K': (25, 45), 'temp': (27, 36), 'hum': (45, 60), 'rain': (80, 150), 'ph': (5.5, 7.0)},
    'Grapes': {'soil': 2, 'N': (20, 40), 'P': (30, 50), 'K': (70, 100), 'temp': (15, 26), 'hum': (70, 85), 'rain': (40, 80), 'ph': (5.5, 6.8)},
    'Watermelon': {'soil': 0, 'N': (70, 95), 'P': (20, 40), 'K': (40, 65), 'temp': (24, 32), 'hum': (80, 90), 'rain': (40, 70), 'ph': (6.0, 7.0)},
    'Muskmelon': {'soil': 2, 'N': (80, 100), 'P': (20, 40), 'K': (45, 70), 'temp': (26, 35), 'hum': (80, 90), 'rain': (40, 60), 'ph': (6.2, 7.2)},
    'Apple': {'soil': 2, 'N': (70, 90), 'P': (15, 30), 'K': (120, 145), 'temp': (21, 24), 'hum': (85, 95), 'rain': (100, 140), 'ph': (5.5, 6.5)},
    'Orange': {'soil': 2, 'N': (10, 40), 'P': (5, 20), 'K': (5, 20), 'temp': (12, 35), 'hum': (90, 95), 'rain': (100, 120), 'ph': (6.0, 7.5)},
    'Papaya': {'soil': 2, 'N': (40, 65), 'P': (45, 65), 'K': (40, 60), 'temp': (23, 35), 'hum': (90, 95), 'rain': (140, 200), 'ph': (6.5, 7.0)},
    'Coconut': {'soil': 0, 'N': (15, 35), 'P': (10, 25), 'K': (25, 40), 'temp': (25, 29), 'hum': (90, 99), 'rain': (130, 220), 'ph': (5.0, 6.5)},
    'Cotton': {'soil': 1, 'N': (100, 130), 'P': (35, 55), 'K': (15, 30), 'temp': (22, 35), 'hum': (75, 85), 'rain': (60, 90), 'ph': (5.8, 7.5)},
    'Jute': {'soil': 1, 'N': (70, 95), 'P': (35, 50), 'K': (35, 55), 'temp': (23, 35), 'hum': (70, 90), 'rain': (140, 200), 'ph': (6.0, 7.0)},
    'Coffee': {'soil': 2, 'N': (90, 115), 'P': (15, 35), 'K': (25, 40), 'temp': (20, 28), 'hum': (50, 65), 'rain': (130, 190), 'ph': (6.0, 6.8)}
}

np.random.seed(42)
data_rows = []

# Generate 200 samples per crop
for crop, bounds in crop_profiles.items():
    for _ in range(200):
        # Soil Type: Add small noise around preferred, map with rounding
        soil = np.clip(np.round(bounds['soil'] + np.random.normal(0, 0.4)), 0, 4)
        n = np.random.uniform(*bounds['N'])
        p = np.random.uniform(*bounds['P'])
        k = np.random.uniform(*bounds['K'])
        temp = np.random.uniform(*bounds['temp'])
        hum = np.random.uniform(*bounds['hum'])
        rain = np.random.uniform(*bounds['rain'])
        ph = np.random.uniform(*bounds['ph'])
        
        data_rows.append([soil, n, p, k, temp, hum, rain, ph, crop])

df = pd.DataFrame(data_rows, columns=['soil_type', 'N', 'P', 'K', 'temperature', 'humidity', 'rainfall', 'pH', 'label'])

# Feature matrix and labels
X = df.drop('label', axis=1)
y = df['label']

# Label encode target
le = LabelEncoder()
y_encoded = le.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

print("Training Random Forest Classifier for Crop Recommendation...")
rf_model = RandomForestClassifier(n_estimators=50, random_state=42)
rf_model.fit(X_train, y_train)

# Evaluate
accuracy = rf_model.score(X_test, y_test)
print(f"Crop Model accuracy: {accuracy:.4f}")

# Save model and encoder
crop_model_data = {
    'model': rf_model,
    'label_encoder': le,
    'features': list(X.columns)
}

with open("../ml_models/crop_recommendation_model.pkl", "wb") as f:
    pickle.dump(crop_model_data, f)
print("Crop recommendation model saved to ../ml_models/crop_recommendation_model.pkl")


# -----------------
# 2. PLANT DISEASE DETECTION MODEL - PROPER TRAINING
# -----------------
print("Training Plant Disease Detection CNN on synthetic visual patterns...")

class PlantDiseaseCNN(nn.Module):
    def __init__(self, num_classes=10):
        super(PlantDiseaseCNN, self).__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
        )
        self.classifier = nn.Sequential(
            nn.Linear(64 * 8 * 8, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)
        x = self.classifier(x)
        return x


def generate_disease_image(class_idx, img_size=64):
    """
    Generate a synthetic leaf image with distinct visual patterns per disease class.
    Each class has a unique combination of base color, spot pattern, texture noise,
    and structural features so the CNN learns genuinely separable features.
    """
    # Base leaf green canvas
    img = np.zeros((img_size, img_size, 3), dtype=np.float32)

    # --- Per-class visual profiles ---
    # 0: Tomato - Yellow Leaf Curl Virus  -> yellow-green, curled edges (bright yellow patches)
    # 1: Tomato - Late Blight             -> dark brown blotches on green
    # 2: Tomato - Healthy                 -> uniform bright green
    # 3: Apple  - Apple Scab              -> olive/dark spots on light green
    # 4: Apple  - Black Rot               -> concentric dark brown rings
    # 5: Apple  - Healthy                 -> uniform medium green
    # 6: Potato - Early Blight            -> brown target-board rings on green
    # 7: Potato - Late Blight             -> large dark lesions + white edge
    # 8: Potato - Healthy                 -> uniform deep green
    # 9: Corn   - Common Rust             -> rust/orange pustule streaks

    profiles = [
        # (base_rgb,          spot_rgb,            spot_density, spot_size, noise_std, stripe)
        ((0.55, 0.65, 0.10),  (0.95, 0.90, 0.10),  0.18,  12,  0.04, False),  # 0 TYLCV - yellow patches
        ((0.15, 0.40, 0.10),  (0.30, 0.15, 0.05),  0.14,  18,  0.05, False),  # 1 Tomato Late Blight
        ((0.15, 0.65, 0.10),  (0.20, 0.70, 0.12),  0.02,   4,  0.02, False),  # 2 Tomato Healthy
        ((0.30, 0.55, 0.15),  (0.20, 0.25, 0.05),  0.12,  10,  0.04, False),  # 3 Apple Scab
        ((0.25, 0.50, 0.12),  (0.18, 0.08, 0.03),  0.10,  20,  0.04, False),  # 4 Apple Black Rot
        ((0.20, 0.60, 0.15),  (0.22, 0.62, 0.16),  0.02,   4,  0.02, False),  # 5 Apple Healthy
        ((0.20, 0.45, 0.10),  (0.45, 0.22, 0.05),  0.13,  14,  0.04, False),  # 6 Potato Early Blight
        ((0.10, 0.35, 0.08),  (0.08, 0.08, 0.06),  0.20,  22,  0.06, False),  # 7 Potato Late Blight
        ((0.10, 0.55, 0.12),  (0.12, 0.57, 0.13),  0.02,   4,  0.02, False),  # 8 Potato Healthy
        ((0.25, 0.50, 0.10),  (0.70, 0.35, 0.05),  0.15,   8,  0.04, True),   # 9 Corn Common Rust
    ]

    base_rgb, spot_rgb, spot_density, spot_size, noise_std, stripe = profiles[class_idx]

    # Fill base color
    img[:, :, 0] = base_rgb[0]
    img[:, :, 1] = base_rgb[1]
    img[:, :, 2] = base_rgb[2]

    # Add Gaussian noise texture
    img += np.random.normal(0, noise_std, img.shape).astype(np.float32)

    # Add spots / lesions
    n_spots = int(spot_density * img_size)
    for _ in range(n_spots):
        cx = np.random.randint(spot_size, img_size - spot_size)
        cy = np.random.randint(spot_size, img_size - spot_size)
        radius = np.random.randint(spot_size // 2, spot_size)
        yy, xx = np.ogrid[:img_size, :img_size]
        mask = (xx - cx) ** 2 + (yy - cy) ** 2 <= radius ** 2
        for c, val in enumerate(spot_rgb):
            img[:, :, c][mask] = val + np.random.normal(0, 0.02)

    # Corn rust: add horizontal orange streaks
    if stripe:
        for _ in range(12):
            row = np.random.randint(0, img_size)
            width = np.random.randint(2, 6)
            img[max(0, row-width):row+width, :, 0] = 0.72
            img[max(0, row-width):row+width, :, 1] = 0.32
            img[max(0, row-width):row+width, :, 2] = 0.04

    # Clip and convert to tensor (C, H, W)
    img = np.clip(img, 0.0, 1.0)
    # Normalize with ImageNet stats
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std  = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img = (img - mean) / std
    return torch.tensor(img.transpose(2, 0, 1), dtype=torch.float32)


num_classes = 10
SAMPLES_PER_CLASS = 60
BATCH_SIZE = 64
EPOCHS = 15

print(f"Generating {SAMPLES_PER_CLASS * num_classes} synthetic disease images...")
np.random.seed(42)
torch.manual_seed(42)

all_images, all_labels = [], []
for cls in range(num_classes):
    for _ in range(SAMPLES_PER_CLASS):
        all_images.append(generate_disease_image(cls))
        all_labels.append(cls)

# Shuffle
indices = list(range(len(all_images)))
np.random.shuffle(indices)
all_images = [all_images[i] for i in indices]
all_labels = [all_labels[i] for i in indices]

images_tensor = torch.stack(all_images)   # (N, 3, 224, 224)
labels_tensor = torch.tensor(all_labels, dtype=torch.long)

# Split 80/20
split = int(0.8 * len(images_tensor))
X_train_img, X_val_img = images_tensor[:split], images_tensor[split:]
y_train_lbl, y_val_lbl = labels_tensor[:split], labels_tensor[split:]

train_dataset = torch.utils.data.TensorDataset(X_train_img, y_train_lbl)
val_dataset   = torch.utils.data.TensorDataset(X_val_img,   y_val_lbl)
train_loader  = torch.utils.data.DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
val_loader    = torch.utils.data.DataLoader(val_dataset,   batch_size=BATCH_SIZE)

disease_model = PlantDiseaseCNN(num_classes=num_classes)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(disease_model.parameters(), lr=0.001, weight_decay=1e-4)
scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=8, gamma=0.5)

best_val_acc = 0.0
print(f"Training for {EPOCHS} epochs...")
for epoch in range(EPOCHS):
    disease_model.train()
    total_loss, correct, total = 0.0, 0, 0
    for imgs, lbls in train_loader:
        optimizer.zero_grad()
        out = disease_model(imgs)
        loss = criterion(out, lbls)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * imgs.size(0)
        correct += (out.argmax(1) == lbls).sum().item()
        total += imgs.size(0)
    scheduler.step()

    # Validation
    disease_model.eval()
    val_correct, val_total = 0, 0
    with torch.no_grad():
        for imgs, lbls in val_loader:
            out = disease_model(imgs)
            val_correct += (out.argmax(1) == lbls).sum().item()
            val_total += imgs.size(0)

    train_acc = correct / total * 100
    val_acc   = val_correct / val_total * 100
    print(f"Epoch {epoch+1:02d}/{EPOCHS} | Loss: {total_loss/total:.4f} | Train Acc: {train_acc:.1f}% | Val Acc: {val_acc:.1f}%")

    if val_acc > best_val_acc:
        best_val_acc = val_acc
        torch.save(disease_model.state_dict(), "../ml_models/disease_detection_model.pth")

print(f"Best validation accuracy: {best_val_acc:.1f}%")
print("Plant disease detection model saved to ../ml_models/disease_detection_model.pth")
print("All models prepared successfully!")
