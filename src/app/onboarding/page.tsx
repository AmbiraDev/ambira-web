'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingWelcomePage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/onboarding/setup');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl mx-auto text-center">
        {/* Hero Icon */}
        <div className="mb-8 animate-in fade-in duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-3xl shadow-lg">
            <span className="text-4xl sm:text-5xl">🚀</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 animate-in slide-in-from-bottom-4 duration-700">
          Welcome to Ambira
        </h1>

        <p className="text-xl sm:text-2xl text-[#007AFF] font-semibold mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-100">
          The Strava for Productivity
        </p>

        {/* Value Props */}
        <div className="space-y-4 sm:space-y-6 mb-12 text-left max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="flex-1 pt-1">
              <h3 className="font-semibold text-gray-900 mb-1">Track work sessions</h3>
              <p className="text-sm text-gray-600">Use smart timers to measure your focused time</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
            <div className="flex-1 pt-1">
              <h3 className="font-semibold text-gray-900 mb-1">Build streaks</h3>
              <p className="text-sm text-gray-600">Stay consistent and celebrate your momentum</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <div className="flex-1 pt-1">
              <h3 className="font-semibold text-gray-900 mb-1">Compete with friends</h3>
              <p className="text-sm text-gray-600">Join challenges and climb leaderboards</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div className="flex-1 pt-1">
              <h3 className="font-semibold text-gray-900 mb-1">Visualize progress</h3>
              <p className="text-sm text-gray-600">See your productivity trends over time</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleGetStarted}
          className="w-full max-w-md mx-auto px-8 py-4 text-lg font-semibold text-white bg-[#007AFF] rounded-xl hover:bg-[#0051D5] active:scale-95 transition-all shadow-lg shadow-blue-500/30 animate-in slide-in-from-bottom-4 duration-700 delay-300"
        >
          Get Started
        </button>

        <p className="mt-6 text-sm text-gray-500">
          Takes less than 2 minutes to set up
        </p>
      </div>
    </div>
  );
}
