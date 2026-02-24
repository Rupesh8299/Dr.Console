import React from 'react';
import { Stethoscope, Shield, Clock, Zap } from 'lucide-react';

const HeroSection = () => {
    return (
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
            <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-sm mb-6 border border-teal-100">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    <span className="text-sm font-medium text-teal-800">Medical Grade AI Analysis</span>
                </div>
                <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                    Your Personal <span className="text-teal-600">AI Doctor</span>
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mb-8">
                    Advanced AI technology for personalized health guidance through voice, image analysis, and natural conversation.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-gray-500">
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md shadow-sm border border-gray-100"><Shield className="w-4 h-4 text-teal-500" /> HIPAA Compliant</span>
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md shadow-sm border border-gray-100"><Clock className="w-4 h-4 text-teal-500" /> 24/7 Available</span>
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md shadow-sm border border-gray-100"><Zap className="w-4 h-4 text-teal-500" /> AI-Powered</span>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
