'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { initializeAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    // Initialize authentication on app start
    if (!isInitialized) {
      initializeAuth();
    }
  }, [initializeAuth, isInitialized]);

  return <>{children}</>;
}; 