'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthForms } from '@/components/auth/auth-forms';
import { useAuthStore } from '@/stores/auth-store';
import { Alert, AlertDescription } from '@/components/ui/alert';

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isInitialized } = useAuthStore();
  
  const error = searchParams.get('error');
  const redirectTo = searchParams.get('redirectTo') || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isInitialized && user) {
      router.push(redirectTo);
    }
  }, [user, isInitialized, router, redirectTo]);

  const handleAuthSuccess = () => {
    router.push(redirectTo);
  };

  // Show loading state while checking authentication
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <h2 className="text-lg font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  // If user is already authenticated, show loading while redirecting
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <h2 className="text-lg font-semibold">Redirecting...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{decodeURIComponent(error)}</AlertDescription>
          </Alert>
        )}
        <AuthForms 
          onSuccess={handleAuthSuccess}
          defaultTab="signin" 
        />
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <h2 className="text-lg font-semibold">Loading...</h2>
        </div>
      </div>
    }>
      <SignInPageContent />
    </Suspense>
  );
} 