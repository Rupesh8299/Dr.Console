import React from 'react';
import { Bot, LogIn, User, Shield, Activity, Calendar } from 'lucide-react';

const LandingPage = ({ onGuestStart, onLogin }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-500 to-cyan-600 font-sans text-white overflow-hidden relative">

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

            {/* Navigation Bar */}
            <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">Dr. Console</span>
                </div>
                <div className="hidden md:flex items-center gap-4">
                    <button
                        onClick={onLogin}
                        className="px-5 py-2 rounded-full border border-white/30 hover:bg-white/10 transition-colors font-medium text-sm flex items-center gap-2"
                    >
                        <LogIn className="w-4 h-4" /> Sign In
                    </button>
                    <button
                        onClick={onGuestStart}
                        className="px-5 py-2 bg-white text-teal-600 rounded-full font-bold text-sm shadow-lg hover:bg-teal-50 transition-transform transform hover:scale-105"
                    >
                        Start Consultation
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">

                {/* Left Text Column */}
                <div className="space-y-8 animate-in slide-in-from-left duration-700">
                    <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight">
                        Your Personal <br />
                        <span className="text-teal-200">AI Health Assistant</span>
                    </h1>
                    <p className="text-lg lg:text-xl text-teal-50 max-w-xl leading-relaxed">
                        Instant, intelligent medical triage and advice.
                        Chat with Dr. Console to understand your symptoms,
                        get health insights, and know when to seek professional care.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={onGuestStart}
                            className="px-8 py-4 bg-white text-teal-700 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 group"
                        >
                            <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                            Chat Now (Guest)
                        </button>
                        <button
                            onClick={onLogin}
                            className="px-8 py-4 bg-teal-800/40 border border-teal-400/30 text-white rounded-full font-bold text-lg hover:bg-teal-800/60 transition-all flex items-center justify-center gap-2"
                        >
                            <Shield className="w-5 h-5" />
                            Secure Login
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 text-teal-100 text-sm font-medium pt-8">
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5" />
                            <span>AI-Powered Triage</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            <span>Private & Secure</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            <span>24/7 Availability</span>
                        </div>
                    </div>
                </div>

                {/* Right Visual Column */}
                <div className="relative hidden lg:block animate-in fade-in duration-1000 delay-200">
                    <div className="absolute inset-0 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                    <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl skew-y-1 hover:skew-y-0 transition-transform duration-500">
                        {/* Mock Chat UI */}
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <div className="bg-white/90 text-gray-800 p-4 rounded-r-2xl rounded-bl-2xl shadow-sm text-sm">
                                    <p>Hello! I noticed you mentioned a headache. How long have you been experiencing this?</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 flex-row-reverse">
                                <div className="w-10 h-10 rounded-full bg-teal-700 border-2 border-white flex items-center justify-center text-white">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="bg-teal-600 text-white p-4 rounded-l-2xl rounded-br-2xl shadow-sm text-sm">
                                    <p>It started about 2 hours ago. It's mostly throbbing.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <div className="bg-white/90 text-gray-800 p-4 rounded-r-2xl rounded-bl-2xl shadow-sm text-sm">
                                    <p>I see. Are you experiencing any sensitivity to light or nausea?</p>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute -bottom-6 -right-6 bg-white text-teal-800 px-6 py-3 rounded-xl shadow-xl font-bold flex items-center gap-3 ">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            Online Now
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default LandingPage;
