import React from 'react';
import { Activity, VolumeX, User, Stethoscope, Volume2, Send } from 'lucide-react';

const ChatWindow = ({
    messages,
    isLoading,
    isSpeaking,
    stopSpeaking,
    speak,
    input,
    setInput,
    handleSend,
    chatContainerRef,
    currentSessionTitle,
    selectedFile
}) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-teal-600" /> {currentSessionTitle || 'New Consultation'}
                </h3>
                <div className="flex items-center gap-3">
                    {isSpeaking && (
                        <button onClick={stopSpeaking} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200" title="Stop Speaking">
                            <VolumeX className="w-4 h-4" />
                        </button>
                    )}
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
                    </span>
                </div>
            </div>

            {/* Chat Messages */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50"
            >
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-teal-600 text-white' : 'bg-white border border-gray-200 text-teal-600'}`}>
                                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Stethoscope className="w-5 h-5" />}
                            </div>
                            <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                                {msg.media && (
                                    msg.mediaType?.startsWith('video/') ? (
                                        <video src={msg.media} controls className="max-w-full h-48 object-cover rounded-lg mb-3 border border-white/20" />
                                    ) : (
                                        <img src={msg.media} alt="User upload" className="max-w-full h-48 object-cover rounded-lg mb-3 border border-white/20" />
                                    )
                                )}
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                {msg.role === 'assistant' && (
                                    <button onClick={() => speak(msg.content)} className="mt-2 text-teal-600 hover:text-teal-800 opacity-50 hover:opacity-100 transition-opacity">
                                        <Volume2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-teal-600 flex items-center justify-center flex-shrink-0">
                                <Stethoscope className="w-5 h-5" />
                            </div>
                            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce delay-100"></span>
                                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 rounded-b-2xl">
                <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50 transition-all">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your symptoms or ask a question..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400 px-2"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={isLoading || (!input.trim() && !selectedFile)}
                        className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
