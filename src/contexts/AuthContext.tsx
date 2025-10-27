'use client';

/**
 * AuthContext - Placeholder for backwards compatibility
 * All auth functionality should use hooks in /src/hooks/useAuth.ts
 * Use: import { useAuth } from '@/hooks/useAuth';
 */

import React, { createContext } from 'react';

export const AuthContext = createContext<any>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  throw new Error(
    'useAuth context is deprecated. Please use the hook from @/hooks/useAuth'
  );
};
