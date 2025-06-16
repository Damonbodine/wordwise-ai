"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-background via-background to-background/95", className)}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:20px_20px] pointer-events-none" />
      
      <div className="relative flex h-screen overflow-hidden">
        {/* Header */}
        <Header
          onMobileMenuToggle={toggleMobileSidebar}
          className="fixed top-0 left-0 right-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
        />

        {/* Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={toggleSidebar}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={closeMobileSidebar}
          className="border-r border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80"
        />

        {/* Main Content Area */}
        <main
          className={cn(
            "flex-1 flex flex-col pt-16 transition-all duration-300 ease-in-out",
            isSidebarCollapsed ? "md:ml-16" : "md:ml-64"
          )}
        >
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
              
              {/* Content Wrapper */}
              <div className="relative h-full p-6 overflow-y-auto">
                <div className="max-w-none mx-auto">
                  {/* Elegant content container */}
                  <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5 ring-1 ring-border/20">
                    <div className="relative overflow-hidden rounded-xl">
                      {/* Subtle inner glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                      
                      {/* Content */}
                      <div className="relative p-8">
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
                <span>© 2024 WordWise AI</span>
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
      </div>

      {/* Global Loading Indicator */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-0 transition-opacity duration-300 z-50 animate-pulse" />
    </div>
  );
} 