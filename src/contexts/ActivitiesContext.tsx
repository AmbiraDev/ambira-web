'use client'

/**
 * ActivitiesContext - Placeholder for backwards compatibility
 * All activity functionality has been migrated to hooks in /src/hooks/useActivitiesQuery.ts
 * Use: import { useActivities, useActivity } from '@/hooks/useActivitiesQuery';
 */

import React, { createContext } from 'react'

export const ActivitiesContext = createContext<null>(null) as React.Context<null>

export const ActivitiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ActivitiesContext.Provider value={null}>{children}</ActivitiesContext.Provider>
}

export const useActivities = () => {
  throw new Error(
    'useActivities has been migrated to @/hooks/useActivitiesQuery. Please update your imports.'
  )
}

export const useActivity = () => {
  throw new Error(
    'useActivity has been migrated to @/hooks/useActivitiesQuery. Please update your imports.'
  )
}
