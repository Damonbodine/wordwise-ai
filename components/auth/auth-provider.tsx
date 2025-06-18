'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useDocumentStore } from '@/stores/document-store';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { 
    initializeAuth, 
    isInitialized, 
    user, 
    isLoading: authLoading 
  } = useAuthStore();
  
  const { 
    loadUserDocuments, 
    isInitialized: docsInitialized,
    clearDocuments 
  } = useDocumentStore();

  // Initialize authentication on app start
  useEffect(() => {
    if (!isInitialized) {
      console.log('[AUTH PROVIDER] Initializing authentication...');
      initializeAuth();
    }
  }, []); // Run only once on mount

  // Load user documents when authenticated
  useEffect(() => {
    const loadUserData = async () => {
      if (user && isInitialized && !docsInitialized) {
        try {
          console.log('[AUTH PROVIDER] Loading user documents for:', user.id);
          await loadUserDocuments(user.id);
          console.log('[AUTH PROVIDER] User documents loaded successfully');
        } catch (error) {
          console.error('[AUTH PROVIDER] Failed to load user documents:', error);
        }
      } else if (!user && isInitialized) {
        // Clear documents when user logs out
        clearDocuments();
      }
    };

    loadUserData();
  }, [user, isInitialized, docsInitialized, loadUserDocuments, clearDocuments]);

  return <>{children}</>;
}; 