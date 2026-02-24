import React from 'react';
import { Activity } from 'lucide-react';

const Footer = ({ onOpenLegal }) => {
    return (
        <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200/50 mt-12 py-8 transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-teal-500/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-teal-600" />
                    <span className="text-lg font-bold text-gray-900">Dr. Console</span>
                </div>
                <p className="text-sm text-gray-500">© 2025 Dr. Console AI. All rights reserved.</p>
                <div className="flex gap-6 text-sm text-gray-500">
                    <button onClick={() => onOpenLegal('privacy')} className="hover:text-teal-600 transition-colors">Privacy Policy</button>
                    <button onClick={() => onOpenLegal('terms')} className="hover:text-teal-600 transition-colors">Terms of Service</button>
                    <button onClick={() => onOpenLegal('contact')} className="hover:text-teal-600 transition-colors">Contact Support</button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
