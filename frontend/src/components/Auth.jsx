import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Activity, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

const Auth = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);


    const [fullName, setFullName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName
                        }
                    }
                });
                if (error) throw error;
                alert('Signup successful! Check your email for verification.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error) {
            alert(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full overflow-hidden flex flex-col md:flex-row max-w-4xl">

                {/* Left Side: Branding */}
                <div className="bg-teal-600 p-8 text-white flex flex-col justify-center md:w-1/2">
                    <div className="mb-6">
                        <div className="bg-white/20 p-3 rounded-xl inline-block mb-4">
                            <Activity className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Dr. Console</h1>
                        <p className="text-teal-100">Your Personal AI Health Assistant.</p>
                    </div>
                    <ul className="space-y-3 text-sm text-teal-50">
                        <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> 24/7 AI Medical Analysis</li>
                        <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Secure Health Records</li>
                        <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Emergency Triage Support</li>
                    </ul>
                </div>

                {/* Right Side: Form */}
                <div className="p-8 md:w-1/2 bg-white">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>

                    <form onSubmit={handleAuth} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {isSignUp && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-teal-600 text-white py-2 rounded-lg font-bold hover:bg-teal-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
                        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                            <path fill="#EA4335" d="M12 4.66c1.6 0 3.01.55 4.12 1.6l3.05-3.05C17.46 1.4 14.98 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>

                    <p className="mt-4 text-center text-sm text-gray-600">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="ml-1 text-teal-600 font-bold hover:underline"
                        >
                            {isSignUp ? 'Log In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
