from flask import request, jsonify, Flask
from flask_cors import CORS
from tensorflow.keras.models import load_model
import librosa
import numpy as np
import pickle
import json

app = Flask(__name__)

def noise(data):
    noise_amp = 0.035*np.random.uniform()*np.amax(data)
    data = data + noise_amp*np.random.normal(size=data.shape[0])
    return data

def stretch(data, rate=0.8):
    return librosa.effects.time_stretch(data, rate = 0.8)

def shift(data):
    shift_range = int(np.random.uniform(low=-5, high = 5)*1000)
    return np.roll(data, shift_range)

def pitch(data, pitch_factor=1.0):
    if pitch_factor <= 0:
          raise ValueError("pitch_factor must be a positive number")
    return librosa.effects.pitch_shift(data, sr=sample_rate,  n_steps=pitch_factor)

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
    print(path)
    # duration and offset are used to take care of the no audio in start and the ending of each audio files as seen above.
    data, sample_rate = librosa.load(path, duration=2.5, offset=0.6)
    print(data, sample_rate)
    # without augmentation
    # res1 = extract_features(data)
    # print(res1, "re")
    # result = np.array(res1)
    # # data with noise
    # noise_data = noise(data)
    # res2 = extract_features(noise_data)
    # result = np.vstack((result, res2)) # stacking vertically        
    # print(res2, "res2")
    # # data with stretching and pitching
    # new_data = stretch(data)
    # # data_stretch_pitch = pitch(new_data, sample_rate)
    # res3 = extract_features(new_data)
    # result = np.vstack((result, res3)) 
    # print(res3, "res3")
    # print(result.shape, "result shape")
    res1 = extract_features(data)
    print(res1, "res1")
    
    # data with noise
    noise_data = noise(data)
    res2 = extract_features(noise_data)
    print(res2, "res2")
    
    # data with stretching and pitching
    new_data = stretch(data)
    res3 = extract_features(new_data)
    print(res3, "res3")
    
    # Combine all features into a single feature input
    combined_features = np.concatenate((res1, res2, res3))
    return combined_features

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
    print(audio_file)
    features = get_features(audio_file)
    
    x = scalar.transform(features)
    x = np.expand_dims(x, axis=2)
    pred = model.predict(x)
    y_pred = encoder.inverse_transform(pred)
    y_pred = np.array(y_pred.flatten()).tolist()
    json_data = json.dumps(y_pred)
    print(json_data)


    
    # Preprocess the data using the StandardScaler
    # scaled_data = scaler.transform([data])

    # # Make predictions using the trained model
    # prediction = model.predict(scaled_data)

    # You can further process the prediction if needed
    # For example, converting it to a specific format or class name

    return jsonify({'prediction':json_data})  # Return prediction as JSON

if __name__ == '__main__':
    app.run(debug=True)