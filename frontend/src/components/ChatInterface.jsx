import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ChatHeader from './chat/ChatHeader';
import EmergencyBanner from './chat/EmergencyBanner';
import SessionSidebar from './chat/SessionSidebar';
import VoiceInput from './chat/VoiceInput';
import MediaUpload from './chat/MediaUpload';
import ChatWindow from './chat/ChatWindow';
import Footer from './chat/Footer';
import DeleteConfirmationModal from './chat/DeleteConfirmationModal';
import { LogOut } from 'lucide-react';

// Legal Components
import LegalModal from './legal/LegalModal';
import Disclaimer from './legal/Disclaimer';
import TermsOfService from './legal/TermsOfService';
import PrivacyPolicy from './legal/PrivacyPolicy';
import ContactSupport from './legal/ContactSupport';

const ChatInterface = ({ session, profile, onProfileUpdate, onSignOut, guestSessionId, onExitGuest }) => {
    const isGuest = !!guestSessionId;
    const [messages, setMessages] = useState([
        { role: 'assistant', content: isGuest ? 'Hello! I am Dr. Console (Guest Mode). How can I help you today?' : 'Hello! I am Dr. Console. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isEmergency, setIsEmergency] = useState(false);
    const [userName, setUserName] = useState(isGuest ? 'Guest' : 'User');
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(isGuest ? guestSessionId : null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default retracted

    // Modal States
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [activeLegalPage, setActiveLegalPage] = useState(null); // 'privacy', 'terms', 'contact', 'disclaimer'

    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Auto-close sidebar on mobile by default
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    }, []);

    useEffect(() => {
        if (!isGuest && profile?.full_name) {
            setUserName(profile.full_name);
        } else if (!isGuest && session?.user?.user_metadata?.full_name) {
            setUserName(session.user.user_metadata.full_name);
        }

        if (!isGuest && session?.user?.id) {
            fetchSessions();
        }
    }, [session, profile, isGuest]);

    const fetchSessions = async () => {
        if (isGuest) return;
        try {
            const { data, error } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSessions(data || []);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    };

    const fetchHistory = async (sessionId) => {
        if (isGuest) return;
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data) {
                const history = data.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    media: msg.media_path,
                    mediaType: msg.media_path ? (msg.media_path.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg') : null
                }));
                setMessages(history);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const handleSessionSelect = async (sessionId) => {
        if (isGuest) return;
        setCurrentSessionId(sessionId);
        setIsLoading(true);
        await fetchHistory(sessionId);
        setIsLoading(false);
        // On mobile, close sidebar after selection
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    };

    const handleNewChat = () => {
        if (isGuest) return;
        setCurrentSessionId(null);
        setMessages([{ role: 'assistant', content: 'Hello! I am Dr. Console. How can I help you today?' }]);
        setIsEmergency(false);
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    };

    const promptDeleteSession = (sessionId) => {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            setSessionToDelete(session);
            setIsDeleteModalOpen(true);
        }
    };

    const confirmDeleteSession = async () => {
        if (!sessionToDelete || isGuest) return;

        const sessionId = sessionToDelete.id;
        try {
            const response = await fetch(`http://127.0.0.1:8000/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to delete session');

            setSessions(prev => prev.filter(s => s.id !== sessionId));

            if (currentSessionId === sessionId) {
                handleNewChat();
            }

            setIsDeleteModalOpen(false);
            setSessionToDelete(null);
        } catch (error) {
            console.error('Error deleting session:', error);
            alert('Failed to delete session');
        }
    };

    // Scroll to bottom on new message
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log("🎤 Voice Input Received:", transcript);
                setInput(transcript);
                handleSend(transcript);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("❌ Speech recognition error", event.error);
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Your browser does not support speech recognition. Please use Chrome or Edge.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            stopSpeaking();
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(voice => voice.name.includes('Google US English')) || voices[0];
            if (preferredVoice) utterance.voice = preferredVoice;
            window.speechSynthesis.speak(utterance);
        }
    };

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    const handleSend = async (manualInput = null) => {
        const textToSend = manualInput || input;

        if ((!textToSend.trim() && !selectedFile)) {
            return;
        }

        const fileType = selectedFile ? selectedFile.type : null;
        const userMessage = {
            role: 'user',
            content: textToSend,
            media: selectedFile ? URL.createObjectURL(selectedFile) : null,
            mediaType: fileType
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setSelectedFile(null);
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('message', textToSend || "Analyze this image");

            const sessionIdToSend = isGuest ? guestSessionId : currentSessionId;
            if (sessionIdToSend) {
                formData.append('session_id', sessionIdToSend);
            }
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            const headers = {};
            if (!isGuest && session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const response = await fetch('http://127.0.0.1:8000/chat', {
                method: 'POST',
                headers: headers,
                body: formData,
            });
            if (!response.ok) {
                if (response.status === 429) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || "I'm thinking too hard! Please wait a moment.");
                }
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            const botResponse = data.response;
            const emergencyStatus = data.is_emergency;

            if (!isGuest && data.session_id && !currentSessionId) {
                setCurrentSessionId(data.session_id);
                fetchSessions();
            }

            if (emergencyStatus) {
                setIsEmergency(true);
                speak("Emergency detected. Please call 1 1 2 immediately.");
            }

            setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);
            speak(botResponse);

        } catch (error) {
            console.error('❌ Error in handleSend:', error);
            const errorMessage = error.message.includes("Rate Limit") || error.message.includes("thinking too hard")
                ? error.message
                : "I'm sorry, I'm having trouble connecting to my brain right now.";
            setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        if (onSignOut) {
            onSignOut();
        } else {
            try {
                await supabase.auth.signOut();
                window.location.reload();
            } catch (error) {
                console.error("Error signing out:", error);
                window.location.reload();
            }
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const currentSessionTitle = currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title : 'New Consultation';

    const getLegalModalContent = () => {
        switch (activeLegalPage) {
            case 'disclaimer':
                return { title: 'Medical Disclaimer', content: <Disclaimer /> };
            case 'terms':
                return { title: 'Terms of Service', content: <TermsOfService /> };
            case 'privacy':
                return { title: 'Privacy Policy', content: <PrivacyPolicy /> };
            case 'contact':
                return { title: 'Contact Support', content: <ContactSupport /> };
            default:
                return { title: '', content: null };
        }
    };

    const legalContent = getLegalModalContent();

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            {/* Conditional Header: Full Header for Users, Minimal Bar for Guests */}
            {!isGuest ? (
                <ChatHeader
                    isEmergency={isEmergency}
                    userName={userName}
                    userAvatar={profile?.avatar_url}
                    onProfileUpdate={onProfileUpdate}
                    onSignOut={handleSignOut}
                    onOpenLegal={setActiveLegalPage}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />
            ) : (
                <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-teal-700 text-lg">Dr. Console</span>
                        <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full font-medium">Guest Mode</span>
                    </div>
                    <div>
                        <button
                            onClick={onExitGuest}
                            className="text-gray-500 hover:text-red-500 font-medium flex items-center gap-1 transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> End Session
                        </button>
                    </div>
                </div>
            )}

            <EmergencyBanner isEmergency={isEmergency} />

            <main className="max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
                <div className="flex gap-8 relative">
                    {/* 1. Retractable Sidebar (Chat History ONLY) */}
                    <div className={`${isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'} transition-all duration-300 ease-in-out flex-shrink-0 hidden lg:block`}>
                        <div className="space-y-6 w-80">
                            {!isGuest && (
                                <SessionSidebar
                                    sessions={sessions}
                                    currentSessionId={currentSessionId}
                                    onSessionSelect={handleSessionSelect}
                                    onNewChat={handleNewChat}
                                    onDeleteSession={promptDeleteSession}
                                />
                            )}

                            {isGuest && (
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-semibold text-gray-800 mb-2">Guest Session</h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Chat history is temporary and will be cleared when you leave.
                                    </p>
                                    <button onClick={onExitGuest} className="text-teal-600 text-sm font-medium hover:underline">
                                        Create Account to Save History
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Sidebar: Drawer (Chat History ONLY) */}
                    <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                        <div className="p-6 space-y-6 overflow-y-auto h-full">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-800">History</h2>
                                <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 p-2">✕</button>
                            </div>

                            {!isGuest && (
                                <SessionSidebar
                                    sessions={sessions}
                                    currentSessionId={currentSessionId}
                                    onSessionSelect={handleSessionSelect}
                                    onNewChat={handleNewChat}
                                    onDeleteSession={promptDeleteSession}
                                />
                            )}

                            {isGuest && (
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-sm text-gray-500">Guest history is not saved.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Overlay for mobile */}
                    {isSidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        ></div>
                    )}


                    {/* 2. Main Layout (Tools + Chat) */}
                    <div className="flex-1 min-w-0">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Tools (Voice & Media) */}
                            <div className="space-y-6">
                                <VoiceInput
                                    isListening={isListening}
                                    toggleListening={toggleListening}
                                />

                                <MediaUpload
                                    selectedFile={selectedFile}
                                    onFileSelect={handleFileSelect}
                                    onClearFile={() => setSelectedFile(null)}
                                    fileInputRef={fileInputRef}
                                />
                            </div>

                            {/* Right Column: Chat Window */}
                            <div className="lg:col-span-2">
                                <ChatWindow
                                    messages={messages}
                                    isLoading={isLoading}
                                    isSpeaking={isSpeaking}
                                    stopSpeaking={stopSpeaking}
                                    speak={speak}
                                    input={input}
                                    setInput={setInput}
                                    handleSend={handleSend}
                                    chatContainerRef={chatContainerRef}
                                    currentSessionTitle={isGuest ? 'Temporary Consultation' : currentSessionTitle}
                                    selectedFile={selectedFile}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer onOpenLegal={setActiveLegalPage} />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteSession}
                sessionTitle={sessionToDelete?.title}
            />

            {/* Reusing Modal logic for Legal Pages */}
            <LegalModal
                isOpen={!!activeLegalPage}
                title={legalContent.title}
                onClose={() => setActiveLegalPage(null)}
            >
                {legalContent.content}
            </LegalModal>
        </div>
    );
};

export default ChatInterface;
