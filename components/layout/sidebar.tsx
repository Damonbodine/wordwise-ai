"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ 
  isCollapsed = false, 
  onToggle, 
  className,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 transform border-r bg-background transition-transform duration-200 ease-in-out md:relative md:top-0 md:z-0 md:h-screen md:translate-x-0",
          isCollapsed && "md:w-16",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header with Toggle */}
          <div className="flex items-center justify-between border-b p-4">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary">
                  🎤
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold leading-none">Voice Assistant</h2>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    Coming Soon
                  </span>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className={cn("hidden md:flex", isCollapsed && "mx-auto")}
            >
              <svg
                className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          </div>

          {/* Voice Assistant Placeholder */}
          <div className="flex-1 flex items-center justify-center p-8">
            {!isCollapsed ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  🎤
                </div>
                <p className="text-sm text-muted-foreground">
                  Voice assistant will appear here
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Real-time AI conversation coming soon
                </p>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                🎤
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}