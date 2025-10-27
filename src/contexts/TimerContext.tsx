'use client';

/**
 * TimerContext - Placeholder for backwards compatibility
 * All timer functionality has been migrated to hooks in /src/features/timer/hooks/useTimer.ts
 * Use: import { useTimer } from '@/features/timer/hooks/useTimer';
 */

import React, { createContext } from 'react';

export const TimerContext = createContext<any>(null);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <TimerContext.Provider value={null}>{children}</TimerContext.Provider>;
};

export const useTimer = () => {
  throw new Error(
    'useTimer has been migrated to @/features/timer/hooks/useTimer. Please update your imports.'
  );
};
