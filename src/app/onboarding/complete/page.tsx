'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseAuthApi } from '@/lib/firebaseApi';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Mark onboarding as completed when this page loads
  useEffect(() => {
    const completeOnboarding = async () => {
      try {
        await firebaseAuthApi.completeOnboarding();
      } catch (error) {
        console.error('Failed to mark onboarding as complete:', error);
      }
    };

    completeOnboarding();
  }, []);

  const handleExploreFeed = () => {
    router.push('/');
  };

  const handleFindFriends = () => {
    // Navigate to user discovery/search page
    // Update this path based on your actual route
    router.push('/explore');
  };

  const handleJoinChallenge = () => {
    router.push('/challenges');
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-6 sm:py-8 overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 animate-in zoom-in duration-500">
            <span className="text-5xl sm:text-6xl">🎉</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 animate-in slide-in-from-bottom-4 duration-700">
            You're All Set!
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 animate-in slide-in-from-bottom-4 duration-700 delay-100">
            Welcome to the Ambira community, {user?.name?.split(' ')[0]}!
          </p>
        </div>

        {/* Accomplishments */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-8 shadow-sm animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What You've Accomplished</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-700">Created your first project</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-700">Learned how to track sessions</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">→</span>
              </div>
              <span className="text-gray-700">Ready to build your productivity streak</span>
            </div>
          </div>
        </div>

        {/* What's Next Cards */}
        <div className="mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-300">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What's Next?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={handleFindFriends}
              className="p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-[#007AFF] hover:bg-blue-50 transition-all active:scale-95 text-left group"
            >
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Follow Friends</h3>
              <p className="text-sm text-gray-600">Discover and connect with productive people</p>
            </button>

            <button
              onClick={handleJoinChallenge}
              className="p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-[#007AFF] hover:bg-blue-50 transition-all active:scale-95 text-left group"
            >
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Join a Challenge</h3>
              <p className="text-sm text-gray-600">Compete with others to stay motivated</p>
            </button>

            <button
              onClick={handleExploreFeed}
              className="p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-[#007AFF] hover:bg-blue-50 transition-all active:scale-95 text-left group"
            >
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Build Your Streak</h3>
              <p className="text-sm text-gray-600">Track work daily to maintain momentum</p>
            </button>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-400">
          <button
            onClick={handleExploreFeed}
            className="w-full px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-[#007AFF] to-[#0051D5] rounded-xl hover:shadow-xl active:scale-95 transition-all shadow-lg shadow-blue-500/30"
          >
            Explore Ambira
          </button>
          <p className="mt-4 text-center text-sm text-gray-500">
            You can always access help from the settings menu
          </p>
        </div>
      </div>
    </div>
  );
}
