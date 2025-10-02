'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';
import { 
  User, 
  Shield, 
  Bell, 
  Globe,
  Mail,
  Upload
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { firebaseUserApi } from '@/lib/firebaseApi';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type SettingsTab = 'profile' | 'account' | 'privacy' | 'notifications' | 'display';

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

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'My Profile', icon: User },
    { id: 'account' as SettingsTab, label: 'My Account', icon: Mail },
    { id: 'privacy' as SettingsTab, label: 'Privacy Controls', icon: Shield },
    { id: 'notifications' as SettingsTab, label: 'Email Notifications', icon: Bell },
    { id: 'display' as SettingsTab, label: 'Display Preferences', icon: Globe },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await firebaseUserApi.updateProfile({
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
      });
      toast.success('Profile updated');
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-[#FC4C02] text-white'
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

            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm p-8">
                {activeTab === 'profile' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Profile Picture */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Profile Picture
                        </label>
                        <div className="flex items-center gap-4">
                          {user?.profilePicture ? (
                            <Image
                              src={user.profilePicture}
                              alt="Profile"
                              width={80}
                              height={80}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-[#FC4C02] to-[#FF8800] rounded-full flex items-center justify-center text-white text-3xl font-bold">
                              {user?.name.charAt(0).toUpperCase() || 'N'}
                            </div>
                          )}
                          <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            Upload Photo
                          </button>
                          <p className="text-sm text-gray-500">
                            JPG, PNG, GIF or WebP. Max 5MB.
                          </p>
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

                      {/* Submit Buttons */}
                      <div className="flex gap-3 pt-4">
                        <a
                          href={user ? `/profile/${user.username}` : '/'}
                          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </a>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className={`px-6 py-2 rounded-lg transition-colors text-white ${isSaving ? 'bg-gray-400 cursor-not-allowed' : saved ? 'bg-green-600 hover:bg-green-600' : 'bg-gray-900 hover:bg-gray-800'}`}
                        >
                          {isSaving ? 'Saving…' : saved ? 'Saved' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === 'account' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">My Account</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <p className="text-gray-900">{user?.email || 'user@example.com'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                        <p className="text-gray-900">@{user?.username || 'username'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Membership Status</label>
                        <p className="text-gray-900">Free Account</p>
                      </div>
                    </div>
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
                          <option value="everyone">Everyone</option>
                          <option value="followers">Followers Only</option>
                          <option value="private">Only You</option>
                        </select>
                      </div>
                      
                      <div className="pt-4">
                        <button
                          type="button"
                          className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Email Notifications</h2>
                    <p className="text-gray-600">Manage your email notification preferences.</p>
                  </div>
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
      </div>
    </ProtectedRoute>
  );
}
