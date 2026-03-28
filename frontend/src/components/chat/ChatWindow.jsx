import React, { useState } from 'react';
import { Activity, VolumeX, User, Stethoscope, Volume2, Send, BookOpen, ChevronDown, ChevronUp, Plus, Edit2 } from 'lucide-react';

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
    selectedFile,
    onToggleMobileTools,
    onEditSubmit
}) => {
    const [editingIndex, setEditingIndex] = useState(null);
    const [editValue, setEditValue] = useState('');

    return (
        <div className="bg-white lg:rounded-2xl lg:shadow-sm lg:border lg:border-gray-100 flex-1 flex flex-col min-h-0 lg:h-[600px] lg:flex-none relative">
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
                className="flex-1 overflow-y-auto p-4 lg:p-6 pb-40 lg:pb-6 space-y-5 bg-gray-50/50"
            >
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
                        <div className="max-w-[85%] lg:max-w-[75%] relative flex items-center gap-2">
                            
                            {/* Message Bubble or Edit Area */}
                            {msg.role === 'user' && editingIndex === index ? (
                                <div className="bg-white border-2 border-teal-500 rounded-2xl p-3 shadow-md w-full min-w-[280px]">
                                    <textarea 
                                        className="w-full text-sm text-gray-800 focus:outline-none resize-none min-h-[80px]"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button 
                                            onClick={() => setEditingIndex(null)}
                                            className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if(editValue.trim() !== msg.content) {
                                                    onEditSubmit(index, editValue.trim());
                                                }
                                                setEditingIndex(null);
                                            }}
                                            className="px-3 py-1.5 text-xs bg-teal-600 text-white hover:bg-teal-700 rounded-lg transition-colors"
                                        >
                                            Save & Send
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Edit Button (Left of User Bubble) */}
                                    {msg.role === 'user' && (
                                        <button 
                                            onClick={() => {
                                                setEditingIndex(index);
                                                setEditValue(msg.content);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-full opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                            title="Edit Message & Branch Chat"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}

                                    <div className={`px-4 py-3 shadow-sm ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-2xl rounded-br-[4px] shadow-md' : 'bg-white text-gray-800 rounded-2xl rounded-bl-[4px] border border-gray-100'}`}>
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
                                </>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] lg:max-w-[75%]">
                            <div className="bg-white px-5 py-4 rounded-2xl rounded-bl-[4px] border border-gray-100 shadow-sm h-[48px] flex items-center justify-center">
                                <div className="flex gap-1.5">
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
            <div className="absolute lg:static lg:shrink-0 bottom-0 inset-x-0 p-4 pb-6 pt-16 lg:pt-4 bg-gradient-to-t from-white via-white/95 to-transparent lg:bg-none lg:border-t lg:border-gray-100 lg:rounded-b-2xl pointer-events-none z-10">
                <div className="flex gap-1 items-center bg-white p-1.5 rounded-full shadow-lg border border-gray-200/60 focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50 transition-all max-w-4xl mx-auto pointer-events-auto">
                    <button 
                        onClick={onToggleMobileTools}
                        className="p-2.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-full lg:hidden transition-colors flex-shrink-0"
                        title="Upload Media or Use Voice"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your symptoms..."
                        className="flex-1 min-w-0 bg-transparent border-none outline-none focus:outline-none focus:ring-0 shadow-none text-gray-900 placeholder-gray-400 px-3 py-2 text-base"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={isLoading || (!input.trim() && !selectedFile)}
                        className="w-[42px] h-[42px] bg-teal-600 text-white rounded-full flex items-center justify-center hover:bg-teal-700 hover:shadow-lg disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0 transform active:scale-95"
                    >
                        <Send className="w-5 h-5 -ml-1 mt-0.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
