'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { firebaseAuthApi } from '@/lib/firebaseApi';

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

const ONBOARDING_STEPS = [
  { path: '/onboarding', step: 1, label: 'Welcome' },
  { path: '/onboarding/setup', step: 2, label: 'Setup' },
  { path: '/onboarding/timer-intro', step: 3, label: 'Timer' },
  { path: '/onboarding/complete', step: 4, label: 'Complete' },
];

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const currentStepIndex = ONBOARDING_STEPS.findIndex((s) => s.path === pathname);
  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const totalSteps = ONBOARDING_STEPS.length;

  const handleSkip = async () => {
    try {
      await firebaseAuthApi.completeOnboarding();
      router.push('/');
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      // Still navigate even if update fails
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with progress */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#007AFF] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="font-semibold text-gray-900 hidden sm:inline">Ambira</span>
          </div>

          {/* Progress Indicator - Desktop */}
          {currentStep && (
            <div className="hidden md:flex items-center gap-2">
              {ONBOARDING_STEPS.map((step, index) => (
                <React.Fragment key={step.path}>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      index < currentStepIndex
                        ? 'bg-[#007AFF] text-white'
                        : index === currentStepIndex
                        ? 'bg-[#007AFF] text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.step}
                  </div>
                  {index < ONBOARDING_STEPS.length - 1 && (
                    <div
                      className={`h-0.5 w-12 transition-colors ${
                        index < currentStepIndex ? 'bg-[#007AFF]' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Progress Indicator - Mobile (text) */}
          {currentStep && (
            <div className="md:hidden text-sm font-medium text-gray-600">
              Step {currentStep.step} of {totalSteps}
            </div>
          )}

          {/* Skip Button */}
          {pathname !== '/onboarding/complete' && (
            <button
              onClick={handleSkip}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors min-h-[44px]"
            >
              Skip
            </button>
          )}
        </div>

        {/* Progress Bar - Mobile */}
        {currentStep && (
          <div className="md:hidden w-full h-1 bg-gray-200">
            <div
              className="h-full bg-[#007AFF] transition-all duration-300"
              style={{ width: `${(currentStep.step / totalSteps) * 100}%` }}
            />
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
