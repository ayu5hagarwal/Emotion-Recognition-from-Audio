from flask import request, jsonify, Flask
from flask_cors import CORS
from tensorflow.keras.models import load_model
import librosa
import numpy as np
import pickle

app = Flask(__name__)

def extract_features(data):
    sample_rate = 22050
    # ZCR
    result = np.array([])
    zcr = np.mean(librosa.feature.zero_crossing_rate(y=data).T, axis=0)
    result=np.hstack((result, zcr)) # stacking horizontally

    # Chroma_stft
    stft = np.abs(librosa.stft(data))
    chroma_stft = np.mean(librosa.feature.chroma_stft(S=stft, sr=sample_rate).T, axis=0)
    result = np.hstack((result, chroma_stft)) # stacking horizontally

    # MFCC
    mfcc = np.mean(librosa.feature.mfcc(y=data, sr=sample_rate).T, axis=0)
    result = np.hstack((result, mfcc)) # stacking horizontally

    # Root Mean Square Value
    rms = np.mean(librosa.feature.rms(y=data).T, axis=0)
    result = np.hstack((result, rms)) # stacking horizontally

    # MelSpectogram
    mel = np.mean(librosa.feature.melspectrogram(y=data, sr=sample_rate).T, axis=0)
    result = np.hstack((result, mel)) # stacking horizontally

    return result

def get_features(path):

    # duration and offset are used to take care of the no audio in start and the ending of each audio files as seen above.
    data, sample_rate = librosa.load(path, duration=2.5, offset=0.6)
    # print(data, sample_rate)
    # without augmentation
    res1 = extract_features(data)
    # print(res1, "re")
    result = np.array(res1)
   
    return [result]

def get_encoder():
    global encoder
    with open('encoder.pkl', 'rb') as file:
        encoder = pickle.load(file)
    print("Encoder Loaded!")

def get_scaler():
    global scalar
    with open('scaler.pkl', 'rb') as file:
        scalar = pickle.load(file)
    print("Scalar Loaded!")

def get_model():
    global model
    model = load_model('era.h5')
    print("Model Loaded!")

print("Loading files...")
get_model()
get_scaler()
get_encoder()


@app.route("/")
def running():
    return "Flask is running!"

@app.route('/predict', methods=['POST'])
def predict():
    
    audio_file = request.files['file']
    # print(audio_file)
    features = get_features(audio_file)
    
    x = scalar.transform(features)
    x = np.expand_dims(x, axis=2)
    pred = model.predict(x)
    y_pred = encoder.inverse_transform(pred)
    y_pred = np.array(y_pred.flatten()).tolist()

    return jsonify({'prediction':y_pred})  

if __name__ == '__main__':
    app.run(debug=True)