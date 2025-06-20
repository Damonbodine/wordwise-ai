'use client';

import { ReactNode } from 'react';

interface DebugAuthBypassProps {
  children: ReactNode;
  enabled?: boolean;
}

/**
 * Temporary component to bypass authentication for debugging
 * WARNING: Remove this component before production deployment!
 */
export const DebugAuthBypass: React.FC<DebugAuthBypassProps> = ({ 
  children, 
  enabled = false 
}) => {
  if (enabled && process.env.NODE_ENV === 'development') {
    console.warn('[DEBUG] Authentication bypass is ENABLED - Remove before production!');
    return <>{children}</>;
  }
  
  return null;
};