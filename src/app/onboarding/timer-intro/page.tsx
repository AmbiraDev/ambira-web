'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { firebaseAuthApi } from '@/lib/firebaseApi';

export default function OnboardingTimerIntroPage() {
  const router = useRouter();

  const handleStartSession = async () => {
    try {
      await firebaseAuthApi.updateOnboardingStep(3);
      router.push('/timer');
    } catch (err) {
      console.error('Failed to update onboarding step:', err);
      // Still navigate even if update fails
      router.push('/timer');
    }
  };

  const handleSkipToComplete = async () => {
    try {
      await firebaseAuthApi.completeOnboarding();
      router.push('/onboarding/complete');
    } catch (err) {
      console.error('Failed to update onboarding:', err);
      // Still navigate even if update fails
      router.push('/onboarding/complete');
    }
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-6 sm:py-8 overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-2xl mb-4">
            <span className="text-3xl sm:text-4xl">⏱️</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Ready to Track Your First Session?
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Start a timer to track focused work on your project
          </p>
        </div>

        {/* Two-column layout on desktop, stacked on mobile */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Visual Preview */}
          <div className="order-2 md:order-1">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border border-blue-100 shadow-lg">
              {/* Timer Mockup */}
              <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
                <div className="text-center mb-4">
                  <div className="inline-block px-4 py-2 bg-blue-50 rounded-lg mb-2">
                    <span className="text-sm font-medium text-[#007AFF]">Work</span>
                  </div>
                </div>
                <div className="text-center mb-6">
                  <div className="text-5xl sm:text-6xl font-bold text-gray-900 mb-2">00:00:00</div>
                  <div className="text-sm text-gray-500">Ready to start</div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-16 h-16 bg-[#007AFF] rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Info Cards */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700">Timer keeps running even if you close the tab</p>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700">Pause and resume whenever you need a break</p>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-700">Save sessions to build your productivity streak</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 md:order-2">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">How it works</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Ambira tracks your work sessions just like Strava tracks runs. Click start when you begin working,
                      and finish when you're done. Your session gets saved to your feed and counts toward your streak!
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleStartSession}
                  className="w-full px-6 py-4 text-lg font-semibold text-white bg-[#007AFF] rounded-xl hover:bg-[#0051D5] active:scale-95 transition-all shadow-lg shadow-blue-500/30"
                >
                  Start My First Session
                </button>

                <button
                  onClick={handleSkipToComplete}
                  className="w-full px-6 py-3 text-base font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
                >
                  I'll Do This Later
                </button>
              </div>

              <p className="text-xs text-center text-gray-500">
                Don't worry, you can always access the timer from the navigation menu
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
