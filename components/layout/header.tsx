"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, Plus, FileText } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useDocumentStore } from "@/stores/document-store";
import { useRouter } from "next/navigation";
import { DocumentDropdown } from "@/components/ui/document-dropdown";
import { DocumentService, DOCUMENT_TEMPLATES } from "@/services/document-service";
import { WritingStyleSelector } from "@/components/editor/writing-style-selector";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  className?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onDocumentSelect?: (documentId: string) => void;
}

export function Header({ onMobileMenuToggle, className, searchQuery = "", onSearchChange, onDocumentSelect }: HeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [isDocumentDropdownOpen, setIsDocumentDropdownOpen] = React.useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = React.useState(false);
  const { user, profile, signOut, hasActiveSubscription } = useAuthStore();
  const router = useRouter();
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const documentDropdownRef = React.useRef<HTMLDivElement>(null);
  const templateMenuRef = React.useRef<HTMLDivElement>(null);
  
  // Use individual selectors to avoid creating new objects
  const documents = useDocumentStore((state) => state.documents);
  const documentCount = useDocumentStore((state) => state.documentCount);
  const totalWordCount = useDocumentStore((state) => state.totalWordCount);
  const createDocument = useDocumentStore((state) => state.createDocument);
  const updateDocument = useDocumentStore((state) => state.updateDocument);
  
  // Extract user ID for creating documents
  const userId = user?.id;


  // Close dropdowns when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (documentDropdownRef.current && !documentDropdownRef.current.contains(event.target as Node)) {
        setIsDocumentDropdownOpen(false);
      }
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target as Node)) {
        setShowTemplateMenu(false);
      }
    }

    if (isProfileMenuOpen || isDocumentDropdownOpen || showTemplateMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProfileMenuOpen, isDocumentDropdownOpen, showTemplateMenu]);

  // Handle template creation
  const handleCreateFromTemplate = React.useCallback(async (templateKey: keyof typeof DOCUMENT_TEMPLATES) => {
    if (!userId) {
      console.error('❌ Cannot create document from template: User not authenticated');
      return;
    }

    try {
      const templateData = DocumentService.createNewDocument(templateKey);
      const newDoc = await createDocument(templateData.title, templateData.content, userId);
      
      // Update the newly created document with additional data from template
      setTimeout(async () => {
        await updateDocument(newDoc.id, {
          tags: templateData.tags,
          stats: templateData.stats,
          settings: templateData.settings,
          analysis: templateData.analysis,
          sharing: templateData.sharing,
          status: templateData.status,
        }, userId);
      }, 100);
      
      console.log('📋 Document created from template:', templateKey, newDoc.title);
      onDocumentSelect?.(newDoc.id);
      setShowTemplateMenu(false);
    } catch (error) {
      console.error('Failed to create document from template:', error);
    }
  }, [createDocument, updateDocument, onDocumentSelect, userId]);

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

        {/* Center Section: Search + Stats */}
        <div className="hidden md:flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10 w-64 h-9 text-sm transition-all duration-200 focus:shadow-md border-border/50 focus:border-primary/50 bg-background/80"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange?.('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* New Document Button */}
          <div className="relative" ref={templateMenuRef}>
            <Button
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              size="sm"
              className="h-9 px-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md group"
            >
              <Plus className="w-4 h-4 mr-1.5 group-hover:rotate-90 transition-transform duration-200" />
              <span className="text-sm font-medium">New</span>
            </Button>
            
            {/* Template Selection Menu */}
            {showTemplateMenu && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-background border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Content Templates</div>
                  
                  {/* Quick blank document */}
                  <button
                    onClick={() => handleCreateFromTemplate('blank')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md flex items-center gap-3"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Blank Document</div>
                      <div className="text-xs text-muted-foreground">Start from scratch</div>
                    </div>
                  </button>
                  
                  <div className="border-t my-2"></div>
                  
                  {/* Social Media Templates */}
                  <div className="text-xs font-medium text-muted-foreground mb-1 px-2">Social Media</div>
                  <button
                    onClick={() => handleCreateFromTemplate('twitterThread')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
                  >
                    Twitter/X Thread
                  </button>
                  <button
                    onClick={() => handleCreateFromTemplate('linkedinPost')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
                  >
                    LinkedIn Post
                  </button>
                  <button
                    onClick={() => handleCreateFromTemplate('instagramCaption')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
                  >
                    Instagram Caption
                  </button>
                  
                  <div className="border-t my-2"></div>
                  
                  {/* Video Content */}
                  <div className="text-xs font-medium text-muted-foreground mb-1 px-2">Video Content</div>
                  <button
                    onClick={() => handleCreateFromTemplate('youtubeScript')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
                  >
                    YouTube Script
                  </button>
                  <button
                    onClick={() => handleCreateFromTemplate('youtubeDescription')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
                  >
                    YouTube Description
                  </button>
                  
                  <div className="border-t my-2"></div>
                  
                  {/* Marketing */}
                  <div className="text-xs font-medium text-muted-foreground mb-1 px-2">Marketing</div>
                  <button
                    onClick={() => handleCreateFromTemplate('emailNewsletter')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
                  >
                    Email Newsletter
                  </button>
                  <button
                    onClick={() => handleCreateFromTemplate('seoBlogPost')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
                  >
                    SEO Blog Post
                  </button>
                  <button
                    onClick={() => handleCreateFromTemplate('contentBrief')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
                  >
                    Content Brief
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            {/* Documents Count - Now Interactive */}
            <div className="relative" ref={documentDropdownRef}>
              <Button
                variant="ghost"
                onClick={() => setIsDocumentDropdownOpen(!isDocumentDropdownOpen)}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 px-3 py-1.5 transition-all hover:shadow-sm hover:bg-primary/10 h-auto"
                aria-expanded={isDocumentDropdownOpen}
                aria-haspopup="true"
                aria-label={`${documentCount} documents - click to view list`}
              >
                <div className="text-sm font-bold text-primary">{documentCount}</div>
                <svg className="w-3 h-3 text-primary/60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z" />
                </svg>
                <span className="text-xs text-muted-foreground">Docs</span>
                <ChevronDown className={cn(
                  "w-3 h-3 text-muted-foreground transition-transform duration-200",
                  isDocumentDropdownOpen && "rotate-180"
                )} />
              </Button>

              {/* Documents Dropdown */}
              {isDocumentDropdownOpen && (
                <DocumentDropdown
                  onDocumentSelect={(docId) => {
                    onDocumentSelect?.(docId);
                    setIsDocumentDropdownOpen(false);
                  }}
                  onClose={() => setIsDocumentDropdownOpen(false)}
                />
              )}
            </div>

            {/* Writing Style Selector */}
            <WritingStyleSelector />

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
                  console.log('[HEADER] Logout button clicked');
                  try {
                    console.log('[HEADER] Attempting to sign out...');
                    const result = await signOut();
                    console.log('[HEADER] Sign out result:', result);
                    setIsProfileMenuOpen(false);
                    console.log('[HEADER] Redirecting to signin...');
                    router.push('/auth/signin');
                  } catch (error) {
                    console.error('[HEADER] Sign out failed:', error);
                    alert('Logout failed: ' + (error as Error).message);
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