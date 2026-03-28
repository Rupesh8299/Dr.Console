import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ChatHeader from './chat/ChatHeader';
import TriageBanner from './chat/TriageBanner';
import SessionSidebar from './chat/SessionSidebar';
import VoiceInput from './chat/VoiceInput';
import MediaUpload from './chat/MediaUpload';
import ChatWindow from './chat/ChatWindow';
import Footer from './chat/Footer';
import DeleteConfirmationModal from './chat/DeleteConfirmationModal';
import { LogOut, FileText, AlertCircle } from 'lucide-react';
import Onboarding from './Onboarding';

// Legal Components
import LegalModal from './legal/LegalModal';
import Disclaimer from './legal/Disclaimer';
import TermsOfService from './legal/TermsOfService';
import PrivacyPolicy from './legal/PrivacyPolicy';
import ContactSupport from './legal/ContactSupport';
import ReportModal from './chat/ReportModal';

const API_URL = (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`).replace(/\/$/, '');

const ChatInterface = ({ session, profile, onProfileUpdate, onSignOut, guestSessionId, onExitGuest }) => {
    const isGuest = !!guestSessionId;

    // Unique storage key per user (or 'guest') so sessions don't bleed into each other
    const storageKey = isGuest ? 'drConsole_guest' : `drConsole_${session?.user?.id || 'unknown'}`;

    const defaultWelcome = isGuest
        ? 'Hello! I am Dr. Console (Guest Mode). To ensure I provide the most accurate health guidance, could you please tell me your name, age, gender, and your primary symptom today?'
        : 'Hello! I am Dr. Console. How can I help you today?';

    // Load persisted state from localStorage on first render
    const loadSaved = (field, fallback) => {
        try {
            const saved = localStorage.getItem(`${storageKey}_${field}`);
            return saved !== null ? JSON.parse(saved) : fallback;
        } catch { return fallback; }
    };

    const [messages, setMessages] = useState(() =>
        loadSaved('messages', [{ role: 'assistant', content: defaultWelcome }])
    );
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [triageLevel, setTriageLevel] = useState(() => loadSaved('triageLevel', 'Pending'));
    const [userName, setUserName] = useState(isGuest ? 'Guest' : 'User');
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(() =>
        isGuest ? guestSessionId : loadSaved('currentSessionId', null)
    );
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Modal States
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [activeLegalPage, setActiveLegalPage] = useState(null); // 'privacy', 'terms', 'contact', 'disclaimer'

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    // Profile Edit State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    
    // Mobile Tools Drawer State
    const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
    
    const [isEmptyChatWarningOpen, setIsEmptyChatWarningOpen] = useState(false);

    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const recognitionRef = useRef(null);
    const handleSendRef = useRef(null); // always points to latest handleSend

    // --- Persist state to localStorage whenever it changes ---
    useEffect(() => {
        try {
            localStorage.setItem(`${storageKey}_messages`, JSON.stringify(messages));
        } catch { /* quota exceeded — ignore */ }
    }, [messages, storageKey]);

    useEffect(() => {
        if (!isGuest) {
            localStorage.setItem(`${storageKey}_currentSessionId`, JSON.stringify(currentSessionId));
        }
    }, [currentSessionId, isGuest, storageKey]);

    useEffect(() => {
        localStorage.setItem(`${storageKey}_triageLevel`, JSON.stringify(triageLevel));
    }, [triageLevel, storageKey]);

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
        // Automatically close sidebar after selection
        setIsSidebarOpen(false);
    };

    const handleNewChat = () => {
        if (isGuest) return;
        // Clear persisted state so the new blank session loads on refresh
        localStorage.removeItem(`${storageKey}_messages`);
        localStorage.removeItem(`${storageKey}_currentSessionId`);
        localStorage.removeItem(`${storageKey}_triageLevel`);
        setCurrentSessionId(null);
        setMessages([{ role: 'assistant', content: 'Hello! I am Dr. Console. How can I help you today?' }]);
        setTriageLevel('Pending');
        setIsSidebarOpen(false);
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
            const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
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
                // Use ref so we always call the latest handleSend (avoids stale closure)
                handleSendRef.current?.(transcript);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("❌ Speech recognition error", event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    alert(
                        "Microphone access was denied.\n\n" +
                        "To fix this:\n" +
                        "1. Click the 🔒 / ⓘ icon in your browser's address bar.\n" +
                        "2. Set Microphone to \"Allow\".\n" +
                        "3. Refresh the page and try again."
                    );
                } else if (event.error === 'network') {
                    alert("Speech recognition needs an internet connection. Please check your network.");
                } else if (event.error !== 'aborted') {
                    alert(`Speech recognition error: ${event.error}. Please try again.`);
                }
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

    const handleGenerateReport = async () => {
        const hasUserMessages = messages.some(m => m.role === 'user');
        if (!hasUserMessages) {
            setIsEmptyChatWarningOpen(true);
            return;
        }

        setIsReportModalOpen(true);
        setIsGeneratingReport(true);
        setReportData(null); // Clear previous

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (!isGuest) {
                const sessionStr = await supabase.auth.getSession();
                if (sessionStr?.data?.session?.access_token) {
                    headers['Authorization'] = `Bearer ${sessionStr.data.session.access_token}`;
                }
            }

            const res = await fetch(`${API_URL}/chat/report`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    messages,
                    user_profile: profile || null
                })
            });

            if (!res.ok) throw new Error("Failed to generate report");
            const data = await res.json();
            setReportData(data);
        } catch (error) {
            console.error(error);
            alert("Failed to generate the clinical report. Please try again.");
            setIsReportModalOpen(false);
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleEditSubmit = async (index, newText) => {
        if (!newText.trim() || isGuest) return;

        // 1. Truncate Frontend State Immediately
        const truncatedHistory = messages.slice(0, index);
        setMessages(truncatedHistory);

        // 2. Truncate Backend Database History
        if (currentSessionId) {
            try {
                const sessionStr = await supabase.auth.getSession();
                const headers = {};
                if (sessionStr?.data?.session?.access_token) {
                    headers['Authorization'] = `Bearer ${sessionStr.data.session.access_token}`;
                }
                
                await fetch(`${API_URL}/chat/branch?session_id=${currentSessionId}&keep_count=${index}`, {
                    method: 'DELETE',
                    headers
                });
            } catch (err) {
                console.error("Failed to branch chat on backend:", err);
            }
        }

        // 3. Resend the Edited Message
        // By calling handleSend with manualInput, it reads the freshly queued state
        // and appends the new text exactly where the old one was.
        handleSend(newText);
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
            if (isGuest) {
                // Guests don't have DB storage, so we must manually pass the client-side session array
                formData.append('guest_history', JSON.stringify(messages));
            }
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            const headers = {};
            if (!isGuest && session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const response = await fetch(`${API_URL}/chat`, {
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
            const newTriageLevel = data.triage_level;
            const ragSources = data.rag_sources || [];

            if (!isGuest && data.session_id && !currentSessionId) {
                setCurrentSessionId(data.session_id);
                fetchSessions();
            }

            if (newTriageLevel && newTriageLevel !== 'Pending') {
                setTriageLevel(newTriageLevel);
            }

            setMessages(prev => [...prev, { role: 'assistant', content: botResponse, ragSources }]);
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

    // Keep ref in sync so speech recognition always calls the latest handleSend
    useEffect(() => {
        handleSendRef.current = handleSend;
    });

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
        <div className="h-[100dvh] lg:h-auto lg:min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
            {/* Conditional Header: Full Header for Users, Minimal Bar for Guests */}
            {!isGuest ? (
                <ChatHeader
                    triageLevel={triageLevel}
                    userName={userName}
                    userAvatar={profile?.avatar_url}
                    onProfileUpdate={onProfileUpdate}
                    onSignOut={handleSignOut}
                    onOpenLegal={setActiveLegalPage}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    onGenerateReport={handleGenerateReport}
                    onEditProfile={() => setIsEditingProfile(true)}
                />
            ) : (
                <div className={`border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm flex-shrink-0 relative z-40 transition-colors duration-500 ${
                    triageLevel === 'Red' ? 'bg-red-600/90 backdrop-blur-md' : 
                    triageLevel === 'Yellow' ? 'bg-amber-50/80 backdrop-blur-md' : 
                    triageLevel === 'Green' ? 'bg-teal-50/80 backdrop-blur-md' : 'bg-white'
                }`}>
                    <div className="flex items-center gap-2">
                        <span className={`font-bold text-lg ${triageLevel === 'Red' ? 'text-white' : 'text-teal-700'}`}>Dr. Console</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${triageLevel === 'Red' ? 'bg-red-500 text-white' : 'bg-teal-100 text-teal-800'}`}>Guest Mode</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onExitGuest}
                            className={`font-medium flex items-center gap-1 transition-colors ${triageLevel === 'Red' ? 'text-white hover:text-gray-200' : 'text-gray-500 hover:text-red-500'}`}
                        >
                            <LogOut className="w-4 h-4" /> End Session
                        </button>
                    </div>
                </div>
            )}

            <TriageBanner triageLevel={triageLevel} />

            <main className="max-w-[95rem] w-full mx-auto px-0 lg:px-8 py-0 lg:py-8 relative lg:flex-none flex-1 min-h-0 flex flex-col">
                <div className="flex-1 lg:flex-none min-h-0 lg:h-auto flex gap-8 relative">
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
                    <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                        <div className="p-6 pb-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-lg font-bold text-gray-800">History</h2>
                            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 p-2 hover:bg-gray-100 rounded-lg transition-colors">✕</button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto flex-1">

                            {!isGuest && (
                                <div className="space-y-4">
                                    <SessionSidebar
                                        sessions={sessions}
                                        currentSessionId={currentSessionId}
                                        onSessionSelect={handleSessionSelect}
                                        onNewChat={handleNewChat}
                                        onDeleteSession={promptDeleteSession}
                                    />
                                    <button
                                        onClick={() => { setIsSidebarOpen(false); handleGenerateReport(); }}
                                        className="w-full mt-2 flex items-center justify-center gap-2 p-3 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium transition-colors"
                                    >
                                        <FileText className="w-5 h-5" />
                                        <span>Generate Report</span>
                                    </button>
                                </div>
                            )}

                            {isGuest && (
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-sm text-gray-500">Guest history is not saved.</p>
                                </div>
                            )}
                        </div>

                        {/* Legal Links Footer */}
                        <div className="p-6 pt-5 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                            <div className="flex flex-col space-y-4 text-sm font-medium text-gray-600">
                                <button onClick={() => { setIsSidebarOpen(false); setActiveLegalPage('disclaimer'); }} className="text-left hover:text-teal-600 transition-colors">Disclaimer</button>
                                <button onClick={() => { setIsSidebarOpen(false); setActiveLegalPage('privacy'); }} className="text-left hover:text-teal-600 transition-colors">Privacy</button>
                                <button onClick={() => { setIsSidebarOpen(false); setActiveLegalPage('terms'); }} className="text-left hover:text-teal-600 transition-colors">Terms</button>
                                <button onClick={() => { setIsSidebarOpen(false); setActiveLegalPage('contact'); }} className="text-left hover:text-teal-600 transition-colors">Contact</button>
                            </div>
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
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex flex-col lg:grid lg:grid-cols-3 lg:gap-8 flex-1 min-h-0">
                            
                            {/* Mobile Overlay Background */}
                            {isMobileToolsOpen && (
                                <div 
                                    className="fixed inset-0 bg-black/40 z-50 lg:hidden backdrop-blur-sm transition-opacity"
                                    onClick={() => setIsMobileToolsOpen(false)}
                                />
                            )}

                            {/* Left Column: Tools (Voice & Media) */}
                            <div className={`
                                space-y-6 lg:space-y-0
                                lg:flex lg:flex-col lg:gap-4 lg:h-[600px]
                                lg:static lg:w-auto lg:p-0 lg:bg-transparent lg:shadow-none lg:z-auto lg:rounded-none lg:translate-y-0 lg:overflow-visible
                                fixed inset-x-0 bottom-0 z-[60] bg-gray-50/95 backdrop-blur-xl p-6 pt-10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-out max-h-[85vh] overflow-y-auto
                                ${isMobileToolsOpen ? 'translate-y-0' : 'translate-y-[150%] lg:translate-y-0'}
                            `}>
                                {/* Mobile handle bar */}
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 rounded-full lg:hidden" 
                                     onClick={() => setIsMobileToolsOpen(false)} />

                                <VoiceInput
                                    isListening={isListening}
                                    toggleListening={toggleListening}
                                />

                                <MediaUpload
                                    selectedFile={selectedFile}
                                    onFileSelect={(e) => {
                                        handleFileSelect(e);
                                        setIsMobileToolsOpen(false);
                                    }}
                                    onClearFile={() => setSelectedFile(null)}
                                    fileInputRef={fileInputRef}
                                />
                            </div>

                            {/* Right Column: Chat Window */}
                            <div className="lg:col-span-2 flex-1 flex flex-col min-h-0 lg:min-h-0">
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
                                    onToggleMobileTools={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
                                    onEditSubmit={handleEditSubmit}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <div className="hidden lg:block">
                <Footer onOpenLegal={setActiveLegalPage} />
            </div>

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

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                reportData={reportData}
                patientName={isGuest ? 'Guest' : profile?.full_name || 'Anonymous User'}
                isGenerating={isGeneratingReport}
            />

            {/* Profile Editor Modal */}
            {isEditingProfile && !isGuest && (
                <div className="fixed inset-0 z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <Onboarding 
                        session={session} 
                        existingProfile={profile}
                        onComplete={() => {
                            setIsEditingProfile(false);
                            onProfileUpdate(); 
                        }}
                        onCancel={() => setIsEditingProfile(false)}
                    />
                </div>
            )}

            {/* Empty Chat Warning Modal */}
            {isEmptyChatWarningOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 transition-all duration-300">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200 fade-in">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Insufficient Information</h3>
                        <p className="text-gray-500 mb-6 text-sm">Please describe your symptoms to Doctor Console first before generating a clinical report.</p>
                        <button 
                            onClick={() => setIsEmptyChatWarningOpen(false)}
                            className="w-full py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
                        >
                            Okay
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;
