"use client";
import axios from "axios";
import Image from "next/image";
import { useRef, useState } from "react";

function AudioInput() {
    const [audioSrc, setAudioSrc] = useState(null);
    const audioRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInput = useRef(null); // Added this line
    const [isRecording, setIsRecording] = useState(false);
    const [output, setOutput] = useState(null);

    const handleAudioChange = (e) => {
        const file = e.target.files[0];
        const objectURL = URL.createObjectURL(file);
        setAudioSrc(objectURL);
        setSelectedFile(file);
    };
    const handleImageClick = () => {
        // Added this function
        fileInput.current.click();
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            mediaRecorderRef.current = new MediaRecorder(stream);
            const audioChunks = [];

            mediaRecorderRef.current.addEventListener(
                "dataavailable",
                (event) => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data); // Push audio data into the audioChunks array
                    }
                }
            );

            mediaRecorderRef.current.addEventListener("stop", () => {
                const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
                const audioUrl = URL.createObjectURL(audioBlob);
                setAudioSrc(audioUrl);
                setSelectedFile(audioBlob);
            });

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
        }
    };

    const handleStopRecording = () => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
        ) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSubmit = async () => {
        if (selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);
            try {
                const response = await axios.post('http://127.0.0.1:5000/predict', formData);
                const prediction = response.data;
                setOutput(prediction.prediction[0]);
            } catch (error) {
                console.error("Error:", error);
            }
        } else {
            console.log("No audio file or recording found.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center  bg-zinc-800 h-screen">
            <div className="flex flex-row items-center justify-center border  bg-zinc-700 border-zinc-400 shadow-xl w-2/5  p-10 gap-4 rounded-lg">
                <div
                    className="flex flex-col items-center justify-center p-10 border-4 border-dotted border-zinc-50 rounded-lg cursor-pointer  flex-1"
                    onClick={handleImageClick}
                >
                    <Image
                        alt="Webmotion logo"
                        height={100}
                        width={100}
                        src="/upload.png"
                    />
                    <div className="flex flex-col gap-2">
                        <h2 className="text-white text-center text-base">
                            Drag and Drop
                        </h2>
                        <h2 className="text-white text-center text-base">or</h2>
                        <button className="flex flex-row px-4 py-2 text-white rounded-full border border-zinc-500 hover:bg-zinc-600 transition-all duration-300">
                            Browse Audio Files
                        </button>
                    </div>
                    <input
                        ref={fileInput} // Added this line
                        style={{ display: "none" }} // Added this line
                        className="border-2 border-gray-300 p-2 rounded-md"
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioChange}
                    />
                </div>
                <div className="flex flex-col gap-4 flex-1 ">
                    {!isRecording ? (
                        <button
                            className="bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-white font-bold py-2 px-4 rounded-full"
                            onClick={handleStartRecording}
                            disabled={audioSrc !== null}
                        >
                            Start Recording
                        </button>
                    ) : (
                        <button
                            className="bg-red-500 hover:bg-red-700 text-white transition-all duration-300 font-bold py-2 px-4 rounded-full"
                            onClick={handleStopRecording}
                        >
                            Stop Recording
                        </button>
                    )}
                    <button
                        className="bg-green-600 hover:bg-green-700 text-white transition-all duration-300 font-bold py-2 px-4 rounded-full"
                        onClick={handleSubmit}
                    >
                        Submit
                    </button>
                    {audioSrc && (
                        <div className="mt-4 ">
                            <audio className="w-60" ref={audioRef} controls>
                                <source src={audioSrc} type="audio/wav" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AudioInput;
