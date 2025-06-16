"use client";

import * as React from "react";
import { Edit3, FileText, Settings, Save, Clock, Type, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/stores/document-store";
import { useEditorStore } from "@/stores/editor-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DocumentHeaderProps {
  className?: string;
}

export function DocumentHeader({ className }: DocumentHeaderProps) {
  const {
    activeDocument,
    activeDocumentId,
    updateDocument,
  } = useDocumentStore();

  const {
    wordCount,
    characterCount,
    hasUnsavedChanges,
    lastSaved,
    isAutoSaving,
  } = useEditorStore();

  // Local state for title editing
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  // Update local title when active document changes
  React.useEffect(() => {
    if (activeDocument) {
      setEditedTitle(activeDocument.title);
    }
  }, [activeDocument?.id, activeDocument?.title]);

  // Handle title editing
  const handleTitleEdit = React.useCallback(() => {
    if (activeDocument) {
      setEditedTitle(activeDocument.title);
      setIsEditingTitle(true);
    }
  }, [activeDocument?.title]);

  const handleTitleSave = React.useCallback(async () => {
    if (!activeDocumentId || !editedTitle.trim()) return;

    setIsSaving(true);
    try {
      await updateDocument(activeDocumentId, { 
        title: editedTitle.trim() 
      });
      setIsEditingTitle(false);
      console.log('📝 Document title updated:', editedTitle.trim());
    } catch (error) {
      console.error('❌ Failed to update document title:', error);
    } finally {
      setIsSaving(false);
    }
  }, [activeDocumentId, editedTitle, updateDocument]);

  const handleTitleCancel = React.useCallback(() => {
    if (activeDocument) {
      setEditedTitle(activeDocument.title);
    }
    setIsEditingTitle(false);
  }, [activeDocument?.title]);

  // Handle keyboard events for title editing
  const handleTitleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleTitleCancel();
    }
  }, [handleTitleSave, handleTitleCancel]);

  // Format last saved time
  const formatLastSaved = React.useCallback((date: Date | null) => {
    if (!date) return null;
    
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  }, []);

  // Calculate reading time
  const readingTime = React.useMemo(() => {
    return Math.ceil(wordCount / 200) || 1; // 200 WPM average
  }, [wordCount]);

  if (!activeDocument) {
    return (
      <div className={cn("flex items-center justify-between p-4 border-b border-border bg-muted/30", className)}>
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground">No document selected</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group flex items-center justify-between p-4 border-b border-border bg-background", className)}>
      {/* Left Side - Document Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <FileText className="w-5 h-5 text-primary flex-shrink-0" />
        
        {isEditingTitle ? (
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={handleTitleSave}
              placeholder="Document title..."
              className="text-lg font-semibold"
              autoFocus
              disabled={isSaving}
            />
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleTitleSave}
                disabled={isSaving || !editedTitle.trim()}
                className="h-8 w-8 p-0"
                title="Save title (Enter)"
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleTitleCancel}
                disabled={isSaving}
                className="h-8 w-8 p-0"
                title="Cancel (Esc)"
              >
                <Type className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h1 
              className="text-lg font-semibold truncate cursor-pointer hover:text-primary transition-colors"
              onClick={handleTitleEdit}
              title="Click to edit title"
            >
              {activeDocument.title}
            </h1>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleTitleEdit}
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
              title="Edit title"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Center - Document Statistics */}
      <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-1" title="Word count">
          <Type className="w-4 h-4" />
          <span className="font-medium">{wordCount.toLocaleString()}</span>
          <span>words</span>
        </div>
        
        <div className="flex items-center gap-1" title="Character count">
          <Hash className="w-4 h-4" />
          <span className="font-medium">{characterCount.toLocaleString()}</span>
          <span>chars</span>
        </div>
        
        <div className="flex items-center gap-1" title="Reading time">
          <Clock className="w-4 h-4" />
          <span className="font-medium">{readingTime}</span>
          <span>min read</span>
        </div>
      </div>

      {/* Right Side - Status and Actions */}
      <div className="flex items-center gap-3">
        {/* Save Status */}
        <div className="flex items-center gap-2 text-sm">
          {isAutoSaving ? (
            <div className="flex items-center gap-1 text-blue-600">
              <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="hidden sm:inline">Saving...</span>
            </div>
          ) : hasUnsavedChanges ? (
            <div className="flex items-center gap-1 text-orange-600">
              <div className="h-2 w-2 rounded-full bg-orange-600" />
              <span className="hidden sm:inline">Unsaved</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-600">
              <div className="h-2 w-2 rounded-full bg-green-600" />
              <span className="hidden sm:inline">Saved</span>
              {lastSaved && (
                <span className="hidden lg:inline text-xs text-muted-foreground ml-1">
                  {formatLastSaved(lastSaved)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Settings Dropdown Placeholder */}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          title="Document settings (coming soon)"
          disabled
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}