"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VoicePanel } from "@/components/voice/voice-panel";

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
          {/* Voice Assistant Panel */}
          <VoicePanel 
            className="flex-1" 
            isCollapsed={isCollapsed}
          />
          
          {/* Collapse Toggle */}
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className={cn("w-full", isCollapsed && "px-2")}
            >
              <svg
                className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {!isCollapsed && (
                <span className="ml-2 text-xs">Collapse</span>
              )}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}