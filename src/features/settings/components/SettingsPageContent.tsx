/**
 * Settings Page Content Component (Clean Architecture)
 *
 * This component handles all settings presentation logic.
 * Extracted from the route file for better separation of concerns.
 *
 * Duolingo-inspired design:
 * - Vibrant colors with gradient icon boxes
 * - Thick bottom borders on buttons and inputs
 * - Rounded corners (2xl for cards, xl for inputs)
 * - Light mode with white/gray backgrounds
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import MobileHeader from '@/components/MobileHeader'
import LeftSidebar from '@/components/LeftSidebar'
import BottomNavigation from '@/components/BottomNavigation'
import Footer from '@/components/Footer'
import { User, Shield, Upload, ChevronRight, LogOut, Trash2, Activity } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'
import { firebaseUserApi } from '@/lib/api'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useQueryClient } from '@tanstack/react-query'
import { AUTH_KEYS } from '@/lib/react-query/auth.queries'
import type { AuthUser } from '@/types'

type SettingsSection = 'profile' | 'privacy' | null

type ProfileFormState = {
  name: string
  tagline: string
  pronouns: string
  bio: string
  location: string
  website: string
  twitter: string
  github: string
  linkedin: string
  profileVisibility: 'everyone' | 'followers' | 'private'
}

export function SettingsPageContent() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  // Mobile: expanded section state for accordion behavior
  const [expandedSection, setExpandedSection] = useState<SettingsSection>(null)
  // Desktop: active section state for sidebar navigation
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [formData, setFormData] = useState<ProfileFormState>({
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
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePicture || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [originalFormData, setOriginalFormData] = useState<ProfileFormState>({
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
  })
  const [urlError, setUrlError] = useState('')

  // URL validation helper
  const validateURL = useCallback((url: string): boolean => {
    if (!url) return true
    try {
      new URL(url)
      return url.startsWith('http://') || url.startsWith('https://')
    } catch {
      return false
    }
  }, [])

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
    {
      id: 'activities',
      label: 'Activities',
      icon: Activity,
      navigable: true,
      isLink: true,
      href: '/settings/activities',
    },
  ]

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
    formData.profileVisibility !== originalFormData.profileVisibility

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
      }
      setFormData({
        ...userData,
      })
      setOriginalFormData(userData)
      setProfilePictureUrl(user.profilePicture || '')
    }
  }, [user])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return
    }

    try {
      setIsUploadingPhoto(true)

      // Upload to Firebase Storage
      const downloadURL = await firebaseUserApi.uploadProfilePicture(file)

      // Update profile with new picture URL
      await firebaseUserApi.updateProfile({
        profilePicture: downloadURL,
      })

      setProfilePictureUrl(downloadURL)
    } catch (_err: unknown) {
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSaving(true)

      // Build social links object only if at least one link is provided
      const socialLinks: {
        twitter?: string
        github?: string
        linkedin?: string
      } = {}
      if (formData.twitter) socialLinks.twitter = formData.twitter
      if (formData.github) socialLinks.github = formData.github
      if (formData.linkedin) socialLinks.linkedin = formData.linkedin

      await firebaseUserApi.updateProfile({
        name: formData.name,
        tagline: formData.tagline || undefined,
        pronouns: formData.pronouns || undefined,
        bio: formData.bio || undefined,
        location: formData.location || undefined,
        website: formData.website || undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        profileVisibility: formData.profileVisibility,
      })

      // Invalidate auth cache to refresh user data
      await queryClient.invalidateQueries({ queryKey: AUTH_KEYS.session() })

      setSaved(true)
      setIsSaving(false)
    } catch (_err: unknown) {
      setIsSaving(false)
    }
  }

  const handlePrivacySubmit = async () => {
    try {
      setIsSaving(true)
      await firebaseUserApi.updateProfile({
        profileVisibility: formData.profileVisibility,
      })

      // Invalidate auth cache to refresh user data
      await queryClient.invalidateQueries({ queryKey: AUTH_KEYS.session() })

      setSaved(true)
      setIsSaving(false)
    } catch (_err: unknown) {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (_err: unknown) {
      // Logout failed, but user will remain authenticated
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    try {
      setIsDeleting(true)
      await firebaseUserApi.deleteAccount()
      // The logout will happen automatically as part of deleteAccount
    } catch (_err: unknown) {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleSectionClick = (sectionId: string) => {
    if (sectionId === 'profile' || sectionId === 'privacy') {
      setExpandedSection(expandedSection === sectionId ? null : (sectionId as SettingsSection))
    }
  }

  // Memoized change handlers to prevent re-renders on every keystroke
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, name: e.target.value }))
  }, [])

  const handleTaglineChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, tagline: e.target.value }))
  }, [])

  const handlePronounsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, pronouns: e.target.value }))
  }, [])

  const handleBioChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, bio: e.target.value }))
  }, [])

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, location: e.target.value }))
  }, [])

  const handleWebsiteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, website: e.target.value }))
  }, [])

  const handleWebsiteBlur = useCallback(
    (value: string) => {
      const isValid = validateURL(value)
      setUrlError(isValid ? '' : 'Please enter a valid URL starting with http:// or https://')
    },
    [validateURL]
  )

  const handleTwitterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, twitter: e.target.value }))
  }, [])

  const handleGithubChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, github: e.target.value }))
  }, [])

  const handleLinkedinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, linkedin: e.target.value }))
  }, [])

  const handleProfileVisibilityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      profileVisibility: e.target.value as 'everyone' | 'followers' | 'private',
    }))
  }, [])

  const handlePrivacyReset = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      profileVisibility: originalFormData.profileVisibility,
    }))
  }, [originalFormData.profileVisibility])

  // Profile Form Component (reusable for both desktop and mobile)
  return (
    <>
      <div className="min-h-screen flex flex-col bg-white">
        {/* Mobile Header */}
        <MobileHeader title="Settings" showBackButton={true} />

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="flex justify-center">
            {/* Left Sidebar - Fixed, hidden on mobile */}
            <div className="hidden lg:block flex-shrink-0">
              <LeftSidebar />
            </div>

            {/* Content Area - with left margin on desktop for fixed sidebar */}
            <div className="flex-1 lg:ml-[256px]">
              {/* Desktop Two-Column Layout */}
              <div className="hidden md:block">
                <div className="max-w-4xl mx-auto py-8 px-6">
                  {/* Page Header */}
                  <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-[#3C3C3C]">Settings</h1>
                  </div>

                  {/* Two-Column Layout */}
                  <div className="flex gap-6">
                    {/* Left Sidebar Navigation */}
                    <aside className="w-64 flex-shrink-0">
                      <nav
                        className="bg-white rounded-2xl border-2 border-[#E5E5E5] overflow-hidden sticky top-20"
                        aria-label="Settings navigation"
                      >
                        <button
                          onClick={() => setActiveSection('profile')}
                          aria-label="My Profile settings"
                          aria-current={activeSection === 'profile' ? 'page' : undefined}
                          className={`w-full px-4 py-4 flex items-center gap-3 text-left border-b-2 border-[#E5E5E5] transition-all ${
                            activeSection === 'profile' ? 'bg-[#DDF4FF]' : 'hover:bg-[#F7F7F7]'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              activeSection === 'profile'
                                ? 'bg-gradient-to-br from-[#1CB0F6] to-[#0088CC]'
                                : 'bg-[#E5E5E5]'
                            }`}
                          >
                            <User
                              className={`w-5 h-5 ${activeSection === 'profile' ? 'text-white' : 'text-[#777777]'}`}
                              strokeWidth={2.5}
                              aria-hidden="true"
                            />
                          </div>
                          <span
                            className={`text-sm font-bold ${activeSection === 'profile' ? 'text-[#1CB0F6]' : 'text-[#3C3C3C]'}`}
                          >
                            My Profile
                          </span>
                        </button>

                        <button
                          onClick={() => setActiveSection('privacy')}
                          aria-label="Privacy Controls settings"
                          aria-current={activeSection === 'privacy' ? 'page' : undefined}
                          className={`w-full px-4 py-4 flex items-center gap-3 text-left border-b-2 border-[#E5E5E5] transition-all ${
                            activeSection === 'privacy' ? 'bg-[#DDF4FF]' : 'hover:bg-[#F7F7F7]'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              activeSection === 'privacy'
                                ? 'bg-gradient-to-br from-[#CE82FF] to-[#A855F7]'
                                : 'bg-[#E5E5E5]'
                            }`}
                          >
                            <Shield
                              className={`w-5 h-5 ${activeSection === 'privacy' ? 'text-white' : 'text-[#777777]'}`}
                              strokeWidth={2.5}
                              aria-hidden="true"
                            />
                          </div>
                          <span
                            className={`text-sm font-bold ${activeSection === 'privacy' ? 'text-[#A855F7]' : 'text-[#3C3C3C]'}`}
                          >
                            Privacy Controls
                          </span>
                        </button>

                        <a
                          href="/settings/activities"
                          aria-label="Activities settings"
                          className="w-full px-4 py-4 flex items-center gap-3 text-left border-b-2 border-[#E5E5E5] transition-all hover:bg-[#F7F7F7]"
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#E5E5E5]">
                            <Activity
                              className="w-5 h-5 text-[#777777]"
                              strokeWidth={2.5}
                              aria-hidden="true"
                            />
                          </div>
                          <span className="text-sm font-bold text-[#3C3C3C]">Activities</span>
                        </a>

                        <button
                          onClick={handleLogout}
                          aria-label="Log out of your account"
                          className="w-full px-4 py-4 flex items-center gap-3 text-left border-b-2 border-[#E5E5E5] hover:bg-[#F7F7F7] transition-all"
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#E5E5E5]">
                            <LogOut
                              className="w-5 h-5 text-[#777777]"
                              strokeWidth={2.5}
                              aria-hidden="true"
                            />
                          </div>
                          <span className="text-sm font-bold text-[#3C3C3C]">Log Out</span>
                        </button>

                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          aria-label="Delete your account permanently"
                          className="w-full px-4 py-4 flex items-center gap-3 text-left hover:bg-red-50 transition-all"
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#FFE5E5]">
                            <Trash2
                              className="w-5 h-5 text-[#FF4B4B]"
                              strokeWidth={2.5}
                              aria-hidden="true"
                            />
                          </div>
                          <span className="text-sm font-bold text-[#FF4B4B]">Delete Account</span>
                        </button>
                      </nav>
                    </aside>

                    {/* Right Content Area */}
                    <main className="flex-1 min-w-0">
                      <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-8">
                        {/* Profile Section */}
                        {activeSection === 'profile' && (
                          <div>
                            <h2 className="text-2xl font-extrabold text-[#3C3C3C] mb-6">
                              My Profile
                            </h2>
                            <ProfileFormSection
                              idPrefix="-desktop"
                              user={user}
                              formData={formData}
                              profilePictureUrl={profilePictureUrl}
                              isUploadingPhoto={isUploadingPhoto}
                              isSaving={isSaving}
                              saved={saved}
                              hasChanges={hasChanges}
                              urlError={urlError}
                              onSubmit={handleSubmit}
                              onPhotoUpload={handlePhotoUpload}
                              onNameChange={handleNameChange}
                              onTaglineChange={handleTaglineChange}
                              onPronounsChange={handlePronounsChange}
                              onBioChange={handleBioChange}
                              onLocationChange={handleLocationChange}
                              onWebsiteChange={handleWebsiteChange}
                              onWebsiteBlur={handleWebsiteBlur}
                              onTwitterChange={handleTwitterChange}
                              onGithubChange={handleGithubChange}
                              onLinkedinChange={handleLinkedinChange}
                            />
                          </div>
                        )}

                        {/* Privacy Section */}
                        {activeSection === 'privacy' && (
                          <div>
                            <h2 className="text-2xl font-extrabold text-[#3C3C3C] mb-6">
                              Privacy Controls
                            </h2>
                            <PrivacyFormSection
                              idPrefix="-desktop"
                              profileVisibility={formData.profileVisibility}
                              isSaving={isSaving}
                              hasChanges={hasChanges}
                              saved={saved}
                              onVisibilityChange={handleProfileVisibilityChange}
                              onReset={handlePrivacyReset}
                              onSubmit={handlePrivacySubmit}
                            />
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
                  <h1 className="text-2xl font-extrabold text-[#3C3C3C]">Settings</h1>
                </div>

                {/* Vertical Settings List */}
                <div className="bg-white mx-4 rounded-2xl border-2 border-[#E5E5E5] overflow-hidden">
                  {settingsItems.map((item) => {
                    const Icon = item.icon
                    const isExpanded = expandedSection === item.id
                    const contentId = `${item.id}-content`

                    // Get gradient colors based on item type
                    const getGradient = (id: string, active: boolean) => {
                      if (!active) return 'bg-[#E5E5E5]'
                      switch (id) {
                        case 'profile':
                          return 'bg-gradient-to-br from-[#1CB0F6] to-[#0088CC]'
                        case 'privacy':
                          return 'bg-gradient-to-br from-[#CE82FF] to-[#A855F7]'
                        case 'activities':
                          return 'bg-gradient-to-br from-[#58CC02] to-[#45A000]'
                        default:
                          return 'bg-[#E5E5E5]'
                      }
                    }

                    return (
                      <div key={item.id}>
                        {item.isLink ? (
                          <a
                            href={item.href}
                            aria-label={`${item.label} settings`}
                            className="w-full px-4 py-4 flex items-center justify-between border-b-2 border-[#E5E5E5] transition-all hover:bg-[#F7F7F7] active:bg-[#E5E5E5]"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getGradient(item.id, false)}`}
                              >
                                <Icon
                                  className="w-5 h-5 text-[#777777]"
                                  strokeWidth={2.5}
                                  aria-hidden="true"
                                />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="text-sm font-bold text-[#3C3C3C]">{item.label}</div>
                              </div>
                            </div>
                            <ChevronRight
                              className="w-5 h-5 text-[#AFAFAF] flex-shrink-0"
                              aria-hidden="true"
                            />
                          </a>
                        ) : (
                          <button
                            onClick={() => item.navigable && handleSectionClick(item.id)}
                            aria-expanded={item.navigable ? isExpanded : undefined}
                            aria-controls={item.navigable ? contentId : undefined}
                            aria-label={`${item.label} settings`}
                            className={`w-full px-4 py-4 flex items-center justify-between border-b-2 border-[#E5E5E5] transition-all ${
                              item.navigable
                                ? 'hover:bg-[#F7F7F7] active:bg-[#E5E5E5]'
                                : 'cursor-default'
                            } ${isExpanded ? 'bg-[#F7F7F7]' : ''}`}
                            disabled={!item.navigable}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getGradient(item.id, isExpanded)}`}
                              >
                                <Icon
                                  className={`w-5 h-5 ${isExpanded ? 'text-white' : 'text-[#777777]'}`}
                                  strokeWidth={2.5}
                                  aria-hidden="true"
                                />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div
                                  className={`text-sm font-bold ${isExpanded ? 'text-[#1CB0F6]' : 'text-[#3C3C3C]'}`}
                                >
                                  {item.label}
                                </div>
                              </div>
                            </div>
                            {item.navigable && (
                              <ChevronRight
                                className={`w-5 h-5 text-[#AFAFAF] flex-shrink-0 transition-transform ${
                                  isExpanded ? 'rotate-90' : ''
                                }`}
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        )}

                        {/* Expanded Profile Content */}
                        {isExpanded && item.id === 'profile' && (
                          <div
                            id={contentId}
                            role="region"
                            aria-labelledby={`${item.id}-button`}
                            className="px-4 pt-4 pb-6 bg-[#F7F7F7] border-t-2 border-[#E5E5E5]"
                          >
                            <ProfileFormSection
                              idPrefix="-mobile"
                              user={user}
                              formData={formData}
                              profilePictureUrl={profilePictureUrl}
                              isUploadingPhoto={isUploadingPhoto}
                              isSaving={isSaving}
                              saved={saved}
                              hasChanges={hasChanges}
                              urlError={urlError}
                              onSubmit={handleSubmit}
                              onPhotoUpload={handlePhotoUpload}
                              onNameChange={handleNameChange}
                              onTaglineChange={handleTaglineChange}
                              onPronounsChange={handlePronounsChange}
                              onBioChange={handleBioChange}
                              onLocationChange={handleLocationChange}
                              onWebsiteChange={handleWebsiteChange}
                              onWebsiteBlur={handleWebsiteBlur}
                              onTwitterChange={handleTwitterChange}
                              onGithubChange={handleGithubChange}
                              onLinkedinChange={handleLinkedinChange}
                            />
                          </div>
                        )}

                        {/* Expanded Privacy Content */}
                        {isExpanded && item.id === 'privacy' && (
                          <div
                            id={contentId}
                            role="region"
                            aria-labelledby={`${item.id}-button`}
                            className="px-4 pt-4 pb-6 bg-[#F7F7F7] border-t-2 border-[#E5E5E5]"
                          >
                            <PrivacyFormSection
                              idPrefix="-mobile"
                              profileVisibility={formData.profileVisibility}
                              isSaving={isSaving}
                              hasChanges={hasChanges}
                              saved={saved}
                              onVisibilityChange={handleProfileVisibilityChange}
                              onReset={handlePrivacyReset}
                              onSubmit={handlePrivacySubmit}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Account Actions */}
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-4 flex items-center gap-3 text-left border-b-2 border-[#E5E5E5] hover:bg-[#F7F7F7] active:bg-[#E5E5E5] transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#E5E5E5]">
                      <LogOut className="w-5 h-5 text-[#777777]" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-[#3C3C3C]">Log Out</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#AFAFAF] flex-shrink-0" />
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full px-4 py-4 flex items-center gap-3 text-left hover:bg-red-50 active:bg-red-100 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#FFE5E5]">
                      <Trash2 className="w-5 h-5 text-[#FF4B4B]" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-[#FF4B4B]">Delete Account</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#FF4B4B] flex-shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom padding for mobile navigation */}
        <div className="h-20 lg:hidden" />

        {/* Mobile Bottom Navigation */}
        <BottomNavigation />

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
  )
}

interface ProfileFormSectionProps {
  idPrefix: string
  user: AuthUser | null
  formData: ProfileFormState
  profilePictureUrl: string
  isUploadingPhoto: boolean
  isSaving: boolean
  saved: boolean
  hasChanges: boolean
  urlError: string
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onTaglineChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPronounsChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBioChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onLocationChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onWebsiteChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onWebsiteBlur: (value: string) => void
  onTwitterChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onGithubChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onLinkedinChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function ProfileFormSection({
  idPrefix,
  user,
  formData,
  profilePictureUrl,
  isUploadingPhoto,
  isSaving,
  saved,
  hasChanges,
  urlError,
  onSubmit,
  onPhotoUpload,
  onNameChange,
  onTaglineChange,
  onPronounsChange,
  onBioChange,
  onLocationChange,
  onWebsiteChange,
  onWebsiteBlur,
  onTwitterChange,
  onGithubChange,
  onLinkedinChange,
}: ProfileFormSectionProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Profile Picture */}
      <div>
        <label className="block text-xs font-extrabold text-[#AFAFAF] uppercase tracking-widest mb-3">
          Profile Picture
        </label>
        <div className="flex items-center gap-6">
          {profilePictureUrl || user?.profilePicture ? (
            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-[#E5E5E5] flex-shrink-0">
              <Image
                src={profilePictureUrl || user?.profilePicture || ''}
                alt="Profile"
                width={80}
                height={80}
                quality={95}
                priority
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-[#58CC02] to-[#45A000] rounded-full flex items-center justify-center text-white text-3xl font-extrabold flex-shrink-0 ring-4 ring-[#E5E5E5]">
              {user?.name.charAt(0).toUpperCase() || 'N'}
            </div>
          )}
          <div className="flex-1">
            <input
              type="file"
              id={`profile-photo-upload${idPrefix}`}
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={onPhotoUpload}
              className="hidden"
            />
            <label
              htmlFor={`profile-photo-upload${idPrefix}`}
              className={`inline-flex items-center gap-2 px-5 py-3 bg-white text-[#3C3C3C] font-bold rounded-2xl border-2 border-b-4 border-[#E5E5E5] hover:bg-[#F7F7F7] active:border-b-2 active:translate-y-[2px] transition-all cursor-pointer ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploadingPhoto ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#E5E5E5] border-t-[#58CC02] rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" strokeWidth={2.5} />
                  <span>Upload Photo</span>
                </>
              )}
            </label>
            <p className="text-sm text-[#AFAFAF] mt-2">JPG, PNG, GIF or WebP. Max 5MB.</p>
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor={`name${idPrefix}`}
          className="block text-xs font-extrabold text-[#AFAFAF] uppercase tracking-widest mb-2"
        >
          Name
        </label>
        <input
          type="text"
          id={`name${idPrefix}`}
          value={formData.name}
          onChange={onNameChange}
          className="w-full px-4 py-3 bg-[#F7F7F7] border-2 border-b-4 border-[#E5E5E5] rounded-xl text-[#3C3C3C] font-semibold focus:border-[#1CB0F6] focus:bg-white focus:outline-none placeholder:text-[#AFAFAF] transition-all"
        />
      </div>

      {/* Username */}
      <div>
        <label
          htmlFor={`username${idPrefix}`}
          className="block text-xs font-extrabold text-[#AFAFAF] uppercase tracking-widest mb-2"
        >
          Username
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AFAFAF] font-semibold">
            @
          </span>
          <input
            type="text"
            id={`username${idPrefix}`}
            value={user?.username || ''}
            disabled
            className="w-full pl-8 pr-4 py-3 bg-[#E5E5E5] border-2 border-[#DADADA] rounded-xl text-[#777777] font-semibold cursor-not-allowed"
          />
        </div>
        <p className="text-xs text-[#AFAFAF] mt-2 font-semibold">
          Username cannot be changed - it&apos;s your unique identifier
        </p>
      </div>

      {/* Tagline */}
      <div>
        <label
          htmlFor={`tagline${idPrefix}`}
          className="block text-xs font-extrabold text-[#AFAFAF] uppercase tracking-widest mb-2"
        >
          Tagline
        </label>
        <input
          type="text"
          id={`tagline${idPrefix}`}
          value={formData.tagline}
          onChange={onTaglineChange}
          maxLength={60}
          placeholder="Your headline or current status..."
          className="w-full px-4 py-3 bg-[#F7F7F7] border-2 border-b-4 border-[#E5E5E5] rounded-xl text-[#3C3C3C] font-semibold focus:border-[#1CB0F6] focus:bg-white focus:outline-none placeholder:text-[#AFAFAF] transition-all"
        />
        <p className="text-xs text-[#AFAFAF] mt-2 font-semibold">
          {formData.tagline.length}/60 • Appears below your name on your profile
        </p>
      </div>

      {/* Pronouns */}
      <div>
        <label
          htmlFor={`pronouns${idPrefix}`}
          className="block text-xs font-extrabold text-[#AFAFAF] uppercase tracking-widest mb-2"
        >
          Pronouns
        </label>
        <input
          type="text"
          id={`pronouns${idPrefix}`}
          value={formData.pronouns}
          onChange={onPronounsChange}
          maxLength={20}
          placeholder="e.g., she/her, he/him, they/them"
          className="w-full px-4 py-3 bg-[#F7F7F7] border-2 border-b-4 border-[#E5E5E5] rounded-xl text-[#3C3C3C] font-semibold focus:border-[#1CB0F6] focus:bg-white focus:outline-none placeholder:text-[#AFAFAF] transition-all"
        />
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor={`bio${idPrefix}`}
          className="block text-xs font-extrabold text-[#AFAFAF] uppercase tracking-widest mb-2"
        >
          Bio
        </label>
        <textarea
          id={`bio${idPrefix}`}
          value={formData.bio}
          onChange={onBioChange}
          rows={4}
          maxLength={160}
          placeholder="Tell us about yourself..."
          className="w-full px-4 py-3 bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-xl text-[#3C3C3C] font-semibold focus:border-[#1CB0F6] focus:bg-white focus:outline-none placeholder:text-[#AFAFAF] resize-none transition-all"
        />
        <p className="text-xs text-[#AFAFAF] mt-2 font-semibold">{formData.bio.length}/160</p>
      </div>

      {/* Location */}
      <div>
        <label
          htmlFor={`location${idPrefix}`}
          className="block text-xs font-extrabold text-[#AFAFAF] uppercase tracking-widest mb-2"
        >
          Location
        </label>
        <input
          type="text"
          id={`location${idPrefix}`}
          value={formData.location}
          onChange={onLocationChange}
          placeholder="City, Country"
          className="w-full px-4 py-3 bg-[#F7F7F7] border-2 border-b-4 border-[#E5E5E5] rounded-xl text-[#3C3C3C] font-semibold focus:border-[#1CB0F6] focus:bg-white focus:outline-none placeholder:text-[#AFAFAF] transition-all"
        />
      </div>

      {/* Links Section */}
      <div className="pt-6 border-t-2 border-[#E5E5E5]">
        <h3 className="text-lg font-extrabold text-[#3C3C3C] mb-4">Links</h3>

        {/* Website */}
        <div className="mb-4">
          <label
            htmlFor={`website${idPrefix}`}
            className="block text-xs font-extrabold text-[#AFAFAF] uppercase tracking-widest mb-2"
          >
            Website
          </label>
          <input
            type="url"
            id={`website${idPrefix}`}
            value={formData.website}
            onChange={onWebsiteChange}
            onBlur={(e) => onWebsiteBlur(e.target.value)}
            placeholder="https://yourwebsite.com"
            pattern="https?://.*"
            aria-invalid={urlError ? 'true' : 'false'}
            aria-describedby={urlError ? `website-error${idPrefix}` : undefined}
            className={`w-full px-4 py-3 bg-[#F7F7F7] border-2 border-b-4 rounded-xl text-[#3C3C3C] font-semibold focus:border-[#1CB0F6] focus:bg-white focus:outline-none placeholder:text-[#AFAFAF] transition-all ${
              urlError ? 'border-[#FF4B4B]' : 'border-[#E5E5E5]'
            }`}
          />
          {urlError && (
            <p
              id={`website-error${idPrefix}`}
              className="text-sm text-[#FF4B4B] mt-2 font-semibold"
              role="alert"
            >
              {urlError}
            </p>
          )}
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          {/* Twitter/X */}
          <div>
            <label
              htmlFor={`twitter${idPrefix}`}
              className="block text-xs font-extrabold text-[#AFAFAF] uppercase tracking-widest mb-2"
            >
              Twitter/X
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AFAFAF] font-semibold">
                @
              </span>
              <input
                type="text"
                id={`twitter${idPrefix}`}
                value={formData.twitter}
                onChange={onTwitterChange}
                placeholder="username"
                className="w-full pl-8 pr-4 py-3 bg-[#F7F7F7] border-2 border-b-4 border-[#E5E5E5] rounded-xl text-[#3C3C3C] font-semibold focus:border-[#1CB0F6] focus:bg-white focus:outline-none placeholder:text-[#AFAFAF] transition-all"
              />
            </div>
          </div>

          {/* GitHub */}
          <div>
            <label
              htmlFor={`github${idPrefix}`}
              className="block text-xs font-extrabold text-[#AFAFAF] uppercase tracking-widest mb-2"
            >
              GitHub
            </label>
            <input
              type="text"
              id={`github${idPrefix}`}
              value={formData.github}
              onChange={onGithubChange}
              placeholder="username"
              className="w-full px-4 py-3 bg-[#F7F7F7] border-2 border-b-4 border-[#E5E5E5] rounded-xl text-[#3C3C3C] font-semibold focus:border-[#1CB0F6] focus:bg-white focus:outline-none placeholder:text-[#AFAFAF] transition-all"
            />
          </div>

          {/* LinkedIn */}
          <div>
            <label
              htmlFor={`linkedin${idPrefix}`}
              className="block text-xs font-extrabold text-[#AFAFAF] uppercase tracking-widest mb-2"
            >
              LinkedIn
            </label>
            <input
              type="text"
              id={`linkedin${idPrefix}`}
              value={formData.linkedin}
              onChange={onLinkedinChange}
              placeholder="username"
              className="w-full px-4 py-3 bg-[#F7F7F7] border-2 border-b-4 border-[#E5E5E5] rounded-xl text-[#3C3C3C] font-semibold focus:border-[#1CB0F6] focus:bg-white focus:outline-none placeholder:text-[#AFAFAF] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6">
        <a
          href={user ? `/profile/${user.username}` : '/'}
          className="px-5 py-3 bg-white text-[#3C3C3C] font-bold rounded-2xl border-2 border-b-4 border-[#E5E5E5] hover:bg-[#F7F7F7] active:border-b-2 active:translate-y-[2px] transition-all text-center"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isSaving || !hasChanges}
          className={`px-5 py-3 font-bold rounded-2xl border-2 border-b-4 active:border-b-2 active:translate-y-[2px] transition-all text-white ${
            isSaving || !hasChanges
              ? 'bg-[#E5E5E5] border-[#DADADA] text-[#AFAFAF] cursor-not-allowed active:translate-y-0 active:border-b-4'
              : saved
                ? 'bg-[#58CC02] border-[#45A000] hover:brightness-105'
                : 'bg-[#58CC02] border-[#45A000] hover:brightness-105'
          }`}
        >
          {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

interface PrivacyFormSectionProps {
  idPrefix: string
  profileVisibility: 'everyone' | 'followers' | 'private'
  isSaving: boolean
  hasChanges: boolean
  saved: boolean
  onVisibilityChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  onReset: () => void
  onSubmit: () => void
}

function PrivacyFormSection({
  idPrefix,
  profileVisibility,
  isSaving,
  hasChanges,
  saved,
  onVisibilityChange,
  onReset,
  onSubmit,
}: PrivacyFormSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor={`profileVisibility${idPrefix}`}
          className="block text-xs font-extrabold text-[#AFAFAF] uppercase tracking-widest mb-2"
        >
          Profile Visibility
        </label>
        <select
          id={`profileVisibility${idPrefix}`}
          value={profileVisibility}
          onChange={onVisibilityChange}
          className="w-full px-4 py-3 bg-[#F7F7F7] border-2 border-b-4 border-[#E5E5E5] rounded-xl text-[#3C3C3C] font-semibold focus:border-[#1CB0F6] focus:bg-white focus:outline-none cursor-pointer transition-all"
        >
          <option value="everyone">
            Everyone - Your profile and sessions are visible to all users
          </option>
          <option value="followers">
            Followers Only - Only your followers can see your profile and sessions
          </option>
          <option value="private">
            Only You - Your profile and sessions are completely private
          </option>
        </select>
        <p className="text-sm text-[#777777] mt-3 font-semibold">
          {profileVisibility === 'everyone' &&
            'Your profile, sessions, and stats are visible to everyone.'}
          {profileVisibility === 'followers' &&
            "Only your followers can see your profile and sessions. You won't appear in suggestions."}
          {profileVisibility === 'private' &&
            'Your profile is completely private. Only you can see your sessions and stats.'}
        </p>
      </div>

      <div className="flex gap-3 pt-6">
        <button
          type="button"
          onClick={onReset}
          className="px-5 py-3 bg-white text-[#3C3C3C] font-bold rounded-2xl border-2 border-b-4 border-[#E5E5E5] hover:bg-[#F7F7F7] active:border-b-2 active:translate-y-[2px] transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSaving || !hasChanges}
          className={`px-5 py-3 font-bold rounded-2xl border-2 border-b-4 active:border-b-2 active:translate-y-[2px] transition-all text-white ${
            isSaving || !hasChanges
              ? 'bg-[#E5E5E5] border-[#DADADA] text-[#AFAFAF] cursor-not-allowed active:translate-y-0 active:border-b-4'
              : saved
                ? 'bg-[#58CC02] border-[#45A000] hover:brightness-105'
                : 'bg-[#58CC02] border-[#45A000] hover:brightness-105'
          }`}
        >
          {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
