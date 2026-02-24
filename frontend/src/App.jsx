import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ChatInterface from './components/ChatInterface';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import LandingPage from './components/LandingPage';

function App() {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('landing'); // 'landing', 'auth', 'chat'
    const [guestSessionId, setGuestSessionId] = useState(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                checkProfile(session.user.id);
                setView('chat');
            }
            else setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                setLoading(true);
                checkProfile(session.user.id);
                setView('chat');
            } else {
                setProfile(null);
                setLoading(false);
                setView('landing'); // Go to landing on logout
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data) setProfile(data);
            else setProfile(null);
        } catch (error) {
            console.error("Error checking profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGuestStart = () => {
        // Generate a random session ID for the guest
        const randomId = crypto.randomUUID();
        setGuestSessionId(randomId);
        setView('chat');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setView('landing');
        setGuestSessionId(null);
    };

    const handleExitGuest = () => {
        setGuestSessionId(null);
        setView('landing');
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-teal-600 font-bold bg-gray-50">Loading Dr. Console...</div>;
    }

    if (view === 'landing') {
        return <LandingPage onGuestStart={handleGuestStart} onLogin={() => setView('auth')} />;
    }

    if (view === 'auth') {
        if (session) {
            // Should verify profile before showing chat
            if (!profile) return <Onboarding session={session} onComplete={() => checkProfile(session.user.id)} />;
            return <ChatInterface
                session={session}
                profile={profile}
                onProfileUpdate={() => checkProfile(session.user.id)}
                onSignOut={handleLogout}
            />;
        }
        return (
            <div className="relative">
                <button
                    onClick={() => setView('landing')}
                    className="absolute top-4 left-4 text-gray-500 hover:text-gray-900 z-50 font-medium"
                >
                    &larr; Back to Home
                </button>
                <Auth />
            </div>
        );
    }

    if (view === 'chat') {
        if (session && !profile) {
            return <Onboarding session={session} onComplete={() => checkProfile(session.user.id)} />;
        }

        return (
            <ChatInterface
                session={session}
                profile={profile}
                onProfileUpdate={() => checkProfile(session.user.id)}
                onSignOut={handleLogout}
                guestSessionId={guestSessionId}
                onExitGuest={handleExitGuest}
            />
        );
    }

    return null;
}

export default App;
