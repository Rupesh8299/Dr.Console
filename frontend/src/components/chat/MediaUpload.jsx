import React, { useRef, useState, useEffect } from 'react';
import { Camera, Video, Upload, FileText, X } from 'lucide-react';

const MediaUpload = ({ selectedFile, onFileSelect, onClearFile, fileInputRef }) => {
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const extractFrameFromVideo = (videoFile) => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.playsInline = true;
            video.muted = true;
            
            const url = URL.createObjectURL(videoFile);
            video.src = url;
            
            video.onloadedmetadata = () => {
                // Seek to 25% of the video duration or 1 second, whichever is smaller
                const seekTime = Math.min(video.duration * 0.25, 1.0);
                video.currentTime = seekTime;
            };

            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(url);
                    if (blob) {
                        const file = new File([blob], `extracted_${videoFile.name.split('.')[0] || 'video'}.jpg`, { type: "image/jpeg" });
                        resolve(file);
                    } else {
                        reject(new Error("Canvas toBlob failed"));
                    }
                }, 'image/jpeg', 0.9);
            };

            video.onerror = (e) => {
                URL.revokeObjectURL(url);
                reject(e);
            };
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type.startsWith('video/')) {
            setIsExtracting(true);
            try {
                const imageFile = await extractFrameFromVideo(file);
                // Call the parent's onFileSelect with a mocked event containing the extracted image
                onFileSelect({ target: { files: [imageFile] } });
            } catch (error) {
                console.error("Failed to extract frame", error);
                alert("Failed to process video. Please upload an image instead.");
            } finally {
                setIsExtracting(false);
            }
        } else {
            // Normal image/pdf
            onFileSelect(e);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            streamRef.current = stream;
            setIsCameraOpen(true);
            
            // Allow state to render the video element first
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }, 50);
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please check your browser permissions.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], "captured_photo.jpg", { type: "image/jpeg" });
                    onFileSelect({ target: { files: [file] } });
                    stopCamera();
                }
            }, 'image/jpeg', 0.9);
        }
    };

    // Cleanup camera stream automatically on unmount to prevent green light staying on
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-500 ease-in-out hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:scale-[1.02] hover:border-teal-200">
            {isExtracting && (
                <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center rounded-2xl backdrop-blur-sm">
                    <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-2"></div>
                    <p className="text-sm font-medium text-teal-800">Extracting best frame from video...</p>
                </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-teal-600" /> Multi-Media Sharing
            </h3>

            {isCameraOpen ? (
                <div className="mb-4 flex flex-col items-center">
                    <div className="relative w-full rounded-xl overflow-hidden bg-black mb-3 border-2 border-teal-100 shadow-inner">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-48 object-cover"
                        ></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                    </div>
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={stopCamera}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={capturePhoto}
                            className="flex-1 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium flex justify-center items-center gap-2 transition-colors shadow-md shadow-teal-200"
                        >
                            <Camera className="w-5 h-5" /> Take Snapshot
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {selectedFile ? (
                        <div className="mb-4 p-3 bg-teal-50 rounded-lg flex justify-between items-center border border-teal-100">
                            <span className="text-sm text-teal-800 truncate flex-1 flex items-center gap-2">
                                {selectedFile.type.startsWith('application/pdf') ? <FileText className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                                {selectedFile.name}
                            </span>
                            <button onClick={onClearFile} className="text-red-500 hover:text-red-700 ml-2">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : null}

                    <div
                        onClick={() => fileInputRef.current.click()}
                        className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ease-out group hover:border-teal-400 hover:bg-teal-50 hover:shadow-lg hover:shadow-teal-100"
                    >
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-white transition-colors duration-300 shadow-sm">
                            <Upload className="w-6 h-6 text-gray-400 group-hover:text-teal-600 transition-colors duration-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">Upload photos, videos, or PDFs</p>
                        <p className="text-xs text-gray-500 mt-1">Drag and drop or click to browse</p>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,video/*,application/pdf"
                        className="hidden"
                    />

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <button 
                            onClick={startCamera}
                            title="Open Camera"
                            className="p-3 rounded-lg bg-gray-50 flex justify-center text-gray-600 transition-all duration-300 hover:bg-teal-50 hover:text-teal-600 hover:shadow-md hover:shadow-teal-100 hover:-translate-y-0.5"
                        >
                            <Camera className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => fileInputRef.current.click()}
                            title="Choose Document"
                            className="p-3 rounded-lg bg-gray-50 flex justify-center text-gray-600 transition-all duration-300 hover:bg-teal-50 hover:text-teal-600 hover:shadow-md hover:shadow-teal-100 hover:-translate-y-0.5"
                        >
                            <FileText className="w-5 h-5" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default MediaUpload;
