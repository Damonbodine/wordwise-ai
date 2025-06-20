"use client";

import * as React from "react";
import { Edit3, FileText, Settings, Save, Clock, Type, Hash, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/stores/document-store";
import { useEditorStore } from "@/stores/editor-store";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useAuthStore } from "@/stores/auth-store";
import { useGrammarStore } from "@/stores/grammar-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyboardShortcutsTooltip } from "@/components/ui/keyboard-shortcuts-tooltip";

interface DocumentHeaderProps {
  className?: string;
}

export function DocumentHeader({ className }: DocumentHeaderProps) {
  const {
    activeDocument,
    activeDocumentId,
    updateDocument,
    createDocument,
  } = useDocumentStore();

  const { user } = useAuthStore();
  const { analyzeText } = useGrammarStore();

  const {
    wordCount,
    characterCount,
  } = useEditorStore();

  // Extract stable values for dependencies BEFORE using them
  const userId = user?.id;
  const activeDocumentTitle = activeDocument?.title;

  // Use auto-save hook for consistent status indicators
  const autoSave = useAutoSave({
    enabled: true,
    debounceMs: 500, // Faster for title changes
    userId: userId,
    onSaveSuccess: (documentId) => {
      console.log(`✅ Title auto-save successful for document: ${documentId}`);
    },
    onSaveError: (error, documentId) => {
      console.error(`❌ Title auto-save failed for document ${documentId}:`, error);
    },
  });

  // Local state for title editing
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [titleForNewDocument, setTitleForNewDocument] = React.useState("");

  // Update local title when active document changes
  React.useEffect(() => {
    if (activeDocument) {
      setEditedTitle(activeDocument.title);
      setTitleForNewDocument(""); // Clear new document title when we have an active doc
    } else {
      setEditedTitle("");
    }
  }, [activeDocument?.id, activeDocument?.title]);

  // Handle title editing
  const handleTitleEdit = React.useCallback(() => {
    console.log('🖱️ Title edit clicked:', { activeDocument, isEditingTitle });
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
      
      // Trigger grammar analysis on title change
      setTimeout(() => {
        analyzeText(editedTitle.trim(), activeDocumentId);
      }, 500);
    } catch (error) {
      console.error('❌ Failed to update document title:', error);
    } finally {
      setIsSaving(false);
    }
  }, [activeDocumentId, editedTitle, updateDocument, analyzeText]);

  const handleTitleCancel = React.useCallback(() => {
    if (activeDocument) {
      setEditedTitle(activeDocument.title);
    } else {
      setTitleForNewDocument("");
    }
    setIsEditingTitle(false);
  }, [activeDocument?.title]);

  // Auto-create document when user types title without active document
  const handleCreateDocumentFromTitle = React.useCallback(async (title: string) => {
    if (!userId || !title.trim()) return;

    setIsSaving(true);
    try {
      console.log('📝 Creating document from title:', title.trim());
      const newDoc = await createDocument(title.trim(), "", userId);
      setTitleForNewDocument("");
      console.log('✅ Document created successfully:', newDoc.id);
      
      // Trigger grammar analysis on new document title
      setTimeout(() => {
        analyzeText(title.trim(), newDoc.id);
      }, 500);
    } catch (error) {
      console.error('❌ Failed to create document from title:', error);
    } finally {
      setIsSaving(false);
    }
  }, [createDocument, userId, analyzeText]);

  // Debounced auto-creation for new documents
  React.useEffect(() => {
    if (!activeDocument && titleForNewDocument.trim() && userId) {
      const timeoutId = setTimeout(() => {
        handleCreateDocumentFromTitle(titleForNewDocument);
      }, 1000); // 1 second delay for auto-creation

      return () => clearTimeout(timeoutId);
    }
  }, [titleForNewDocument, activeDocument, handleCreateDocumentFromTitle, userId]);

  // Title auto-save effect that integrates with main auto-save system
  React.useEffect(() => {
    if (activeDocument && editedTitle.trim() && editedTitle !== activeDocumentTitle && !isEditingTitle && userId) {
      const timeoutId = setTimeout(async () => {
        setIsSaving(true);
        try {
          await updateDocument(activeDocumentId!, { title: editedTitle.trim() }, userId);
          console.log('📝 Document title auto-saved:', editedTitle.trim());
          
          // Trigger grammar analysis on auto-saved title
          setTimeout(() => {
            analyzeText(editedTitle.trim(), activeDocumentId!);
          }, 300);
        } catch (error) {
          console.error('❌ Failed to auto-save document title:', error);
        } finally {
          setIsSaving(false);
        }
      }, 500); // 500ms delay for title updates

      return () => clearTimeout(timeoutId);
    }
  }, [editedTitle, activeDocumentTitle, isEditingTitle, updateDocument, activeDocumentId, analyzeText, userId, activeDocument]);

  // Handle keyboard events for title editing
  const handleTitleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeDocument) {
        handleTitleSave();
      } else if (titleForNewDocument.trim()) {
        handleCreateDocumentFromTitle(titleForNewDocument);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleTitleCancel();
    }
  }, [handleTitleSave, handleTitleCancel, activeDocument, titleForNewDocument, handleCreateDocumentFromTitle]);

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

  // Always show title input - either for existing document or new document creation
  const showingNewDocumentInput = !activeDocument;

  return (
    <div className={cn("group flex items-center p-4 border-b border-border bg-background", className)}>
      {/* Left Side - Document Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0 max-w-md">
        <FileText className={cn("w-5 h-5 flex-shrink-0", showingNewDocumentInput ? "text-muted-foreground" : "text-primary")} />
        
        {showingNewDocumentInput ? (
          /* New Document Title Input */
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Input
              value={titleForNewDocument}
              onChange={(e) => setTitleForNewDocument(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              placeholder="Enter document title..."
              className="text-lg font-semibold"
              autoFocus
              disabled={isSaving}
            />
            {isSaving && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                <span>Creating...</span>
              </div>
            )}
          </div>
        ) : isEditingTitle ? (
          /* Existing Document Title Editing */
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
          /* Existing Document Title Display */
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h1 
              className="text-lg font-semibold truncate cursor-pointer hover:text-primary transition-colors min-w-[100px]"
              onClick={handleTitleEdit}
              title="Click to edit title"
            >
              {activeDocument!.title}
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
      {!showingNewDocumentInput && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground px-4">
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
      )}

      {/* Right Side - Status and Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Save Status with Enhanced Error Handling */}
        <div className="flex items-center gap-2 text-sm">
          {autoSave.hasError ? (
            <div className="flex items-center gap-1 text-red-600" title={autoSave.error || 'Save error'}>
              <div className="h-2 w-2 rounded-full bg-red-600" />
              <span className="hidden sm:inline">Error</span>
            </div>
          ) : autoSave.isLoading ? (
            <div className="flex items-center gap-1 text-blue-600">
              <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="hidden sm:inline">Saving...</span>
            </div>
          ) : autoSave.hasUnsavedChanges ? (
            <div className="flex items-center gap-1 text-orange-600">
              <div className="h-2 w-2 rounded-full bg-orange-600" />
              <span className="hidden sm:inline">Unsaved</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-600">
              <div className="h-2 w-2 rounded-full bg-green-600" />
              <span className="hidden sm:inline">Saved</span>
              {autoSave.lastSaved && (
                <span className="hidden lg:inline text-xs text-muted-foreground ml-1">
                  {formatLastSaved(autoSave.lastSaved)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Help - Interactive Tooltip */}
        <KeyboardShortcutsTooltip>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 px-2 text-xs font-medium hover:bg-secondary/80 transition-colors"
          >
            <Keyboard className="w-3 h-3 mr-1" />
            <span className="hidden md:inline">Shortcuts</span>
          </Button>
        </KeyboardShortcutsTooltip>

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