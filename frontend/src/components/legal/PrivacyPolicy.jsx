import React from 'react';

const PrivacyPolicy = () => (
    <div className="space-y-4 text-sm text-gray-700">
        <h3 className="font-bold text-gray-900">Data Collection</h3>
        <p>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with the AI.</p>

        <h3 className="font-bold text-gray-900">Use of Information</h3>
        <p>We use the information we collect to operate, maintain, and provide the features of Dr. Console. Your medical data is stored securely and is only used to provide personalized health context.</p>

        <h3 className="font-bold text-gray-900">Guest Mode</h3>
        <p>If you use Dr. Console in Guest Mode, your chat data is temporary and is not stored after the session ends.</p>

        <h3 className="font-bold text-gray-900">Data Security</h3>
        <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access.</p>
    </div>
);

export default PrivacyPolicy;
