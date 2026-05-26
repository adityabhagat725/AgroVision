import os
import io
import pickle
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import torch
import torch.nn as nn
import torchvision.transforms as transforms

app = Flask(__name__)
# Enable CORS for frontend integration
CORS(app)

# In-memory prediction history for the current session
prediction_history = []

# Model paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CROP_MODEL_PATH = os.path.join(BASE_DIR, "ml_models", "crop_recommendation_model.pkl")
DISEASE_MODEL_PATH = os.path.join(BASE_DIR, "ml_models", "disease_detection_model.pth")

# Load Crop Recommendation Model
crop_model_data = None
if os.path.exists(CROP_MODEL_PATH):
    try:
        with open(CROP_MODEL_PATH, "rb") as f:
            crop_model_data = pickle.load(f)
        print("Crop recommendation model loaded successfully.")
    except Exception as e:
        print(f"Error loading crop model: {e}")
else:
    print(f"Warning: Crop model not found at {CROP_MODEL_PATH}. Run train_models.py first.")

# Define PlantDiseaseCNN architecture (must match training script)
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
            nn.Dropout(0.5),
            nn.Linear(128, num_classes)
        )
        
    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)
        x = self.classifier(x)
        return x

# Load Plant Disease Model
disease_model = None
DISEASE_CLASSES = [
    "Tomato - Tomato Yellow Leaf Curl Virus",
    "Tomato - Late Blight",
    "Tomato - Healthy",
    "Apple - Apple Scab",
    "Apple - Black Rot",
    "Apple - Healthy",
    "Potato - Early Blight",
    "Potato - Late Blight",
    "Potato - Healthy",
    "Corn - Common Rust"
]

if os.path.exists(DISEASE_MODEL_PATH):
    try:
        disease_model = PlantDiseaseCNN(num_classes=len(DISEASE_CLASSES))
        disease_model.load_state_dict(torch.load(DISEASE_MODEL_PATH, map_location=torch.device('cpu')))
        disease_model.eval()
        print("Plant disease detection model loaded successfully.")
    except Exception as e:
        print(f"Error loading disease model: {e}")
else:
    print(f"Warning: Disease model not found at {DISEASE_MODEL_PATH}. Run train_models.py first.")

# Preprocessing for images
img_transform = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Crop metadata details
CROP_DETAILS = {
    'Rice': {
        'season': 'Kharif (Monsoon)',
        'water': 'High (requires standing water, ~1200-1500 mm)',
        'fertilizer': 'Nitrogen-rich (NPK 120:60:40 kg/ha). Apply nitrogen in split doses.',
        'description': 'Rice is a staple cereal grain that grows best in warm, humid climates with abundant rainfall and clayey/loamy soil.'
    },
    'Maize': {
        'season': 'Kharif / Rabi',
        'water': 'Moderate (requires well-drained soil, ~500-800 mm)',
        'fertilizer': 'Balanced fertilizer (NPK 120:60:40 kg/ha). Highly responsive to nitrogen.',
        'description': 'Maize (corn) is highly adaptable and prefers well-drained loamy soils with rich organic matter.'
    },
    'Chickpea': {
        'season': 'Rabi (Winter)',
        'water': 'Low (drought-tolerant, ~200-350 mm)',
        'fertilizer': 'Phosphorus-rich (NPK 20:50:20 kg/ha). Benefits from Rhizobium inoculation.',
        'description': 'Chickpea is a pulse crop that thrives in cool weather and grows well on sandy-loam soils with low moisture.'
    },
    'Kidneybeans': {
        'season': 'Rabi (Winter) / Autumn',
        'water': 'Low to Moderate (~300-400 mm)',
        'fertilizer': 'Balanced starter fertilizer (NPK 40:60:40 kg/ha). Avoid excessive nitrogen.',
        'description': 'Kidney beans (Rajma) are sensitive to waterlogging and prefer warm climates and fertile loamy soils.'
    },
    'Pigeonpeas': {
        'season': 'Kharif (Monsoon)',
        'water': 'Low (drought-tolerant, ~350-500 mm)',
        'fertilizer': 'Phosphorus-rich (NPK 20:50:20 kg/ha). Prefers organic compost addition.',
        'description': 'Pigeonpeas (Arhar) are deep-rooting pulses that grow well in warm climates and a variety of well-drained soils.'
    },
    'Mothbeans': {
        'season': 'Kharif (Monsoon)',
        'water': 'Very Low (extremely drought-resistant, ~200-300 mm)',
        'fertilizer': 'Minimal fertilizer (NPK 10:40:10 kg/ha). Nitrogen fixation satisfies requirements.',
        'description': 'Moth beans are highly drought-tolerant pulses grown primarily in arid and semi-arid sandy regions.'
    },
    'Mungbean': {
        'season': 'Summer / Kharif',
        'water': 'Low (~300-400 mm)',
        'fertilizer': 'Starter dose (NPK 20:40:20 kg/ha). Avoid over-fertilization.',
        'description': 'Mung beans (Green Gram) are short-duration pulses that grow well in hot climates and fertile loam soils.'
    },
    'Blackgram': {
        'season': 'Kharif (Monsoon)',
        'water': 'Moderate (~400-500 mm)',
        'fertilizer': 'Balanced starter (NPK 20:40:20 kg/ha). Highly responsive to phosphorus.',
        'description': 'Blackgram (Urad Dal) prefers hot, humid climates and clayey soils that retain moisture.'
    },
    'Lentil': {
        'season': 'Rabi (Winter)',
        'water': 'Low (sensitive to waterlogging, ~200-300 mm)',
        'fertilizer': 'Phosphorus-rich (NPK 20:40:20 kg/ha). Benefits from sulfur.',
        'description': 'Lentils are cool-season crops that grow best in fertile, well-drained sandy-loam soils.'
    },
    'Pomegranate': {
        'season': 'Year-round (Best fruiting in winter)',
        'water': 'Moderate (prefers dry climate, ~500-700 mm)',
        'fertilizer': 'Balanced NPK + Organic manure (50:25:25 kg/ha). Requires micronutrients like Boron.',
        'description': 'Pomegranate is a fruit crop suited to semi-arid climates, growing best in deep, loamy soils.'
    },
    'Banana': {
        'season': 'Year-round',
        'water': 'High (requires constant moisture, ~1500-2000 mm)',
        'fertilizer': 'Potassium-heavy (NPK 100:100:300 kg/ha). Heavy feeder of nutrients.',
        'description': 'Banana is a tropical crop requiring high temperatures, high humidity, and deep, well-draining soil.'
    },
    'Mango': {
        'season': 'Summer (Fruiting season)',
        'water': 'Moderate (~600-800 mm). Avoid watering during flowering.',
        'fertilizer': 'Balanced + Organic manure (NPK 100:50:100 g/tree/year). Add zinc and iron.',
        'description': 'Mango is the king of fruits, thriving in warm tropical climates and well-drained deep loamy soils.'
    },
    'Grapes': {
        'season': 'Winter/Spring (Dormancy in winter, fruiting in spring)',
        'water': 'Low to Moderate (~400-600 mm). Drip irrigation is preferred.',
        'fertilizer': 'Potassium-rich (NPK 50:30:90 kg/ha). Requires compost and magnesium.',
        'description': 'Grapes require a warm, dry summer and a cool winter, thriving in rocky or gravelly well-drained soils.'
    },
    'Watermelon': {
        'season': 'Summer',
        'water': 'Moderate (requires regular watering, ~400-600 mm)',
        'fertilizer': 'Nitrogen-rich initially, then potassium-rich (NPK 80:40:60 kg/ha).',
        'description': 'Watermelon is a warm-season crop that thrives in sandy soils with excellent drainage.'
    },
    'Muskmelon': {
        'season': 'Summer',
        'water': 'Moderate (~400-500 mm)',
        'fertilizer': 'Balanced fertilizer (NPK 80:40:60 kg/ha). Likes calcium and magnesium.',
        'description': 'Muskmelons grow best in hot, dry climates and sandy-loam soils rich in organic matter.'
    },
    'Apple': {
        'season': 'Winter / Spring (Requires chilling hours)',
        'water': 'Moderate (~800-1000 mm)',
        'fertilizer': 'Balanced NPK (70:35:70 kg/ha) + Calcium nitrate for fruit quality.',
        'description': 'Apples are temperate fruit crops requiring cold winters, moderate summers, and deep, organic-rich loams.'
    },
    'Orange': {
        'season': 'Year-round (Harvested in winter/spring)',
        'water': 'Moderate (~800-1200 mm). Sensitive to water logging.',
        'fertilizer': 'Nitrogen-rich with micronutrients (NPK 120:60:80 kg/ha). Requires zinc sprays.',
        'description': 'Oranges (Citrus fruits) prefer subtropical climates and well-aerated, deep, loamy soils.'
    },
    'Papaya': {
        'season': 'Year-round',
        'water': 'Moderate (~1000-1200 mm). Sensitive to standing water.',
        'fertilizer': 'Balanced NPK (250:250:500 g per plant per year). Highly responsive to organic manure.',
        'description': 'Papaya is a fast-growing herbaceous plant that thrives in warm tropical climates and sandy-loam soils.'
    },
    'Coconut': {
        'season': 'Year-round',
        'water': 'High (~1200-2000 mm). Thrives near coastal water tables.',
        'fertilizer': 'Potassium-rich (NPK 500:320:1200 g per palm per year). Requires common salt (NaCl).',
        'description': 'Coconut palms are tropical trees that prefer sandy soils, high humidity, and warm coastal temperatures.'
    },
    'Cotton': {
        'season': 'Kharif (Monsoon)',
        'water': 'Moderate (~700-1000 mm)',
        'fertilizer': 'Nitrogen-heavy (NPK 100:50:50 kg/ha). Split nitrogen applications.',
        'description': 'Cotton is a major cash crop that prefers warm climates, moderate rainfall, and deep, black clayey soils.'
    },
    'Jute': {
        'season': 'Kharif (Monsoon)',
        'water': 'High (~1000-1500 mm). High humidity required.',
        'fertilizer': 'Nitrogen-rich (NPK 80:40:40 kg/ha). Add organic mulch.',
        'description': 'Jute is a natural fiber crop that grows best in warm, wet climates and fertile alluvial/clayey soils.'
    },
    'Coffee': {
        'season': 'Year-round (Hill slopes)',
        'water': 'High (~1500-2000 mm). Prefers shade.',
        'fertilizer': 'Balanced NPK (120:120:120 kg/ha) + Organic mulch to preserve acidity.',
        'description': 'Coffee grows best in tropical highland slopes under shade, requiring acidic, organic-rich loamy soil.'
    }
}

# Disease metadata details
DISEASE_DETAILS = {
    "Tomato - Tomato Yellow Leaf Curl Virus": {
        "description": "Tomato Yellow Leaf Curl Virus (TYLCV) is a devastating plant virus transmitted by whiteflies. It causes severe stunting, upward leaf curling, and yellowing, preventing fruit growth if infected early.",
        "prevention": "1. Use certified virus-free seedlings.\n2. Install insect-proof mesh netting in greenhouses.\n3. Put up yellow sticky traps to capture whiteflies.\n4. Maintain a weed-free buffer zone.",
        "treatment": "1. No chemical cure exists; pull out and burn infected plants immediately.\n2. Spray neem oil, horticultural soaps, or systemic insecticides to control whiteflies.\n3. Release natural predators like ladybugs or parasitic wasps."
    },
    "Tomato - Late Blight": {
        "description": "Late Blight is caused by the oomycete Phytophthora infestans. It is highly destructive, starting as water-soaked spots on leaves and fruit that turn dark brown and rot rapidly in humid conditions.",
        "prevention": "1. Plant certified resistant tomato cultivars.\n2. Space plants widely to promote rapid foliage drying.\n3. Use drip irrigation rather than overhead sprinklers.\n4. Rotate crops annually.",
        "treatment": "1. Apply preventative copper fungicides or Bacillus subtilis products.\n2. Prune and destroy lower infected leaves.\n3. Remove severely infected plants to protect healthy neighbors."
    },
    "Tomato - Healthy": {
        "description": "The tomato foliage is healthy and showing vigorous growth. The leaf tissue is a dark green color, free of any lesions, yellowing, or abnormal curling, indicating proper nutrient uptake and excellent disease resistance.",
        "prevention": "1. Maintain consistent soil moisture.\n2. Apply organic mulch to prevent splash-borne spores.\n3. Prune suckers to optimize airflow.",
        "treatment": "No treatment required! Maintain current watering and fertilization schedules."
    },
    "Apple - Apple Scab": {
        "description": "Apple Scab is caused by the fungus Venturia inaequalis. It creates olive-green to black velvety spots on leaves and scabby lesions on apple fruits, leading to premature leaf drop and reduced vigor.",
        "prevention": "1. Choose scab-resistant apple cultivars.\n2. Rake and destroy fallen leaves in autumn to eliminate overwintering spores.\n3. Prune trees yearly to maximize sunlight and wind penetration.",
        "treatment": "1. Spray sulfur-based or copper fungicides in early spring at green tip, pink bud, and petal fall.\n2. Maintain protective spray schedules in wet seasons."
    },
    "Apple - Black Rot": {
        "description": "Black Rot, caused by the fungus Botryosphaeria obtusa, affects leaves (producing 'frogeye' purple spots), stems (forming cankers), and fruits (concentric brown decay starting from blossom end).",
        "prevention": "1. Prune out dead branches, limb cankers, and mummified fruits yearly.\n2. Disinfect pruning shears with alcohol or bleach between trees.",
        "treatment": "1. Apply protective fungicides containing Captan or copper-based compounds from bud break through harvest.\n2. Cut out branch cankers 6 inches below visible infection during dormancy."
    },
    "Apple - Healthy": {
        "description": "The apple foliage is healthy, showing optimal chlorophyll levels and strong structural integrity, with no signs of fungal or bacterial attack.",
        "prevention": "1. Annual pruning to maintain tree structure.\n2. Regular application of compost or balanced fertilizer.\n3. Periodic monitoring for early pest signs.",
        "treatment": "No treatment required. Maintain regular irrigation and orchard sanitation."
    },
    "Potato - Early Blight": {
        "description": "Early Blight is caused by the fungus Alternaria solani. It targets older lower leaves, producing dark brown, circular spots with concentric rings resembling a target board.",
        "prevention": "1. Plant certified disease-free seed tubers.\n2. Ensure proper spacing to avoid wet leaf canopies.\n3. Rotate crops on a 3-year cycle.",
        "treatment": "1. Spray protective fungicides like Mancozeb or copper fungicides at the first sign of spots.\n2. Maintain high soil fertility (nitrogen/potassium), as stressed crops are more vulnerable."
    },
    "Potato - Late Blight": {
        "description": "Late Blight is caused by the water-mold Phytophthora infestans. It thrives in cool, damp conditions, creating large dark lesions on leaves and stems that rot the foliage, accompanied by a white mold underneath.",
        "prevention": "1. Use certified blight-free seed potatoes.\n2. Destroy volunteer potato plants and discard piles.\n3. Harvest only 2 weeks after vines die to protect tubers.",
        "treatment": "1. Spray systemic fungicides immediately upon detection or high humidity warning.\n2. Remove infected vines; do not compost blight-infected plants."
    },
    "Potato - Healthy": {
        "description": "The potato leaf is fully green and shows healthy physiological growth, without early/late blight symptoms or insect damage.",
        "prevention": "1. Practice proper crop rotation.\n2. Hill soil around potato stalks to protect tubers.\n3. Use drip lines instead of overhead sprinklers.",
        "treatment": "No treatment required. Continue standard agricultural monitoring."
    },
    "Corn - Common Rust": {
        "description": "Common Rust is caused by the fungus Puccinia sorghi, generating powdery, cinnamon-brown pustules on both leaf surfaces, leading to leaf yellowing and reduced kernel weight.",
        "prevention": "1. Plant rust-resistant corn hybrids.\n2. Eradicate wood sorrel weeds, which serve as alternate hosts.\n3. Rotate crops to decompose residue.",
        "treatment": "1. Apply foliar fungicides early if pustules appear before silking.\n2. For organic farming, apply sulfur dusts or copper compounds."
    }
}

# Soil type numeric mapping
SOIL_MAPPING = {
    'Sandy': 0,
    'Clayey': 1,
    'Loamy': 2,
    'Silty': 3,
    'Peaty': 4
}

@app.route('/predict-crop', methods=['POST'])
def predict_crop():
    if crop_model_data is None:
        return jsonify({"error": "Crop model is not loaded on server."}), 500
    
    try:
        data = request.get_json()
        
        # Read parameters
        soil_type_str = data.get('soil_type', 'Loamy')
        soil_val = SOIL_MAPPING.get(soil_type_str, 2) # default to Loamy (2)
        n_val = float(data.get('N', 50))
        p_val = float(data.get('P', 50))
        k_val = float(data.get('K', 50))
        temp_val = float(data.get('temperature', 25.0))
        hum_val = float(data.get('humidity', 60.0))
        rain_val = float(data.get('rainfall', 100.0))
        ph_val = float(data.get('pH', 6.5))
        
        # Prepare input array (order must match training features: soil_type, N, P, K, temperature, humidity, rainfall, pH)
        input_features = pd.DataFrame([[soil_val, n_val, p_val, k_val, temp_val, hum_val, rain_val, ph_val]], 
                                      columns=['soil_type', 'N', 'P', 'K', 'temperature', 'humidity', 'rainfall', 'pH'])
        
        # Run prediction
        rf_model = crop_model_data['model']
        le = crop_model_data['label_encoder']
        
        pred_idx = rf_model.predict(input_features)[0]
        crop_name = le.inverse_transform([pred_idx])[0]
        
        # Calculate confidence (using predict_proba)
        probabilities = rf_model.predict_proba(input_features)[0]
        confidence = float(probabilities[pred_idx]) * 100
        
        # Fetch crop details
        details = CROP_DETAILS.get(crop_name, {
            'season': 'Unknown',
            'water': 'Unknown',
            'fertilizer': 'Unknown',
            'description': 'No description available.'
        })
        
        # Create result object
        result = {
            "type": "Crop Recommendation",
            "predicted_crop": crop_name,
            "confidence": round(confidence, 2),
            "soil_type": soil_type_str,
            "soil_type_val": soil_val,
            "N": n_val,
            "P": p_val,
            "K": k_val,
            "temperature": temp_val,
            "humidity": hum_val,
            "rainfall": rain_val,
            "pH": ph_val,
            "details": details
        }
        
        # Append to prediction history
        prediction_history.append(result)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"Failed to predict: {str(e)}"}), 400


# Mapping of crop type to its disease class indices
CROP_CLASS_MAP = {
    "Tomato": [0, 1, 2],
    "Apple":  [3, 4, 5],
    "Potato": [6, 7, 8],
    "Corn":   [9],
}

@app.route('/detect-disease', methods=['POST'])
def detect_disease():
    if disease_model is None:
        return jsonify({"error": "Disease detection model is not loaded on server."}), 500
        
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided in the request."}), 400
        
    try:
        file = request.files['image']
        crop_type = request.form.get('crop_type', '').strip()  # optional crop filter
        img_bytes = file.read()
        
        # Load and transform image
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        tensor = img_transform(img).unsqueeze(0)
        
        # Predict
        with torch.no_grad():
            outputs = disease_model(tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1)[0]  # shape: (num_classes,)

        # If a valid crop_type is provided, restrict prediction to that crop's classes
        allowed_indices = CROP_CLASS_MAP.get(crop_type, None)
        if allowed_indices:
            # Zero out all other classes and re-normalise
            masked = torch.zeros_like(probs)
            for i in allowed_indices:
                masked[i] = probs[i]
            masked = masked / masked.sum()  # re-normalise to sum=1
            confidence_val, predicted = torch.max(masked, 0)
        else:
            confidence_val, predicted = torch.max(probs, 0)

        class_idx = predicted.item()
        confidence_score = float(confidence_val.item()) * 100
        disease_name = DISEASE_CLASSES[class_idx]
            
        # Get disease description/prevention
        details = DISEASE_DETAILS.get(disease_name, {
            "description": "No description available.",
            "prevention": "No prevention methods available.",
            "treatment": "No treatment recommendations available."
        })
        
        result = {
            "type": "Disease Detection",
            "disease_name": disease_name,
            "crop_type": crop_type if crop_type else "Auto-detect",
            "confidence": round(confidence_score, 2),
            "details": details
        }
        
        prediction_history.append(result)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"Failed to analyze image: {str(e)}"}), 400


@app.route('/history', methods=['GET'])
def get_history():
    return jsonify(prediction_history)


@app.route('/history/clear', methods=['POST'])
def clear_history():
    global prediction_history
    prediction_history = []
    return jsonify({"message": "Prediction history cleared."})


if __name__ == '__main__':
    # Run Flask server locally on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
