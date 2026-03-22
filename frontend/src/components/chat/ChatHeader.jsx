import React, { useState, useRef } from 'react';
import { Activity, Shield, LogOut, Upload, User, Camera, Plus, Settings, Menu, FileText } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import ImageCropper from './ImageCropper';

const ChatHeader = ({ triageLevel, userName, userAvatar, onProfileUpdate, onSignOut, onOpenLegal, onToggleSidebar, onGenerateReport, onEditProfile }) => {
    const isEmergency = triageLevel === 'Red';
    
    let headerBgClass = 'bg-white/20';
    if (triageLevel === 'Red') headerBgClass = 'bg-red-600/90';
    else if (triageLevel === 'Yellow') headerBgClass = 'bg-amber-100/60';
    else if (triageLevel === 'Green') headerBgClass = 'bg-teal-100/60';
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null); // URL of selected image for cropping
    const fileInputRef = useRef(null);

    // 1. File selected -> Read as URL -> Open Cropper
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setImageToCrop(reader.result);
        };
        // Reset input so same file can be selected again if needed
        e.target.value = null;
    };

    // 2. Crop Confirmed -> Upload the Blob
    const handleCropComplete = async (croppedImageBlob) => {
        setImageToCrop(null); // Close cropper
        setIsUploading(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("No user found");

            const fileName = `${user.id}/${Math.random()}.jpg`; // Force jpg
            const filePath = `${fileName}`;

            // Upload image
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, croppedImageBlob, {
                    contentType: 'image/jpeg'
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Refresh profile in parent
            onProfileUpdate();
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Failed to upload profile picture.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <header className={`shadow-sm sticky top-0 z-50 transition-colors duration-500 border-b border-white/20 backdrop-blur-md ${headerBgClass}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onToggleSidebar}
                            className={`p-2 rounded-lg hover:bg-black/5 transition-colors ${isEmergency ? 'text-white hover:bg-white/10' : 'text-gray-500'}`}
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-2">
                            <div className={`hidden lg:flex p-2 rounded-lg ${isEmergency ? 'bg-red-500' : 'bg-teal-100'}`}>
                                <Activity className={`w-6 h-6 ${isEmergency ? 'text-white' : 'text-teal-600'}`} />
                            </div>
                            <div>
                                <h1 className={`text-xl font-bold leading-none ${isEmergency ? 'text-white' : 'text-teal-900'}`}>Dr. Console</h1>
                                <p className={`text-xs font-medium ${isEmergency ? 'text-red-100' : 'text-teal-600'}`}>AI Health Assistant</p>
                            </div>
                        </div>
                    </div>
                    <div className={`flex items-center gap-4 sm:gap-6 text-sm font-medium ${isEmergency ? 'text-red-100' : 'text-gray-500'}`}>
                        <button
                            onClick={onGenerateReport}
                            className={`flex items-center justify-center p-2.5 sm:px-3 sm:py-1.5 rounded-full sm:rounded-lg border transition-colors ${isEmergency ? 'border-red-400 bg-red-500 text-white hover:bg-red-400' : 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100'}`}
                            title="Generate Medical SOAP Report"
                        >
                            <FileText className="w-4 h-4" />
                            <span className="hidden sm:inline sm:ml-1.5">Generate Report</span>
                        </button>

                        <button
                            onClick={() => onOpenLegal('disclaimer')}
                            className={`hidden lg:flex items-center gap-1 transition-colors ${isEmergency ? 'hover:text-white' : 'hover:text-teal-600'}`}
                        >
                            <Shield className="w-4 h-4" /> <span>Disclaimer</span>
                        </button>

                        {/* User Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-3 focus:outline-none"
                                title="Profile"
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden border-2 ${isEmergency ? 'bg-white text-red-600 border-red-200' : 'bg-teal-600 text-white border-teal-100 hover:border-teal-300'} transition-all`}>
                                    {userAvatar ? (
                                        <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{userName.charAt(0)}</span>
                                    )}
                                </div>
                            </button>

                            {/* Google-Style Dropdown Menu */}
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-[320px] bg-white rounded-[28px] shadow-2xl border border-gray-200 py-4 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50 text-gray-900 font-sans">
                                    {/* Close Button Mobile Overlay */}
                                    <div className="flex flex-col items-center justify-center pt-2 pb-6 relative">
                                        <button
                                            onClick={() => setIsMenuOpen(false)}
                                            className="absolute top-0 right-4 text-gray-400 hover:text-gray-600"
                                        >
                                            <span className="text-xl">&times;</span>
                                        </button>

                                        {/* User Info & Avatar */}
                                        <div className="text-sm text-gray-600 mb-4">{supabase.auth.getUser()?.email || userName}</div>

                                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-gray-200 transition-all bg-teal-600 flex items-center justify-center text-2xl font-bold text-white">
                                                {userAvatar ? (
                                                    <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{userName.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full border border-gray-100 shadow-sm">
                                                <Camera className="w-4 h-4 text-teal-600" />
                                            </div>
                                            {/* Hover overlay hint */}
                                            {isUploading ? (
                                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                                                    <div className="w-5 h-5 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                                                </div>
                                            ) : (
                                                <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Camera className="w-8 h-8 text-white" />
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="mt-3 text-xl font-normal text-gray-800">Hi, {userName}!</h3>

                                        <button 
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                if (onEditProfile) onEditProfile();
                                            }}
                                            className="mt-4 px-6 py-2 rounded-full border border-gray-300 hover:bg-gray-50 text-sm font-medium transition-colors text-teal-700"
                                        >
                                            Edit your Details
                                        </button>
                                    </div>

                                    {/* Actions Divider */}
                                    <div className="border-t border-gray-100 m-0"></div>

                                    {/* Action Buttons */}
                                    <div className="flex pt-2">
                                        <button
                                            className="flex-1 py-4 flex items-center justify-center gap-2 hover:bg-gray-50 text-sm font-medium border-r border-gray-100 rounded-bl-[28px] text-gray-700"
                                            onClick={() => alert("Feature coming soon!")}
                                        >
                                            <Plus className="w-5 h-5 text-gray-500" />
                                            Add account
                                        </button>
                                        <button
                                            className="flex-1 py-4 flex items-center justify-center gap-2 hover:bg-gray-50 text-sm font-medium rounded-br-[28px] text-gray-700"
                                            onClick={onSignOut}
                                        >
                                            <LogOut className="w-5 h-5 text-gray-500" />
                                            Sign out
                                        </button>
                                    </div>

                                    <div className="flex justify-center gap-4 text-[11px] text-gray-500 py-3 mt-1">
                                        <button onClick={() => onOpenLegal('privacy')} className="hover:text-gray-700">Privacy Policy</button>
                                        <span>•</span>
                                        <button onClick={() => onOpenLegal('terms')} className="hover:text-gray-700">Terms of Service</button>
                                    </div>
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect} // Changed to handleFileSelect
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        {/* Overlay to close menu when clicking outside */}
                        {isMenuOpen && (
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsMenuOpen(false)}
                            ></div>
                        )}
                    </div>
                </div>
            </header>

            {/* Cropper Modal */}
            {imageToCrop && (
                <ImageCropper
                    imageSrc={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setImageToCrop(null)}
                />
            )}
        </>
    );
};

export default ChatHeader;
