'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Share, Plus, MoreVertical, Square } from 'lucide-react'

type Platform = 'ios' | 'android' | 'unknown'

interface PWAInstallPromptProps {
  /**
   * If true, always show the prompt on mobile browsers, ignoring localStorage dismissal
   * Useful for sign in/sign up pages where we want to encourage PWA installation
   */
  alwaysShowOnMobile?: boolean
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  alwaysShowOnMobile = false,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [platform, setPlatform] = useState<Platform>('unknown')
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios')

  useEffect(() => {
    // Check if already installed as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) {
      return
    }

    // Check if user has already dismissed the prompt
    // Even with alwaysShowOnMobile, we respect user dismissal to avoid annoying them
    const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-dismissed')
    if (hasSeenPrompt === 'true') {
      return
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)

    if (isIOS) {
      setPlatform('ios')
      setActiveTab('ios')
    } else if (isAndroid) {
      setPlatform('android')
      setActiveTab('android')
    } else {
      // Desktop or unknown - don't show prompt
      return
    }

    // Show prompt immediately
    setIsVisible(true)
  }, [alwaysShowOnMobile])

  const handleDismiss = () => {
    setIsVisible(false)
    // Always save dismissal state to respect user preference
    localStorage.setItem('pwa-install-prompt-dismissed', 'true')
  }

  if (!isVisible || platform === 'unknown') {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onClick={handleDismiss}
      />

      {/* Popup */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl pointer-events-auto animate-slide-up">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/icon-512x512.png"
                alt="Ambira Logo"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Install Ambira</h3>
              <p className="text-sm text-gray-600">Add to your home screen</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Get quick access and a better experience with our app
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'ios'
                ? 'border-[#0066CC] text-[#0066CC]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            iPhone / iPad
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'android'
                ? 'border-[#0066CC] text-[#0066CC]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Android
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {activeTab === 'ios' ? (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#0066CC]/10 rounded-full flex items-center justify-center">
                  <span className="text-[#0066CC] font-semibold text-lg">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-semibold text-lg mb-2">Press the Share button</p>
                  <div className="flex items-center gap-2 text-base text-gray-600">
                    <div className="relative w-5 h-5">
                      <Square className="w-5 h-5 absolute" />
                      <Share className="w-3 h-3 absolute top-1 left-1" />
                    </div>
                    <span>in your browser</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#0066CC]/10 rounded-full flex items-center justify-center">
                  <span className="text-[#0066CC] font-semibold text-lg">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-semibold text-lg mb-2">
                    Select "Add to Home Screen"
                  </p>
                  <div className="flex items-center gap-2 text-base text-gray-600">
                    <Plus className="w-5 h-5" />
                    <span>Scroll down if you don't see it</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#0066CC]/10 rounded-full flex items-center justify-center">
                  <span className="text-[#0066CC] font-semibold text-lg">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-semibold text-lg mb-2">Tap "Add" to confirm</p>
                  <p className="text-base text-gray-600">The app will appear on your home screen</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#0066CC]/10 rounded-full flex items-center justify-center">
                  <span className="text-[#0066CC] font-semibold text-lg">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-semibold text-lg mb-2">Tap the menu button</p>
                  <div className="flex items-center gap-2 text-base text-gray-600">
                    <MoreVertical className="w-5 h-5" />
                    <span>in the top-right corner</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#0066CC]/10 rounded-full flex items-center justify-center">
                  <span className="text-[#0066CC] font-semibold text-lg">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-semibold text-lg mb-2">
                    Select "Add to Home screen"
                  </p>
                  <div className="flex items-center gap-2 text-base text-gray-600">
                    <Plus className="w-5 h-5" />
                    <span>or "Install app"</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#0066CC]/10 rounded-full flex items-center justify-center">
                  <span className="text-[#0066CC] font-semibold text-lg">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-semibold text-lg mb-2">
                    Tap "Install" to confirm
                  </p>
                  <p className="text-base text-gray-600">The app will appear on your home screen</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PWAInstallPrompt
