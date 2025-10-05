'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import NotificationSettings from '@/components/NotificationSettings';
import { 
  User, 
  Shield, 
  Bell, 
  Globe,
  Mail,
  Upload,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { firebaseUserApi } from '@/lib/firebaseApi';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type SettingsTab = 'profile' | 'privacy' | 'notifications' | 'display';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    profileVisibility: 'everyone' as 'everyone' | 'followers' | 'private',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePicture || '');
  const [originalFormData, setOriginalFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    profileVisibility: (user?.profileVisibility || 'everyone') as 'everyone' | 'followers' | 'private',
  });

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'My Profile', icon: User },
    { id: 'privacy' as SettingsTab, label: 'Privacy Controls', icon: Shield },
    { id: 'notifications' as SettingsTab, label: 'Email Notifications', icon: Bell },
    { id: 'display' as SettingsTab, label: 'Display Preferences', icon: Globe },
  ];

  // Check if form has been modified
  const hasChanges = 
    formData.name !== originalFormData.name ||
    formData.bio !== originalFormData.bio ||
    formData.location !== originalFormData.location ||
    formData.profileVisibility !== originalFormData.profileVisibility;

  // Update form data when user data loads
  useEffect(() => {
    if (user) {
      const userData = {
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        profileVisibility: 'everyone' as 'everyone' | 'followers' | 'private',
      };
      setFormData({
        ...userData,
      });
      setOriginalFormData(userData);
      setProfilePictureUrl(user.profilePicture || '');
    }
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 5MB.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      
      // Upload to Firebase Storage
      const downloadURL = await firebaseUserApi.uploadProfilePicture(file);
      
      // Update profile with new picture URL
      await firebaseUserApi.updateProfile({
        profilePicture: downloadURL,
      });
      
      setProfilePictureUrl(downloadURL);
      toast.success('Profile picture updated!');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err?.message || 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await firebaseUserApi.updateProfile({
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
        profileVisibility: formData.profileVisibility,
      });
      toast.success('Profile updated successfully!');
      setSaved(true);
      
      // Reload the page after a short delay to refresh the user context
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
      setIsSaving(false);
    }
  };

  const handlePrivacySubmit = async () => {
    try {
      setIsSaving(true);
      await firebaseUserApi.updateProfile({
        profileVisibility: formData.profileVisibility,
      });
      toast.success('Privacy settings updated successfully!');
      setSaved(true);
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update privacy settings');
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header />
        </div>
        
        {/* Mobile Header */}
        <div className="md:hidden">
          <MobileHeader title="Settings" />
        </div>
        
        <div className="max-w-7xl mx-auto px-0 md:px-4 sm:px-6 lg:px-8 py-0 md:py-8">
          <div className="flex flex-col md:flex-row gap-0 md:gap-8">
            {/* Sidebar - Desktop Only */}
            <div className="hidden md:block w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-[#007AFF] text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Tabs */}
            <div className="md:hidden bg-white border-b border-gray-200">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-[#007AFF] text-[#007AFF]'
                            : 'border-transparent text-gray-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="whitespace-nowrap">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-white md:rounded-lg md:shadow-sm p-4 md:p-8">
                {activeTab === 'profile' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Profile Picture */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Profile Picture
                        </label>
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          {profilePictureUrl || user?.profilePicture ? (
                            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                              <Image
                                src={profilePictureUrl || user.profilePicture || ''}
                                alt="Profile"
                                width={160}
                                height={160}
                                quality={95}
                                priority
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0">
                              {user?.name.charAt(0).toUpperCase() || 'N'}
                            </div>
                          )}
                          <div className="flex-1">
                            <input
                              type="file"
                              id="profile-photo-upload"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              onChange={handlePhotoUpload}
                              className="hidden"
                            />
                            <label
                              htmlFor="profile-photo-upload"
                              className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full md:w-auto justify-center md:justify-start cursor-pointer ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {isUploadingPhoto ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-gray-300 border-t-[#007AFF] rounded-full animate-spin"></div>
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  Upload Photo
                                </>
                              )}
                            </label>
                            <p className="text-sm text-gray-500 mt-2">
                              JPG, PNG, GIF or WebP. Max 5MB.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Name */}
                      <div>
                        <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <User className="w-4 h-4" />
                          Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] outline-none"
                        />
                      </div>

                      {/* Username */}
                      <div>
                        <label htmlFor="username" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <User className="w-4 h-4" />
                          Username
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                          <input
                            type="text"
                            id="username"
                            value={user?.username || ''}
                            disabled
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                      </div>

                      {/* Bio */}
                      <div>
                        <label htmlFor="bio" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows={4}
                          maxLength={160}
                          placeholder="Tell us about yourself..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] outline-none resize-none"
                        />
                        <p className="text-sm text-gray-500 mt-1">{formData.bio.length}/160</p>
                      </div>

                      {/* Location */}
                      <div>
                        <label htmlFor="location" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <Globe className="w-4 h-4" />
                          Location
                        </label>
                        <input
                          type="text"
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="City, Country"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] outline-none"
                        />
                      </div>

                      {/* Account Information */}
                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                        
                        {/* Email */}
                        <div className="mb-4">
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </label>
                          <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                            {user?.email || 'No email set'}
                          </p>
                        </div>

                        {/* Membership Status */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Membership Status
                          </label>
                          <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                            Free Account
                          </p>
                        </div>
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex flex-col md:flex-row gap-3 pt-4">
                        <a
                          href={user ? `/profile/${user.username}` : '/'}
                          className="px-6 py-3 md:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-center"
                        >
                          Cancel
                        </a>
                        <button
                          type="submit"
                          disabled={isSaving || !hasChanges}
                          className={`px-6 py-3 md:py-2 rounded-lg transition-colors text-white ${
                            isSaving || !hasChanges
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : saved 
                                ? 'bg-green-600 hover:bg-green-600' 
                                : 'bg-[#007AFF] hover:bg-[#0051D5]'
                          }`}
                        >
                          {isSaving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === 'privacy' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy Controls</h2>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="profileVisibility" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <Globe className="w-4 h-4" />
                          Profile Visibility
                        </label>
                        <select
                          id="profileVisibility"
                          value={formData.profileVisibility}
                          onChange={(e) => setFormData({ ...formData, profileVisibility: e.target.value as any })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] outline-none"
                        >
                          <option value="everyone">Everyone - Your profile and sessions are visible to all users</option>
                          <option value="followers">Followers Only - Only your followers can see your profile and sessions</option>
                          <option value="private">Only You - Your profile and sessions are completely private</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-2">
                          {formData.profileVisibility === 'everyone' && 'Your profile, sessions, and stats are visible to everyone.'}
                          {formData.profileVisibility === 'followers' && 'Only your followers can see your profile and sessions. You won\'t appear in suggestions.'}
                          {formData.profileVisibility === 'private' && 'Your profile is completely private. Only you can see your sessions and stats.'}
                        </p>
                      </div>
                      
                      {/* Submit Buttons */}
                      <div className="flex flex-col md:flex-row gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, profileVisibility: originalFormData.profileVisibility })}
                          className="px-6 py-3 md:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-center"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handlePrivacySubmit}
                          disabled={isSaving || !hasChanges}
                          className={`px-6 py-3 md:py-2 rounded-lg transition-colors text-white ${
                            isSaving || !hasChanges
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : saved 
                                ? 'bg-green-600 hover:bg-green-600' 
                                : 'bg-[#007AFF] hover:bg-[#0051D5]'
                          }`}
                        >
                          {isSaving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <NotificationSettings />
                )}

                {activeTab === 'display' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Display Preferences</h2>
                    <p className="text-gray-600">Customize how the app looks and feels.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden">
          <BottomNavigation />
        </div>
      </div>
    </ProtectedRoute>
  );
}
