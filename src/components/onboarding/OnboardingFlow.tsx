'use client';

import React, { useState } from 'react';
import { WelcomeTour } from './WelcomeTour';
import { QuickSetup } from './QuickSetup';
import { firebaseAuthApi } from '@/lib/firebaseApi';

interface OnboardingFlowProps {
  onComplete: () => void;
}

type OnboardingStep = 'welcome-tour' | 'quick-setup' | 'completed';

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome-tour');

  const handleTourComplete = () => {
    setCurrentStep('quick-setup');
  };

  const handleTourSkip = () => {
    setCurrentStep('quick-setup');
  };

  const handleSetupComplete = async () => {
    try {
      // Mark onboarding as completed in Firestore
      await firebaseAuthApi.completeOnboarding();
      setCurrentStep('completed');
      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still proceed to the app even if marking completion fails
      setCurrentStep('completed');
      onComplete();
    }
  };

  const handleSetupBack = () => {
    setCurrentStep('welcome-tour');
  };

  if (currentStep === 'welcome-tour') {
    return <WelcomeTour onComplete={handleTourComplete} onSkip={handleTourSkip} />;
  }

  if (currentStep === 'quick-setup') {
    return <QuickSetup onComplete={handleSetupComplete} onBack={handleSetupBack} />;
  }

  return null;
};
