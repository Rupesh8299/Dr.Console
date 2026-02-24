import React from 'react';

const Disclaimer = () => (
    <div className="space-y-4">
        <p><strong>Medical Disclaimer:</strong></p>
        <p>
            Dr. Console is an AI-powered health assistant designed for informational purposes only.
            It is <strong>not</strong> a substitute for professional medical advice, diagnosis, or treatment.
        </p>
        <p>
            Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            Never disregard professional medical advice or delay in seeking it because of something you have read on this application.
        </p>
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="font-bold text-red-700">In Case of Emergency:</p>
            <p className="text-red-700">
                If you think you may have a medical emergency, call your doctor, go to the emergency department, or call 112 immediately.
            </p>
        </div>
    </div>
);

export default Disclaimer;
