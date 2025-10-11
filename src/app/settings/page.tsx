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
  ChevronRight,
  Link as LinkIcon,
  Twitter,
  Github,
  Linkedin,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { firebaseUserApi } from '@/lib/firebaseApi';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type SettingsTab = 'profile' | 'privacy' | 'notifications' | 'display';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    tagline: user?.tagline || '',
    pronouns: user?.pronouns || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    twitter: user?.socialLinks?.twitter || '',
    github: user?.socialLinks?.github || '',
    linkedin: user?.socialLinks?.linkedin || '',
    profileVisibility: 'everyone' as 'everyone' | 'followers' | 'private',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePicture || '');
  const [originalFormData, setOriginalFormData] = useState({
    name: user?.name || '',
    tagline: user?.tagline || '',
    pronouns: user?.pronouns || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    twitter: user?.socialLinks?.twitter || '',
    github: user?.socialLinks?.github || '',
    linkedin: user?.socialLinks?.linkedin || '',
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
    formData.tagline !== originalFormData.tagline ||
    formData.pronouns !== originalFormData.pronouns ||
    formData.bio !== originalFormData.bio ||
    formData.location !== originalFormData.location ||
    formData.website !== originalFormData.website ||
    formData.twitter !== originalFormData.twitter ||
    formData.github !== originalFormData.github ||
    formData.linkedin !== originalFormData.linkedin ||
    formData.profileVisibility !== originalFormData.profileVisibility;

  // Update form data when user data loads
  useEffect(() => {
    if (user) {
      const userData = {
        name: user.name || '',
        tagline: user.tagline || '',
        pronouns: user.pronouns || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        twitter: user.socialLinks?.twitter || '',
        github: user.socialLinks?.github || '',
        linkedin: user.socialLinks?.linkedin || '',
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

      // Build social links object only if at least one link is provided
      const socialLinks: { twitter?: string; github?: string; linkedin?: string } = {};
      if (formData.twitter) socialLinks.twitter = formData.twitter;
      if (formData.github) socialLinks.github = formData.github;
      if (formData.linkedin) socialLinks.linkedin = formData.linkedin;

      await firebaseUserApi.updateProfile({
        name: formData.name,
        tagline: formData.tagline || undefined,
        pronouns: formData.pronouns || undefined,
        bio: formData.bio || undefined,
        location: formData.location || undefined,
        website: formData.website || undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
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

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to log out');
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
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <User className="w-6 h-6 text-[#007AFF]" />
                        My Profile
                      </h2>
                      <p className="text-gray-600 text-sm mb-8">Update your personal information and profile settings</p>

                      {/* Profile Picture */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Profile Picture
                        </label>
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          {profilePictureUrl || user?.profilePicture ? (
                            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white flex-shrink-0">
                              <Image
                                src={profilePictureUrl || user.profilePicture || ''}
                                alt="Profile"
                                width={96}
                                height={96}
                                quality={95}
                                priority
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 bg-gradient-to-br from-[#FC4C02] to-[#FF8800] rounded-full flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
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
                        <p className="text-xs text-gray-500 mt-1">Username cannot be changed - it&apos;s your unique identifier</p>
                      </div>

                      {/* Tagline */}
                      <div>
                        <label htmlFor="tagline" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          Tagline
                        </label>
                        <input
                          type="text"
                          id="tagline"
                          value={formData.tagline}
                          onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                          maxLength={60}
                          placeholder="Your headline or current status..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] outline-none"
                        />
                        <p className="text-sm text-gray-500 mt-1">{formData.tagline.length}/60 • Appears below your name on your profile</p>
                      </div>

                      {/* Pronouns */}
                      <div>
                        <label htmlFor="pronouns" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          Pronouns
                        </label>
                        <input
                          type="text"
                          id="pronouns"
                          value={formData.pronouns}
                          onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                          maxLength={20}
                          placeholder="e.g., she/her, he/him, they/them"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] outline-none"
                        />
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

                      {/* Links Section */}
                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Links</h3>

                        {/* Website */}
                        <div className="mb-4">
                          <label htmlFor="website" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <LinkIcon className="w-4 h-4" />
                            Website
                          </label>
                          <input
                            type="url"
                            id="website"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            placeholder="https://yourwebsite.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] outline-none"
                          />
                        </div>

                        {/* Social Links */}
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="twitter" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                              <Twitter className="w-4 h-4" />
                              Twitter/X
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                              <input
                                type="text"
                                id="twitter"
                                value={formData.twitter}
                                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                placeholder="username"
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="github" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                              <Github className="w-4 h-4" />
                              GitHub
                            </label>
                            <input
                              type="text"
                              id="github"
                              value={formData.github}
                              onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                              placeholder="username"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] outline-none"
                            />
                          </div>

                          <div>
                            <label htmlFor="linkedin" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                              <Linkedin className="w-4 h-4" />
                              LinkedIn
                            </label>
                            <input
                              type="text"
                              id="linkedin"
                              value={formData.linkedin}
                              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                              placeholder="username"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] outline-none"
                            />
                          </div>
                        </div>
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
                    </div>
                  </form>
                )}

                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Shield className="w-6 h-6 text-[#007AFF]" />
                      Privacy Controls
                    </h2>
                    <p className="text-gray-600 text-sm mb-8">Control who can see your profile and content</p>

                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                          <Globe className="w-5 h-5 text-[#007AFF]" />
                          Profile Visibility
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">Control who can view your profile and sessions</p>
                      </div>
                      <div className="px-6 py-4">
                        <label htmlFor="profileVisibility" className="text-sm font-medium text-gray-700 mb-2 block">
                          Profile Access
                        </label>
                        <select
                          id="profileVisibility"
                          value={formData.profileVisibility}
                          onChange={(e) => setFormData({ ...formData, profileVisibility: e.target.value as any })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] outline-none"
                        >
                          <option value="everyone">🌐 Everyone - Your profile and sessions are visible to all users</option>
                          <option value="followers">👥 Followers Only - Only your followers can see your profile and sessions</option>
                          <option value="private">🔒 Only You - Your profile and sessions are completely private</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-2">
                          {formData.profileVisibility === 'everyone' && 'Your profile, sessions, and stats are visible to everyone.'}
                          {formData.profileVisibility === 'followers' && 'Only your followers can see your profile and sessions. You won\'t appear in suggestions.'}
                          {formData.profileVisibility === 'private' && 'Your profile is completely private. Only you can see your sessions and stats.'}
                        </p>
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex flex-col md:flex-row gap-3 pt-2">
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
                              ? 'bg-[#34C759] hover:bg-[#34C759]'
                              : 'bg-[#007AFF] hover:bg-[#0051D5]'
                        }`}
                      >
                        {isSaving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <NotificationSettings />
                )}

                {activeTab === 'display' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Globe className="w-6 h-6 text-[#007AFF]" />
                      Display Preferences
                    </h2>
                    <p className="text-gray-600 text-sm">Customize how the app looks and feels.</p>

                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-6 py-8 text-center">
                        <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="font-medium text-gray-900 mb-1">Coming Soon</h3>
                        <p className="text-sm text-gray-600">
                          Display preferences will be available in a future update
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <div className="mt-6">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-6 py-3 md:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
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
