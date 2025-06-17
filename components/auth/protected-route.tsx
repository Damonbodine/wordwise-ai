'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  requireSubscription?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  redirectTo,
  requireSubscription = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    user, 
    isInitialized, 
    isLoading, 
    hasActiveSubscription
  } = useAuthStore();

  // Redirect to sign-in if not authenticated (only after auth is initialized)
  useEffect(() => {
    if (isInitialized && !user && !isLoading) {
      const signInUrl = redirectTo || `/auth/signin?redirectTo=${encodeURIComponent(pathname)}`;
      console.log('[PROTECTED ROUTE] Redirecting unauthenticated user to:', signInUrl);
      router.push(signInUrl);
    }
  }, [user, isInitialized, isLoading, router, pathname, redirectTo]);

  // Redirect to upgrade page if subscription is required but user doesn't have one
  useEffect(() => {
    if (isInitialized && user && requireSubscription && !hasActiveSubscription()) {
      const upgradeUrl = `/upgrade?redirectTo=${encodeURIComponent(pathname)}`;
      console.log('[PROTECTED ROUTE] Redirecting to upgrade:', upgradeUrl);
      router.push(upgradeUrl);
    }
  }, [user, isInitialized, requireSubscription, hasActiveSubscription, router, pathname]);

  // Show loading state while auth is initializing
  if (!isInitialized || isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <h2 className="text-lg font-semibold">Loading...</h2>
          <p className="text-muted-foreground">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting unauthenticated users
  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <h2 className="text-lg font-semibold">Redirecting...</h2>
          <p className="text-muted-foreground">Taking you to sign in...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting users without required subscription
  if (requireSubscription && !hasActiveSubscription()) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <h2 className="text-lg font-semibold">Redirecting...</h2>
          <p className="text-muted-foreground">This feature requires a subscription...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and meets all requirements
  console.log('[PROTECTED ROUTE] User authenticated, rendering protected content');
  return <>{children}</>;
};

// Higher-order component version for easier usage
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    redirectTo?: string;
    requireSubscription?: boolean;
  }
) {
  const ProtectedComponent = (props: P) => {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  ProtectedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`;
  
  return ProtectedComponent;
}

// Hook for checking authentication status in components
export function useRequireAuth(options?: {
  redirectTo?: string;
  requireSubscription?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    user, 
    isInitialized, 
    isLoading, 
    hasActiveSubscription
  } = useAuthStore();

  const { redirectTo, requireSubscription = false } = options || {};

  // Handle redirects (but don't initialize auth - that's handled by AuthProvider)
  useEffect(() => {
    if (isInitialized && !isLoading) {
      if (!user) {
        const signInUrl = redirectTo || `/auth/signin?redirectTo=${encodeURIComponent(pathname)}`;
        console.log('[USE REQUIRE AUTH] Redirecting to:', signInUrl);
        router.push(signInUrl);
      } else if (requireSubscription && !hasActiveSubscription()) {
        const upgradeUrl = `/upgrade?redirectTo=${encodeURIComponent(pathname)}`;
        console.log('[USE REQUIRE AUTH] Redirecting to upgrade:', upgradeUrl);
        router.push(upgradeUrl);
      }
    }
  }, [user, isInitialized, isLoading, requireSubscription, hasActiveSubscription, router, pathname, redirectTo]);

  return {
    user,
    isLoading: !isInitialized || isLoading,
    isAuthenticated: !!user,
    hasSubscription: user ? hasActiveSubscription() : false,
  };
} 