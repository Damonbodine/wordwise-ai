'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { Loader2 } from 'lucide-react';

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          // Redirect to login with error
          router.push('/auth/signin?error=' + encodeURIComponent(error.message));
          return;
        }

        if (data.session) {
          // Initialize auth store with the new session
          await initializeAuth();
          
          // Get redirect URL from query params or default to dashboard
          const redirectTo = searchParams.get('redirectTo') || '/';
          router.push(redirectTo);
        } else {
          // No session found, redirect to login
          router.push('/auth/signin');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        router.push('/auth/signin?error=' + encodeURIComponent('Authentication failed'));
      }
    };

    handleAuthCallback();
  }, [router, searchParams, initializeAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <h2 className="text-lg font-semibold">Completing authentication...</h2>
        <p className="text-muted-foreground">Please wait while we sign you in.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <h2 className="text-lg font-semibold">Loading...</h2>
        </div>
      </div>
    }>
      <AuthCallbackHandler />
    </Suspense>
  );
} 