import React from 'react';
import { AlertTriangle, Phone, MapPin, Stethoscope, HeartPulse } from 'lucide-react';

const TriageBanner = ({ triageLevel }) => {
    if (!triageLevel || triageLevel === 'Pending') return null;

    if (triageLevel === 'Red') {
        return (
            <div className="bg-red-600 text-white animate-pulse shadow-md z-40 relative">
                <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6" />
                        <span className="font-bold text-lg">EMERGENCY DETECTED</span>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-sm" onClick={() => window.open('tel:112')}>
                            <Phone className="w-5 h-5" /> Call 112
                        </button>
                        <button className="bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-red-800 transition-colors shadow-sm">
                            <MapPin className="w-5 h-5" /> Find Hospital
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default TriageBanner;
