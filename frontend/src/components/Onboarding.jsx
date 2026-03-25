import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, MapPin, Activity, Heart, Calendar } from 'lucide-react';

const Onboarding = ({ session, onComplete, existingProfile = null, onCancel = null }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        age: '',
        gender: '',
        region: '',
        medical_history: ''
    });

    useEffect(() => {
        if (existingProfile) {
            setFormData({
                full_name: existingProfile.full_name || '',
                age: existingProfile.age || '',
                gender: existingProfile.gender || '',
                region: existingProfile.region || '',
                medical_history: existingProfile.medical_history || ''
            });
        } else if (session?.user?.user_metadata?.full_name) {
            setFormData(prev => ({ ...prev, full_name: session.user.user_metadata.full_name }));
        }
    }, [session, existingProfile]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: session.user.id,
                    full_name: formData.full_name,
                    age: parseInt(formData.age),
                    gender: formData.gender,
                    region: formData.region,
                    medical_history: formData.medical_history,
                    updated_at: new Date()
                });

            if (error) throw error;
            onComplete();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error saving profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                <div className="bg-teal-600 p-6 text-white text-center">
                    <img src="/consoleico.png" alt="Dr. Console Logo" className="w-16 h-16 mx-auto mb-4 object-contain" />
                    <h1 className="text-3xl font-bold mb-2">{existingProfile ? 'Edit Profile' : 'Welcome to Dr. Console'}</h1>
                    <p className="text-teal-100">{existingProfile ? 'Update your basic medical details below.' : 'Let\'s get to know you better for personalized care.'}</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                                <div className="relative">
                                    <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    <input
                                        type="number"
                                        required
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                        placeholder="30"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <select
                                    required
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                    <option value="Prefer not to say">Prefer not to say</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Region / Location</label>
                                <div className="relative">
                                    <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.region}
                                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                        className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                        placeholder="Mumbai, India"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Medical History (Optional)</label>
                            <div className="relative">
                                <Heart className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                                <textarea
                                    value={formData.medical_history}
                                    onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                                    className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none h-24 resize-none"
                                    placeholder="Any chronic conditions, allergies, or recent surgeries..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 w-full">
                            {onCancel && (
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="w-1/3 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors text-lg"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`${onCancel ? 'w-2/3' : 'w-full'} bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 text-lg shadow-lg`}
                            >
                                {loading ? 'Saving...' : (existingProfile ? 'Update Details' : 'Complete Setup')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
