"use client";
import React, { useState, useRef } from 'react';
import axios from 'axios';

function AudioInput() {
    const [audioSrc, setAudioSrc] = useState(null);
    const audioRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleAudioChange = (e) => {
        const file = e.target.files[0];
        const objectURL = URL.createObjectURL(file);
        setAudioSrc(objectURL);
        setSelectedFile(file);
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            const audioChunks = [];

            mediaRecorderRef.current.addEventListener('dataavailable', (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data); // Push audio data into the audioChunks array
                }
            });

            mediaRecorderRef.current.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                setAudioSrc(audioUrl);
                setSelectedFile(audioBlob);
            });

            mediaRecorderRef.current.start();
        } catch (err) {
            console.error('Error accessing microphone:', err);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    const handleSubmit = async () => {
        if (selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);
            try {
                const response = await axios.post('http://127.0.0.1:5000/predict', formData);
                const prediction = response.data;
                console.log(prediction.prediction[0]);
            } catch (error) {
                console.error('Error:', error);
            }
        } else {
            console.log('No audio file or recording found.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4 bg-black h-screen">
            <input className="border-2 border-gray-300 p-2 rounded-md" type="file" accept="audio/*" onChange={handleAudioChange} />
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleStartRecording} disabled={audioSrc !== null}>
                Start Recording
            </button>
            <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={handleStopRecording} disabled={audioSrc !== null}>
                Stop Recording
            </button>
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" onClick={handleSubmit}>Submit</button>
            {audioSrc && (
                <div className="mt-4">
                    <audio ref={audioRef} controls>
                        <source src={audioSrc} type="audio/wav" />
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )}
        </div>
    );
}

export default AudioInput;
