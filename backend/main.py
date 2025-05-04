from flask import request, jsonify, Flask
from flask_cors import CORS
from tensorflow.keras.models import load_model
import librosa
import numpy as np
import pickle
import io

app = Flask(__name__)
CORS(app)

# ============================== #
# Audio Feature Extraction
# ============================== #
def extract_features(data):
    sample_rate = 22050
    result = np.array([])

    # ZCR
    zcr = np.mean(librosa.feature.zero_crossing_rate(y=data).T, axis=0)
    result = np.hstack((result, zcr))

    # Chroma STFT
    stft = np.abs(librosa.stft(data))
    chroma_stft = np.mean(librosa.feature.chroma_stft(S=stft, sr=sample_rate).T, axis=0)
    result = np.hstack((result, chroma_stft))

    # MFCC
    mfcc = np.mean(librosa.feature.mfcc(y=data, sr=sample_rate).T, axis=0)
    result = np.hstack((result, mfcc))

    # RMS
    rms = np.mean(librosa.feature.rms(y=data).T, axis=0)
    result = np.hstack((result, rms))

    # Mel Spectrogram
    mel = np.mean(librosa.feature.melspectrogram(y=data, sr=sample_rate).T, axis=0)
    result = np.hstack((result, mel))

    return result

def get_features(file):
    # FIXED: Load directly from file-like object
    data, sample_rate = librosa.load(io.BytesIO(file.read()), sr=22050)
    res1 = extract_features(data)
    return [np.array(res1)]

# ============================== #
# Model, Scaler, Encoder Loading
# ============================== #
def get_encoder():
    global encoder
    with open('encoder.pkl', 'rb') as file:
        encoder = pickle.load(file)
    print("Encoder Loaded!")

def get_scaler():
    global scaler
    with open('scaler.pkl', 'rb') as file:
        scaler = pickle.load(file)
    print("Scaler Loaded!")

def get_model():
    global model
    model = load_model('era.h5')
    print("Model Loaded!")

print("Loading files...")
get_model()
get_scaler()
get_encoder()

# ============================== #
# API Endpoints
# ============================== #
@app.route("/")
def running():
    return "Flask is running!"

@app.route('/predict', methods=['POST'])
def predict():
    try:
        audio_file = request.files['file']
        features = get_features(audio_file)
        x = scaler.transform(features)
        x = np.expand_dims(x, axis=2)  # Model expects shape (batch, features, 1)

        pred = model.predict(x)

        # FIXED: Use argmax to get class index from prediction
        pred_label = np.argmax(pred, axis=1)
        y_pred = encoder.inverse_transform(pred_label)

        return jsonify({'prediction': y_pred.tolist()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
