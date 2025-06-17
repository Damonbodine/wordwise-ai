"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDocumentStore } from '@/stores/document-store';
import { useEditorStore } from '@/stores/editor-store';

export interface AutoSaveStatus {
  isLoading: boolean;
  lastSaved: Date | null;
  error: string | null;
  hasUnsavedChanges: boolean;
}

export interface UseAutoSaveOptions {
  /**
   * Debounce delay in milliseconds before triggering auto-save
   * @default 2000
   */
  debounceMs?: number;
  
  /**
   * Whether auto-save is enabled
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Maximum number of retry attempts on save failure
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Callback fired when save operation completes successfully
   */
  onSaveSuccess?: (documentId: string) => void;
  
  /**
   * Callback fired when save operation fails
   */
  onSaveError?: (error: string, documentId: string) => void;
}

export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const {
    debounceMs = 2000,
    enabled = true,
    maxRetries = 3,
    onSaveSuccess,
    onSaveError,
  } = options;

  // Store hooks
  const { activeDocumentId, updateDocumentContent } = useDocumentStore();
  const { 
    currentEditorContent, 
    markSaved, 
    markUnsaved,
    setAutoSaving,
    lastSaved: editorLastSaved,
    hasUnsavedChanges: editorHasUnsavedChanges,
  } = useEditorStore();

  // Local state for auto-save status
  const [status, setStatus] = useState<AutoSaveStatus>({
    isLoading: false,
    lastSaved: editorLastSaved,
    error: null,
    hasUnsavedChanges: editorHasUnsavedChanges,
  });

  // Refs for debouncing and retry logic
  const timeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef<number>(0);
  const lastContentRef = useRef<string>('');
  const isMountedRef = useRef<boolean>(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Update status when editor store changes
  useEffect(() => {
    if (isMountedRef.current) {
      setStatus(prev => ({
        ...prev,
        lastSaved: editorLastSaved,
        hasUnsavedChanges: editorHasUnsavedChanges,
      }));
    }
  }, [editorLastSaved, editorHasUnsavedChanges]);

  // Save function with retry logic
  const performSave = useCallback(async (
    documentId: string, 
    content: string, 
    plainText: string,
    retryCount: number = 0
  ): Promise<void> => {
    if (!isMountedRef.current) return;

    try {
      console.log(`💾 Auto-save attempt ${retryCount + 1} for document: ${documentId}`);
      
      // Update stores to indicate saving is in progress
      setAutoSaving(true);
      setStatus(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null 
      }));

      // Perform the save operation
      await updateDocumentContent(documentId, content, plainText);

      if (!isMountedRef.current) return;

      // Mark as saved in editor store
      markSaved();
      
      // Update local status
      const saveTime = new Date();
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        lastSaved: saveTime,
        hasUnsavedChanges: false,
        error: null,
      }));

      // Reset retry counter on success
      retryCountRef.current = 0;

      console.log(`✅ Auto-save successful for document: ${documentId}`);
      onSaveSuccess?.(documentId);

    } catch (error) {
      if (!isMountedRef.current) return;

      const errorMessage = error instanceof Error ? error.message : 'Unknown save error';
      console.error(`❌ Auto-save failed (attempt ${retryCount + 1}):`, errorMessage);

      // Retry logic
      if (retryCount < maxRetries) {
        const nextRetryCount = retryCount + 1;
        retryCountRef.current = nextRetryCount;
        
        console.log(`🔄 Retrying auto-save in ${nextRetryCount * 1000}ms...`);
        
        // Exponential backoff for retries
        setTimeout(() => {
          if (isMountedRef.current) {
            performSave(documentId, content, plainText, nextRetryCount);
          }
        }, nextRetryCount * 1000);
        
        // Update status to show retry attempt
        setStatus(prev => ({
          ...prev,
          error: `Save failed, retrying... (${nextRetryCount}/${maxRetries})`,
        }));
      } else {
        // All retries exhausted
        setStatus(prev => ({
          ...prev,
          isLoading: false,
          error: `Save failed: ${errorMessage}`,
        }));
        
        retryCountRef.current = 0;
        onSaveError?.(errorMessage, documentId);
      }
    } finally {
      if (isMountedRef.current) {
        setAutoSaving(false);
      }
    }
  }, [updateDocumentContent, markSaved, setAutoSaving, maxRetries, onSaveSuccess, onSaveError]);

  // Debounced save trigger
  const triggerAutoSave = useCallback((content: string, plainText: string) => {
    if (!enabled || !activeDocumentId || !isMountedRef.current) {
      return;
    }

    // Skip if content hasn't actually changed
    if (content === lastContentRef.current) {
      return;
    }

    lastContentRef.current = content;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Mark as unsaved immediately
    markUnsaved();
    setStatus(prev => ({ 
      ...prev, 
      hasUnsavedChanges: true,
      error: null 
    }));

    console.log(`⏰ Auto-save scheduled in ${debounceMs}ms for document: ${activeDocumentId}`);

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && activeDocumentId) {
        performSave(activeDocumentId, content, plainText);
      }
    }, debounceMs);
  }, [enabled, activeDocumentId, debounceMs, markUnsaved, performSave]);

  // Manual save function
  const saveNow = useCallback(async (): Promise<void> => {
    if (!activeDocumentId || !currentEditorContent || !isMountedRef.current) {
      console.warn('⚠️ Cannot save: no active document or content');
      return;
    }

    // Clear any pending auto-save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Extract plain text from HTML content (basic implementation)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = currentEditorContent;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    await performSave(activeDocumentId, currentEditorContent, plainText);
  }, [activeDocumentId, currentEditorContent, performSave]);

  // Cancel any pending save
  const cancelPendingSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      console.log('🚫 Cancelled pending auto-save');
    }
  }, []);

  // Return the auto-save interface
  return {
    /**
     * Trigger an auto-save with debouncing
     */
    triggerAutoSave,
    
    /**
     * Save immediately without debouncing
     */
    saveNow,
    
    /**
     * Cancel any pending auto-save operation
     */
    cancelPendingSave,
    
    /**
     * Current auto-save status
     */
    status,
    
    /**
     * Quick access to common status checks
     */
    isLoading: status.isLoading,
    hasError: !!status.error,
    hasUnsavedChanges: status.hasUnsavedChanges,
    lastSaved: status.lastSaved,
    error: status.error,
  };
}