import React from 'react';
import { Mic } from 'lucide-react';

const VoiceInput = ({ isListening, toggleListening }) => {
    return (
        <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-500 ease-in-out p-6 hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:scale-[1.02] ${isListening ? 'border-teal-400 ring-2 ring-teal-50' : 'border-gray-100 hover:border-teal-200'}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mic className="w-5 h-5 text-teal-600" /> Real-time Voice
            </h3>
            <div className="flex flex-col items-center justify-center py-6 gap-4">
                <button
                    onClick={toggleListening}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer border-4 ${isListening ? 'bg-red-50 border-red-100 text-red-500 animate-pulse' : 'bg-teal-50 border-teal-100 text-teal-600 hover:scale-105'}`}
                >
                    <Mic className={`w-8 h-8 ${isListening ? 'animate-bounce' : ''}`} />
                </button>
                <span className={`text-sm font-medium ${isListening ? 'text-red-500' : 'text-gray-500'}`}>
                    {isListening ? 'Listening...' : 'Click to speak'}
                </span>
            </div>
        </div>
    );
};

export default VoiceInput;
