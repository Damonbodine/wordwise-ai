"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  rightPanel?: React.ReactNode;
}

export function Layout({ children, className, rightPanel }: LayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  // Suggestions panel now handled in page.tsx

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  // Custom save handler for keyboard shortcuts
  const handleSave = React.useCallback(async () => {
    console.log('💾 Force save triggered (auto-save handles document persistence)');
    // The auto-save system will handle this, but we can add visual feedback
    
    // Optional: Show a brief "Saved" indicator
    const savedIndicator = document.createElement('div');
    savedIndicator.textContent = '✓ Saved';
    savedIndicator.className = 'fixed top-20 right-6 bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium z-50 animate-in fade-in slide-in-from-top-2 duration-200';
    document.body.appendChild(savedIndicator);
    
    setTimeout(() => {
      if (savedIndicator.parentNode) {
        savedIndicator.remove();
      }
    }, 2000);
  }, []);

  // Custom new document handler - simplified without document creation
  const handleNewDocument = React.useCallback(async () => {
    console.log('📝 New document shortcut triggered (handled by header dropdown)');
    closeMobileSidebar(); // Close mobile sidebar if open
  }, []);

  // Grammar suggestion handling moved to page.tsx

  // Initialize keyboard shortcuts
  const { shortcuts, lastAction, isEnabled } = useKeyboardShortcuts({
    enabled: true,
    onSave: handleSave,
    onNewDocument: handleNewDocument,
    // Bold, italic, undo, redo will use the default implementations
  });

  // Log when shortcuts are triggered (for debugging)
  React.useEffect(() => {
    if (lastAction) {
      console.log('⌨️ Keyboard shortcut executed:', lastAction);
    }
  }, [lastAction]);

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-background via-background to-background/95", className)}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:20px_20px] pointer-events-none" />
      
      {/* Header - Fixed across all columns */}
      <Header
        onMobileMenuToggle={toggleMobileSidebar}
        onDocumentSelect={() => closeMobileSidebar()}
        className="fixed top-0 left-0 right-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
      />

      {/* Three-column CSS Grid Layout */}
      <div className="grid h-screen pt-16" style={{
        gridTemplateColumns: isSidebarCollapsed 
          ? "64px 1fr 320px"  // collapsed sidebar + main + right panel
          : "256px 1fr 320px"  // full sidebar + main + right panel
      }}>
        
        {/* Left Sidebar Column */}
        <div className="border-r border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggle={toggleSidebar}
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={closeMobileSidebar}
          />
        </div>

        {/* Main Content Column */}
        <main className="flex flex-col overflow-hidden">
          {/* Content Header with Subtle Gradient */}
          <div className="relative border-b border-border/40 bg-gradient-to-r from-background/95 via-background/98 to-background/95 p-6 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
                    WordWise AI
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Intelligent writing assistant powered by AI
                  </p>
                </div>
                
                {/* Status Indicator */}
                <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Ready to write
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Container */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full relative">
              {/* Ambient background effects */}
              <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background to-background/80 pointer-events-none" />
              <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              
              {/* Content Wrapper - Full width within grid column */}
              <div className="relative h-full p-4 overflow-y-auto">
                <div className="w-full">
                  {/* Elegant content container */}
                  <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5 ring-1 ring-border/20">
                    <div className="relative overflow-hidden rounded-xl">
                      {/* Subtle inner glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                      
                      {/* Content */}
                      <div className="relative p-6">
                        {children}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Subtle Styling */}
          <footer className="border-t border-border/40 bg-background/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>© 2025 WordWise AI</span>
                <span className="text-border">•</span>
                <span>Crafted with precision</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span>All systems operational</span>
              </div>
            </div>
          </footer>
        </main>

        {/* Right Grammar Suggestions Column */}
        <div className="border-l border-border/40 bg-background/95 backdrop-blur-sm overflow-hidden">
          {rightPanel}
        </div>
      </div>

      {/* Global Loading Indicator */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-0 transition-opacity duration-300 z-50 animate-pulse" />
    </div>
  );
} 