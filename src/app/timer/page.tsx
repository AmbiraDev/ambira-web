'use client';

import React, { useEffect, useState } from 'react';
import { SessionTimerEnhanced } from '@/components/SessionTimerEnhanced';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';
import BottomNavigation from '@/components/BottomNavigation';
import { SaveSession } from '@/components/SaveSession';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { firebaseAuthApi } from '@/lib/firebaseApi';

export default function TimerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOnboarding, setIsOnboarding] = useState(false);

  useEffect(() => {
    // Check if user is in onboarding step 3 (timer intro)
    if (user && user.onboardingCompleted === false && user.onboardingStep === 3) {
      setIsOnboarding(true);
    } else {
      setIsOnboarding(false);
    }
  }, [user]);

  const handleSessionComplete = async () => {
    // If user was in onboarding, mark it complete and redirect
    if (isOnboarding) {
      try {
        await firebaseAuthApi.completeOnboarding();
        router.push('/onboarding/complete');
      } catch (error) {
        console.error('Failed to complete onboarding:', error);
        // Still navigate even if update fails
        router.push('/onboarding/complete');
      }
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        {/* Header - hidden on mobile */}
        <div className="hidden md:block">
          <Header />
        </div>

        {/* Onboarding Banner */}
        {isOnboarding && (
          <div className="bg-gradient-to-r from-blue-500 to-[#007AFF] text-white px-4 py-3 text-center">
            <p className="text-sm sm:text-base font-medium">
              🎯 Complete your first session to finish setup!
            </p>
          </div>
        )}

        <div className="md:pt-20">
          <SessionTimerEnhanced
            projectId=""
            onSessionComplete={isOnboarding ? handleSessionComplete : undefined}
          />
        </div>

        {/* Bottom Navigation - only on desktop */}
        <div className="hidden md:block">
          <BottomNavigation />
        </div>
      </div>
    </ProtectedRoute>
  );
}
