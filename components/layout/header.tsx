"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useDocumentStore } from "@/stores/document-store";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  className?: string;
}

export function Header({ onMobileMenuToggle, className }: HeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const { user, profile, signOut, hasActiveSubscription } = useAuthStore();
  const router = useRouter();
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  // Use individual selectors to avoid creating new objects
  const documents = useDocumentStore((state) => state.documents);
  const documentCount = useDocumentStore((state) => state.documentCount);
  const totalWordCount = useDocumentStore((state) => state.totalWordCount);
  
  // Calculate grammar score
  const grammarScore = documents.length > 0 
    ? Math.round(documents.reduce((sum, doc) => sum + (doc.analysis?.grammarScore || 100), 0) / documents.length)
    : 100;


  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProfileMenuOpen]);

  return (
    <header className={cn("border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left Section: Logo and Mobile Menu Toggle */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={onMobileMenuToggle}
            aria-label="Toggle sidebar"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </Button>
          
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <span className="text-lg font-semibold">WordWise AI</span>
          </div>
        </div>

        {/* Center Section: Stats */}
        <div className="hidden md:flex items-center gap-3">
          {/* Documents Count */}
          <div className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 px-3 py-1.5 transition-all hover:shadow-sm">
            <div className="text-sm font-bold text-primary">{documentCount}</div>
            <svg className="w-3 h-3 text-primary/60" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z" />
            </svg>
            <span className="text-xs text-muted-foreground">Docs</span>
          </div>

          {/* Words Count */}
          <div className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 px-3 py-1.5 transition-all hover:shadow-sm dark:from-blue-950 dark:to-blue-900 dark:border-blue-800">
            <div className="text-sm font-bold text-blue-700 dark:text-blue-300">
              {totalWordCount > 1000 
                ? `${(totalWordCount / 1000).toFixed(1)}K` 
                : totalWordCount.toLocaleString()
              }
            </div>
            <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3,3H21V5H3V3M3,7H15V9H3V7M3,11H21V13H3V11M3,15H15V17H3V15M3,19H21V21H3V19Z" />
            </svg>
            <span className="text-xs text-muted-foreground">Words</span>
          </div>

          {/* Grammar Score */}
          <div className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200 px-3 py-1.5 transition-all hover:shadow-sm dark:from-green-950 dark:to-green-900 dark:border-green-800">
            <div className="text-sm font-bold text-green-700 dark:text-green-300">{grammarScore}%</div>
            <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs text-muted-foreground">Score</span>
          </div>
        </div>


        {/* Right Section: User Profile */}
        <div className="relative" ref={dropdownRef}>
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              className="relative h-9 w-9 rounded-full"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="true"
              aria-label="User profile menu"
            >
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </Button>
          ) : (
            <Button
              onClick={() => router.push('/auth/signin')}
              size="sm"
              className="h-9"
            >
              Sign In
            </Button>
          )}

          {/* Profile Dropdown */}
          {isProfileMenuOpen && user && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-md border bg-popover p-1 shadow-md z-50">
              <div className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{profile?.full_name || user?.email || 'Dev User'}</div>
                    <div className="text-xs text-muted-foreground truncate">{user?.email || 'developer@wordwise.ai'}</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    profile?.subscription_tier === 'free' ? "bg-muted text-muted-foreground" :
                    profile?.subscription_tier === 'pro' ? "bg-primary/10 text-primary" :
                    "bg-purple-500/10 text-purple-600"
                  )}>
                    {profile?.subscription_tier?.charAt(0)?.toUpperCase() + (profile?.subscription_tier?.slice(1) || '')}
                  </div>
                  {!user.email_confirmed_at && (
                    <div className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600">
                      Unverified
                    </div>
                  )}
                </div>
              </div>
              <div className="h-px bg-border my-1" />
              <button className="flex w-full items-center rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>
              <button className="flex w-full items-center rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Billing & Plans
              </button>
              <button className="flex w-full items-center rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
              <div className="h-px bg-border my-1" />
              <button 
                onClick={async () => {
                  try {
                    await signOut();
                    setIsProfileMenuOpen(false);
                    router.push('/auth/signin');
                  } catch (error) {
                    console.error('Sign out failed:', error);
                  }
                }}
                className="flex w-full items-center rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-red-600 hover:text-red-600"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

    </header>
  );
} 