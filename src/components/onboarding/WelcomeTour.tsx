'use client';

import React, { useState } from 'react';

interface WelcomeTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

const tourSteps = [
  {
    title: 'Welcome to Ambira',
    subtitle: 'Strava for Productivity',
    description: 'Track your work sessions, build streaks, and compete with friends to stay motivated and productive.',
    icon: '🚀',
  },
  {
    title: 'Track Your Work Sessions',
    subtitle: 'Turn time into progress',
    description: 'Start a timer for any project. When you finish, save your session and see your productivity grow.',
    icon: '⏱️',
  },
  {
    title: 'Build Streaks & Stay Consistent',
    subtitle: 'Momentum is everything',
    description: 'Work every day to build your streak. See your progress visualized and celebrate your consistency.',
    icon: '🔥',
  },
  {
    title: 'Compete with Friends',
    subtitle: 'Social productivity',
    description: 'Follow friends, share sessions, join challenges, and climb leaderboards. Make productivity social.',
    icon: '🏆',
  },
];

export const WelcomeTour: React.FC<WelcomeTourProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in duration-300">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {tourSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'w-8 bg-[#007AFF]'
                  : index < currentStep
                  ? 'w-2 bg-[#007AFF] opacity-50'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{step.icon}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h2>
          <p className="text-lg font-medium text-[#007AFF] mb-4">{step.subtitle}</p>
          <p className="text-gray-600 leading-relaxed">{step.description}</p>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-3 text-white bg-[#007AFF] rounded-lg font-medium hover:bg-[#0051D5] transition-colors"
          >
            {currentStep === tourSteps.length - 1 ? "Let's Go!" : 'Next'}
          </button>
        </div>

        {/* Skip Button */}
        <button
          onClick={onSkip}
          className="w-full mt-4 px-4 py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          Skip Tour
        </button>
      </div>
    </div>
  );
};
