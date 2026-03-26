import React from 'react';
import { Mail, MessageSquare, Phone } from 'lucide-react';

const ContactSupport = () => (
    <div className="space-y-6">
        <p className="text-gray-600">
            Have questions or need assistance? Our support team is here to help.
        </p>

        <div className="grid gap-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-white p-2 rounded-full shadow-sm">
                    <Mail className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                    <div className="font-medium text-gray-900">Email Us</div>
                    <div className="text-sm text-teal-600">Rupesh8299@gmail.com</div>
                </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-white p-2 rounded-full shadow-sm">
                    <MessageSquare className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                    <div className="font-medium text-gray-900">Live Chat</div>
                    <div className="text-sm text-gray-500">Available All Time</div>
                </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="bg-white p-2 rounded-full shadow-sm">
                    <Phone className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                    <div className="font-medium text-gray-900">Emergency</div>
                    <div className="text-sm text-red-600 font-bold">Call 112</div>
                </div>
            </div>
        </div>
    </div>
);

export default ContactSupport;
