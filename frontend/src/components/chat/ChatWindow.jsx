import React, { useState } from 'react';
import { Activity, VolumeX, User, Stethoscope, Volume2, Send, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

// --- RAG Sources Panel (collapsible) ---
const SourcesPanel = ({ sources }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!sources || sources.length === 0) return null;

    return (
        <div className="mt-3 border-t border-gray-100 pt-2">
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors"
            >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Medical Sources ({sources.length})</span>
                {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isOpen && (
                <div className="mt-2 space-y-2">
                    {sources.map((src, i) => (
                        <div key={i} className="bg-teal-50 border border-teal-100 rounded-lg p-2.5">
                            <p className="text-xs font-semibold text-teal-700 mb-1">
                                📄 {src.topic || 'Medical Reference'}
                            </p>
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                                {src.content}...
                            </p>
                        </div>
                    ))}
                    <p className="text-xs text-gray-400 italic">
                        Sources: MedQuAD Medical Q&A Database
                    </p>
                </div>
            )}
        </div>
    );
};

// --- Text Formatter ---
const renderFormattedText = (text) => {
    if (!text) return '';
    const normalizedText = text.replace(/\\n/g, '\n');
    const parts = normalizedText.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
    });
};

// --- Main Chat Window ---
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
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                    {renderFormattedText(msg.content)}
                                </p>

                                {/* Voice + Sources row (AI messages only) */}
                                {msg.role === 'assistant' && (
                                    <>
                                        <button onClick={() => speak(msg.content)} className="mt-2 text-teal-600 hover:text-teal-800 opacity-50 hover:opacity-100 transition-opacity">
                                            <Volume2 className="w-4 h-4" />
                                        </button>

                                        {/* RAG Sources Panel */}
                                        <SourcesPanel sources={msg.ragSources} />
                                    </>
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
                        className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 shadow-none text-gray-900 placeholder-gray-400 px-2"
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
