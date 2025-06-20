"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/stores/document-store";
import { DocumentList } from "@/components/editor/document-list";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  searchQuery?: string;
}

// Helper function to format relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export function Sidebar({ 
  isCollapsed = false, 
  onToggle, 
  className,
  isMobileOpen = false,
  onMobileClose,
  searchQuery = ""
}: SidebarProps) {
  const { 
    documents, 
    activeDocumentId, 
    documentCount, 
    createDocument, 
    setActiveDocument,
    getRecentDocuments 
  } = useDocumentStore();
  
  const recentDocuments = getRecentDocuments(6);

  const handleCreateDocument = async () => {
    try {
      const newDoc = await createDocument();
      console.log('📝 Created new document:', newDoc.id, newDoc.title);
      if (onMobileClose) onMobileClose(); // Close mobile sidebar after creating
    } catch (error) {
      console.error('❌ Failed to create document:', error);
    }
  };

  const handleDocumentClick = (docId: string) => {
    setActiveDocument(docId);
    if (onMobileClose) onMobileClose(); // Close mobile sidebar after selecting
  };
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
          <div className="flex items-center justify-between border-b p-4 bg-gradient-to-r from-background via-background/95 to-background/90">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold leading-none">Documents</h2>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {documentCount} items
                  </span>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className={cn("hidden md:flex", isCollapsed && "mx-auto")}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>
          </div>


          {/* Document List */}
          <div className="flex-1 overflow-hidden">
            {!isCollapsed ? (
              <DocumentList
                onDocumentSelect={(docId) => {
                  if (onMobileClose) onMobileClose();
                }}
                className="h-full"
                searchQuery={searchQuery}
              />
            ) : (
              /* Collapsed View - Show Recent Documents */
              <div className="p-2 space-y-1">
                {recentDocuments.slice(0, 4).map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleDocumentClick(doc.id)}
                    className={cn(
                      "flex w-full items-center justify-center rounded-md p-2 text-sm hover:bg-accent hover:text-accent-foreground",
                      activeDocumentId === doc.id && "bg-accent text-accent-foreground"
                    )}
                    title={doc.title}
                  >
                    <div className="flex items-center">
                      <svg
                        className="h-4 w-4 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                      {doc.isFavorite && (
                        <svg
                          className="h-3 w-3 text-yellow-500 -ml-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </aside>
    </>
  );
} 