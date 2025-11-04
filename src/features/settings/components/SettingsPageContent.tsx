/**
 * Settings Page Content Component (Clean Architecture)
 *
 * This component handles all settings presentation logic.
 * Extracted from the route file for better separation of concerns.
 *
 * Redesigned with modern two-column desktop layout:
 * - Mobile: Vertical expandable list (unchanged)
 * - Desktop: Left sidebar navigation + right content area
 * - Electric Blue primary color (#0066CC) for active states
 * - Smooth section transitions
 */

'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import BottomNavigation from '@/components/BottomNavigation';
import Footer from '@/components/Footer';
import {
  User,
  Shield,
  Upload,
  Link as LinkIcon,
  Twitter,
  Github,
  Linkedin,
  ChevronRight,
  LogOut,
  Trash2,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import { firebaseUserApi } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useQueryClient } from '@tanstack/react-query';
import { AUTH_KEYS } from '@/lib/react-query/auth.queries';

type SettingsSection = 'profile' | 'privacy' | null;

export function SettingsPageContent() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  // Mobile: expanded section state for accordion behavior
  const [expandedSection, setExpandedSection] = useState<SettingsSection>(null);
  // Desktop: active section state for sidebar navigation
  const [activeSection, setActiveSection] =
    useState<SettingsSection>('profile');
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
  const [profilePictureUrl, setProfilePictureUrl] = useState(
    user?.profilePicture || ''
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    profileVisibility: 'everyone' as 'everyone' | 'followers' | 'private',
  });
  const [urlError, setUrlError] = useState('');

  // URL validation helper
  const validateURL = (url: string): boolean => {
    if (!url) return true; // Optional field
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  // Settings menu structure for vertical layout (mobile)
  const settingsItems = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: User,
      navigable: true,
    },
    {
      id: 'privacy',
      label: 'Privacy Controls',
      icon: Shield,
      navigable: true,
    },
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
      toast.error('Please upload a JPEG, PNG, GIF, or WebP image');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 5MB');
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
      toast.success('Profile picture updated');
    } catch (err: unknown) {
      console.error('Upload error:', err);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      // Build social links object only if at least one link is provided
      const socialLinks: {
        twitter?: string;
        github?: string;
        linkedin?: string;
      } = {};
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
        socialLinks:
          Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        profileVisibility: formData.profileVisibility,
      });

      // Invalidate auth cache to refresh user data
      await queryClient.invalidateQueries({ queryKey: AUTH_KEYS.session() });

      toast.success('Profile updated successfully!');
      setSaved(true);
      setIsSaving(false);
    } catch (err: unknown) {
      console.error('Failed to update profile:', err);
      toast.error('Failed to update profile');
      setIsSaving(false);
    }
  };

  const handlePrivacySubmit = async () => {
    try {
      setIsSaving(true);
      await firebaseUserApi.updateProfile({
        profileVisibility: formData.profileVisibility,
      });

      // Invalidate auth cache to refresh user data
      await queryClient.invalidateQueries({ queryKey: AUTH_KEYS.session() });

      toast.success('Privacy settings updated successfully!');
      setSaved(true);
      setIsSaving(false);
    } catch (err: unknown) {
      console.error('Failed to update privacy settings:', err);
      toast.error('Failed to update privacy settings');
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to log out';
      console.error(errorMessage);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setIsDeleting(true);
      await firebaseUserApi.deleteAccount();
      toast.success('Account deleted successfully');
      // The logout will happen automatically as part of deleteAccount
    } catch (err: unknown) {
      console.error('Delete account error:', err);
      toast.error('Failed to delete account');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSectionClick = (sectionId: string) => {
    if (sectionId === 'profile' || sectionId === 'privacy') {
      setExpandedSection(
        expandedSection === sectionId ? null : (sectionId as SettingsSection)
      );
    }
  };

  // Profile Form Component (reusable for both desktop and mobile)
  const ProfileForm = ({ idPrefix = '' }: { idPrefix?: string }) => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Picture */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Profile Picture
        </label>
        <div className="flex items-center gap-6">
          {profilePictureUrl || user?.profilePicture ? (
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white flex-shrink-0">
              <Image
                src={profilePictureUrl || user?.profilePicture || ''}
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
              id={`profile-photo-upload${idPrefix}`}
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <label
              htmlFor={`profile-photo-upload${idPrefix}`}
              className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploadingPhoto ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-[#0066CC] rounded-full animate-spin"></div>
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
        <label
          htmlFor={`name${idPrefix}`}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
        >
          <User className="w-4 h-4" />
          Name
        </label>
        <input
          type="text"
          id={`name${idPrefix}`}
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] outline-none"
        />
      </div>

      {/* Username */}
      <div>
        <label
          htmlFor={`username${idPrefix}`}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
        >
          <User className="w-4 h-4" />
          Username
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            @
          </span>
          <input
            type="text"
            id={`username${idPrefix}`}
            value={user?.username || ''}
            disabled
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Username cannot be changed - it&apos;s your unique identifier
        </p>
      </div>

      {/* Tagline */}
      <div>
        <label
          htmlFor={`tagline${idPrefix}`}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
        >
          Tagline
        </label>
        <input
          type="text"
          id={`tagline${idPrefix}`}
          value={formData.tagline}
          onChange={e => setFormData({ ...formData, tagline: e.target.value })}
          maxLength={60}
          placeholder="Your headline or current status..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] outline-none"
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.tagline.length}/60 • Appears below your name on your profile
        </p>
      </div>

      {/* Pronouns */}
      <div>
        <label
          htmlFor={`pronouns${idPrefix}`}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
        >
          Pronouns
        </label>
        <input
          type="text"
          id={`pronouns${idPrefix}`}
          value={formData.pronouns}
          onChange={e => setFormData({ ...formData, pronouns: e.target.value })}
          maxLength={20}
          placeholder="e.g., she/her, he/him, they/them"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] outline-none"
        />
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor={`bio${idPrefix}`}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
        >
          Bio
        </label>
        <textarea
          id={`bio${idPrefix}`}
          value={formData.bio}
          onChange={e => setFormData({ ...formData, bio: e.target.value })}
          rows={4}
          maxLength={160}
          placeholder="Tell us about yourself..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] outline-none resize-none"
        />
        <p className="text-sm text-gray-500 mt-1">{formData.bio.length}/160</p>
      </div>

      {/* Location */}
      <div>
        <label
          htmlFor={`location${idPrefix}`}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
        >
          <Globe className="w-4 h-4" />
          Location
        </label>
        <input
          type="text"
          id={`location${idPrefix}`}
          value={formData.location}
          onChange={e => setFormData({ ...formData, location: e.target.value })}
          placeholder="City, Country"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] outline-none"
        />
      </div>

      {/* Links Section */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Links</h3>

        {/* Website */}
        <div className="mb-4">
          <label
            htmlFor={`website${idPrefix}`}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
          >
            <LinkIcon className="w-4 h-4" />
            Website
          </label>
          <input
            type="url"
            id={`website${idPrefix}`}
            value={formData.website}
            onChange={e =>
              setFormData({ ...formData, website: e.target.value })
            }
            onBlur={e => {
              const isValid = validateURL(e.target.value);
              setUrlError(
                isValid
                  ? ''
                  : 'Please enter a valid URL starting with http:// or https://'
              );
            }}
            placeholder="https://yourwebsite.com"
            pattern="https?://.*"
            aria-invalid={urlError ? 'true' : 'false'}
            aria-describedby={urlError ? `website-error${idPrefix}` : undefined}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] outline-none ${
              urlError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {urlError && (
            <p
              id={`website-error${idPrefix}`}
              className="text-sm text-red-600 mt-1"
              role="alert"
            >
              {urlError}
            </p>
          )}
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor={`twitter${idPrefix}`}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
            >
              <Twitter className="w-4 h-4" />
              Twitter/X
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                @
              </span>
              <input
                type="text"
                id={`twitter${idPrefix}`}
                value={formData.twitter}
                onChange={e =>
                  setFormData({ ...formData, twitter: e.target.value })
                }
                placeholder="username"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor={`github${idPrefix}`}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
            >
              <Github className="w-4 h-4" />
              GitHub
            </label>
            <input
              type="text"
              id={`github${idPrefix}`}
              value={formData.github}
              onChange={e =>
                setFormData({ ...formData, github: e.target.value })
              }
              placeholder="username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={`linkedin${idPrefix}`}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </label>
            <input
              type="text"
              id={`linkedin${idPrefix}`}
              value={formData.linkedin}
              onChange={e =>
                setFormData({ ...formData, linkedin: e.target.value })
              }
              placeholder="username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4">
        <a
          href={user ? `/profile/${user.username}` : '/'}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-center"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isSaving || !hasChanges}
          className={`px-6 py-2 rounded-lg transition-colors text-white ${
            isSaving || !hasChanges
              ? 'bg-gray-400 cursor-not-allowed'
              : saved
                ? 'bg-[#34C759] hover:bg-[#34C759]'
                : 'bg-[#0066CC] hover:bg-[#0051D5]'
          }`}
        >
          {isSaving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>
    </form>
  );

  // Privacy Form Component (reusable for both desktop and mobile)
  const PrivacyForm = ({ idPrefix = '' }: { idPrefix?: string }) => (
    <div className="space-y-6">
      <div>
        <label
          htmlFor={`profileVisibility${idPrefix}`}
          className="text-sm font-medium text-gray-700 mb-2 block"
        >
          Profile Visibility
        </label>
        <select
          id={`profileVisibility${idPrefix}`}
          value={formData.profileVisibility}
          onChange={e =>
            setFormData({
              ...formData,
              profileVisibility: e.target.value as
                | 'everyone'
                | 'followers'
                | 'private',
            })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] outline-none"
        >
          <option value="everyone">
            Everyone - Your profile and sessions are visible to all users
          </option>
          <option value="followers">
            Followers Only - Only your followers can see your profile and
            sessions
          </option>
          <option value="private">
            Only You - Your profile and sessions are completely private
          </option>
        </select>
        <p className="text-sm text-gray-500 mt-2">
          {formData.profileVisibility === 'everyone' &&
            'Your profile, sessions, and stats are visible to everyone.'}
          {formData.profileVisibility === 'followers' &&
            "Only your followers can see your profile and sessions. You won't appear in suggestions."}
          {formData.profileVisibility === 'private' &&
            'Your profile is completely private. Only you can see your sessions and stats.'}
        </p>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() =>
            setFormData({
              ...formData,
              profileVisibility: originalFormData.profileVisibility,
            })
          }
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handlePrivacySubmit}
          disabled={isSaving || !hasChanges}
          className={`px-6 py-2 rounded-lg transition-colors text-white ${
            isSaving || !hasChanges
              ? 'bg-gray-400 cursor-not-allowed'
              : saved
                ? 'bg-[#34C759] hover:bg-[#34C759]'
                : 'bg-[#0066CC] hover:bg-[#0051D5]'
          }`}
        >
          {isSaving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-[6.5rem] md:pb-0">
        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden">
          <MobileHeader title="Settings" showBackButton={true} />
        </div>

        {/* Desktop Two-Column Layout */}
        <div className="hidden md:block">
          <div className="max-w-5xl mx-auto py-8 px-6">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            </div>

            {/* Two-Column Layout */}
            <div className="flex gap-8">
              {/* Left Sidebar Navigation */}
              <aside className="w-60 flex-shrink-0">
                <nav
                  className="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-20"
                  aria-label="Settings navigation"
                >
                  <button
                    onClick={() => setActiveSection('profile')}
                    aria-label="My Profile settings"
                    aria-current={
                      activeSection === 'profile' ? 'page' : undefined
                    }
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left border-b border-gray-200 transition-colors ${
                      activeSection === 'profile'
                        ? 'bg-blue-50 border-l-4 border-l-[#0066CC] text-[#0066CC]'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <User
                      className="w-5 h-5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium">My Profile</span>
                  </button>

                  <button
                    onClick={() => setActiveSection('privacy')}
                    aria-label="Privacy Controls settings"
                    aria-current={
                      activeSection === 'privacy' ? 'page' : undefined
                    }
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left border-b border-gray-200 transition-colors ${
                      activeSection === 'privacy'
                        ? 'bg-blue-50 border-l-4 border-l-[#0066CC] text-[#0066CC]'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Shield
                      className="w-5 h-5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium">
                      Privacy Controls
                    </span>
                  </button>

                  <button
                    onClick={handleLogout}
                    aria-label="Log out of your account"
                    className="w-full px-4 py-3 flex items-center gap-3 text-left border-b border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    <LogOut
                      className="w-5 h-5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium">Log Out</span>
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    aria-label="Delete your account permanently"
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-red-50 transition-colors text-red-600"
                  >
                    <Trash2
                      className="w-5 h-5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium">Delete Account</span>
                  </button>
                </nav>
              </aside>

              {/* Right Content Area */}
              <main className="flex-1 min-w-0">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                  {/* Profile Section */}
                  {activeSection === 'profile' && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        My Profile
                      </h2>
                      <ProfileForm idPrefix="-desktop" />
                    </div>
                  )}

                  {/* Privacy Section */}
                  {activeSection === 'privacy' && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Privacy Controls
                      </h2>
                      <PrivacyForm idPrefix="-desktop" />
                    </div>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>

        {/* Mobile Vertical List Layout */}
        <div className="md:hidden max-w-2xl mx-auto py-6">
          {/* Page Header */}
          <div className="mb-6 px-4">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>

          {/* Vertical Settings List */}
          <div className="bg-white">
            {settingsItems.map(item => {
              const Icon = item.icon;
              const isExpanded = expandedSection === item.id;
              const contentId = `${item.id}-content`;

              return (
                <div key={item.id}>
                  <button
                    onClick={() =>
                      item.navigable && handleSectionClick(item.id)
                    }
                    aria-expanded={item.navigable ? isExpanded : undefined}
                    aria-controls={item.navigable ? contentId : undefined}
                    aria-label={`${item.label} settings`}
                    className={`w-full px-4 py-4 flex items-center justify-between border-b border-gray-200 transition-colors ${
                      item.navigable
                        ? 'hover:bg-gray-50 active:bg-gray-100'
                        : 'cursor-default'
                    }`}
                    disabled={!item.navigable}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <Icon
                          className="w-5 h-5 text-gray-700"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-sm font-semibold text-gray-900">
                          {item.label}
                        </div>
                      </div>
                    </div>
                    {item.navigable && (
                      <ChevronRight
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                        aria-hidden="true"
                      />
                    )}
                  </button>

                  {/* Expanded Profile Content */}
                  {isExpanded && item.id === 'profile' && (
                    <div
                      id={contentId}
                      role="region"
                      aria-labelledby={`${item.id}-button`}
                      className="px-4 pt-4 pb-6 bg-gray-50 border-t border-gray-200"
                    >
                      <ProfileForm idPrefix="-mobile" />
                    </div>
                  )}

                  {/* Expanded Privacy Content */}
                  {isExpanded && item.id === 'privacy' && (
                    <div
                      id={contentId}
                      role="region"
                      aria-labelledby={`${item.id}-button`}
                      className="px-4 pt-4 pb-6 bg-gray-50 border-t border-gray-200"
                    >
                      <PrivacyForm idPrefix="-mobile" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Account Actions */}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-4 flex items-center gap-3 text-left border-b border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-700" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">
                  Log Out
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-4 py-4 flex items-center gap-3 text-left border-b border-gray-200 hover:bg-red-50 active:bg-red-100 transition-colors"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-red-600">
                  Delete Account
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400 flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden">
          <BottomNavigation />
        </div>

        {/* Footer - Desktop only */}
        <Footer />

        {/* Delete Account Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteAccount}
          title="Delete Account"
          message="Are you absolutely sure you want to delete your account? This will permanently delete all your data including sessions, projects, follows, and comments. This action cannot be undone."
          confirmText="Delete My Account"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />
      </div>
    </>
  );
}
