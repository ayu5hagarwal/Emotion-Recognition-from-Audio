"use client";
import Image from "next/image";
import { useRef, useState } from "react";
export default function Home() {
    const [audioSrc, setAudioSrc] = useState(null);
    const audioRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInput = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [fileName, setFileName] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [result, setResult] = useState(null);

    const handleAudioChange = (e) => {
        const file = e.target.files[0];
        const objectURL = URL.createObjectURL(file);
        setAudioSrc(objectURL);
        setSelectedFile(file);
        setFileName(file.name); // Added this line
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
        setIsSubmitted(true);
        if (selectedFile) {
            const formData = new FormData();
            formData.append("file", selectedFile);
            try {
                const response = await axios.post(
                    "http://127.0.0.1:5000/predict",
                    formData
                );
                const prediction = response.data;
                setResult(prediction.prediction[0]);
            } catch (error) {
                console.error("Error:", error);
            }
        } else {
            console.log("No audio file or recording found.");
        }
    };

    // const handleSubmit = async () => {
    //     setIsSubmitted(true);
    //     if (selectedFile) {
    //         const formData = new FormData();
    //         formData.append("file", selectedFile);
    //         try {
    //             // Simulate a delay for the request
    //             await new Promise((resolve) => setTimeout(resolve, 2000));

    //             // Mock response
    //             const response = {
    //                 data: {
    //                     prediction: ["Happy"],
    //                 },
    //             };

    //             const prediction = response.data;
    //             console.log(prediction.prediction[0]);
    //             setResult(prediction.prediction[0]);
    //         } catch (error) {
    //             console.error("Error:", error);
    //         }
    //     } else {
    //         console.log("No audio file or recording found.");
    //     }
    // };

    return (
        <div className="flex flex-col items-center justify-center  bg-[#0b0c28] p-10 h-screen gap-6">
            <h1 className="text-4xl font-bold text-white">
                Emotion Recognition from Audio
            </h1>
            <div className="flex flex-col justify-center   bg-[#03030f]/50  shadow-xl w-2/5  p-10 gap-4 rounded-lg">
                <div
                    className="flex flex-col items-center justify-center p-6 border-4 border-dotted border-zinc-50/50 rounded-lg cursor-pointer  flex-1"
                    onClick={handleImageClick}
                >
                    <Image
                        alt="Webmotion logo"
                        height={50}
                        width={50}
                        src="/upload.png"
                    />
                    <div className="flex flex-col gap-2">
                        <h2 className="text-white text-center text-base">
                            Drag and Drop
                        </h2>
                        <h2 className="text-white text-center text-base">or</h2>
                        <button className="flex flex-row px-4 py-2 text-white rounded-full border border-zinc-500/50 hover:bg-zinc-600 transition-all duration-300">
                            Browse Audio Files
                        </button>
                    </div>
                    <input
                        ref={fileInput}
                        style={{ display: "none" }}
                        className="border-2 border-gray-300 p-2 rounded-md"
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioChange}
                    />
                </div>
                <div className="flex flex-col items-center gap-2   flex-1 ">
                    {!isRecording ? (
                        <>
                            {!fileName && (
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-white font-bold py-2 px-4 rounded-full min-w-44"
                                    onClick={handleStartRecording}
                                    disabled={audioSrc !== null}
                                >
                                    Start Recording
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            className="bg-red-500 hover:bg-red-700 text-white transition-all duration-300 font-bold py-2 px-4 rounded-full min-w-44"
                            onClick={handleStopRecording}
                        >
                            Stop Recording
                        </button>
                    )}
                    {!isSubmitted && (
                        <button
                            className="bg-green-600 hover:bg-green-700 text-white transition-all duration-300 font-bold py-2 px-4 rounded-full min-w-44"
                            onClick={handleSubmit}
                        >
                            Submit
                        </button>
                    )}

                    {audioSrc && (
                        <div className="mt-4 flex flex-col items-center gap-3">
                            {fileName && (
                                <p className="text-white mt-2">{fileName}</p>
                            )}{" "}
                            {/* Added this line */}
                            <audio className="w-60" ref={audioRef} controls>
                                <source src={audioSrc} type="audio/wav" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    )}

                    {result && (
                        <div className="flex flex-row gap-5 mt-5 justify-center items-center py-2 px-4 rounded-full min-w-44 border border-zinc-500/20 hover:bg-zinc-600/50 transition-all duration-300">
                            <p className="text-white ">Predicted Emotion:</p>
                            <p className="text-white font-semibold ">
                                {result}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
