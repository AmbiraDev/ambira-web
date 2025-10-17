'use client';

import React, { useState, useEffect } from 'react';

export type HintType =
  | 'empty-projects'
  | 'empty-sessions'
  | 'empty-feed'
  | 'first-timer'
  | 'first-session-saved';

interface OnboardingHintProps {
  type: HintType;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const STORAGE_KEY_PREFIX = 'ambira_hint_dismissed_';

export const OnboardingHint: React.FC<OnboardingHintProps> = ({
  type,
  title,
  message,
  actionLabel,
  onAction,
}) => {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Check if this hint has been dismissed
    const dismissed = localStorage.getItem(`${STORAGE_KEY_PREFIX}${type}`);
    setIsDismissed(dismissed === 'true');
  }, [type]);

  const handleDismiss = () => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${type}`, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 animate-in fade-in duration-300">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">💡</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mb-3">{message}</p>
          <div className="flex gap-2">
            {actionLabel && onAction && (
              <button
                onClick={onAction}
                className="px-3 py-1.5 text-sm font-medium text-white bg-[#007AFF] rounded-lg hover:bg-[#0051D5] transition-colors"
              >
                {actionLabel}
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pre-configured hints for common scenarios
interface EmptyProjectsHintProps {
  onCreateProject: () => void;
}

export const EmptyProjectsHint: React.FC<EmptyProjectsHintProps> = ({ onCreateProject }) => (
  <OnboardingHint
    type="empty-projects"
    title="Create Your First Project"
    message="Projects help you organize your work sessions. Start by creating a project for something you're working on."
    actionLabel="Create Project"
    onAction={onCreateProject}
  />
);

interface EmptySessionsHintProps {
  onStartTimer: () => void;
}

export const EmptySessionsHint: React.FC<EmptySessionsHintProps> = ({ onStartTimer }) => (
  <OnboardingHint
    type="empty-sessions"
    title="Start Tracking Your Time"
    message="Use the timer to track your work sessions. When you finish, save the session to build your productivity streak!"
    actionLabel="Start Timer"
    onAction={onStartTimer}
  />
);

interface EmptyFeedHintProps {
  onExplore: () => void;
}

export const EmptyFeedHint: React.FC<EmptyFeedHintProps> = ({ onExplore }) => (
  <OnboardingHint
    type="empty-feed"
    title="Your Feed is Empty"
    message="Follow friends to see their activity in your feed. Discover productive people and get inspired!"
    actionLabel="Explore Users"
    onAction={onExplore}
  />
);

export const FirstTimerHint: React.FC = () => (
  <OnboardingHint
    type="first-timer"
    title="Welcome to the Timer!"
    message="Click the play button to start tracking time. The timer will keep running even if you close this tab. When you're done, click finish to save your session."
  />
);

export const FirstSessionSavedHint: React.FC = () => (
  <OnboardingHint
    type="first-session-saved"
    title="Great Job! 🎉"
    message="You've saved your first session! Keep tracking your work daily to build a streak and stay consistent."
  />
);

// Utility function to reset all hints (useful for testing or user preference)
export const resetAllHints = () => {
  const hintTypes: HintType[] = [
    'empty-projects',
    'empty-sessions',
    'empty-feed',
    'first-timer',
    'first-session-saved',
  ];

  hintTypes.forEach((type) => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${type}`);
  });
};
