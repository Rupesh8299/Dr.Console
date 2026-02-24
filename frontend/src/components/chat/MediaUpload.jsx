import React from 'react';
import { Camera, Video, Upload, FileText, Activity } from 'lucide-react';

const MediaUpload = ({ selectedFile, onFileSelect, onClearFile, fileInputRef }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-500 ease-in-out hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:scale-[1.02] hover:border-teal-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-teal-600" /> Multi-Media Sharing
            </h3>

            {selectedFile ? (
                <div className="mb-4 p-3 bg-teal-50 rounded-lg flex justify-between items-center border border-teal-100">
                    <span className="text-sm text-teal-800 truncate flex-1 flex items-center gap-2">
                        {selectedFile.type.startsWith('video/') ? <Video className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                        {selectedFile.name}
                    </span>
                    <button onClick={onClearFile} className="text-red-500 hover:text-red-700 ml-2">×</button>
                </div>
            ) : null}

            <div
                onClick={() => fileInputRef.current.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ease-out group hover:border-green-400 hover:bg-green-50 hover:shadow-lg hover:shadow-green-100"
            >
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-white transition-colors duration-300 shadow-sm">
                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition-colors duration-300" />
                </div>
                <p className="text-sm font-medium text-gray-900">Upload photos, videos, or reports</p>
                <p className="text-xs text-gray-500 mt-1">Drag and drop or click to browse</p>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileSelect}
                accept="image/*,video/*"
                className="hidden"
            />

            <div className="grid grid-cols-3 gap-3 mt-4">
                <button className="p-3 rounded-lg bg-gray-50 flex justify-center text-gray-600 transition-all duration-300 hover:bg-red-50 hover:text-red-500 hover:shadow-md hover:shadow-red-100 hover:-translate-y-0.5"><Camera className="w-5 h-5" /></button>
                <button className="p-3 rounded-lg bg-gray-50 flex justify-center text-gray-600 transition-all duration-300 hover:bg-red-50 hover:text-red-500 hover:shadow-md hover:shadow-red-100 hover:-translate-y-0.5"><FileText className="w-5 h-5" /></button>
                <button className="p-3 rounded-lg bg-gray-50 flex justify-center text-gray-600 transition-all duration-300 hover:bg-red-50 hover:text-red-500 hover:shadow-md hover:shadow-red-100 hover:-translate-y-0.5"><Activity className="w-5 h-5" /></button>
            </div>
        </div>
    );
};

export default MediaUpload;
