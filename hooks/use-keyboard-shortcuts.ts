"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useDocumentStore } from '@/stores/document-store';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

interface KeyboardShortcutsOptions {
  enabled?: boolean;
  onSave?: () => void;
  onNewDocument?: () => void;
  onBold?: () => void;
  onItalic?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Checks if the current platform is macOS
 */
const isMac = (): boolean => {
  if (typeof window === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
         navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
};

/**
 * Creates a key combination string for display purposes
 */
const formatShortcut = (key: string, ctrl: boolean = false, shift: boolean = false): string => {
  const modifier = isMac() ? '⌘' : 'Ctrl';
  const shiftSymbol = shift ? (isMac() ? '⇧' : 'Shift+') : '';
  return `${shiftSymbol}${ctrl ? modifier + '+' : ''}${key.toUpperCase()}`;
};

/**
 * Checks if a keyboard event matches a shortcut definition
 */
const matchesShortcut = (event: KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
  const isCorrectKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
  const isCorrectCtrl = isMac() ? 
    (shortcut.metaKey === event.metaKey) : 
    (shortcut.ctrlKey === event.ctrlKey);
  const isCorrectShift = (shortcut.shiftKey || false) === event.shiftKey;
  const isCorrectAlt = (shortcut.altKey || false) === event.altKey;

  return isCorrectKey && isCorrectCtrl && isCorrectShift && isCorrectAlt;
};

/**
 * Checks if the current focus is on an input element where we should prevent shortcuts
 */
const shouldPreventShortcut = (event: KeyboardEvent): boolean => {
  const target = event.target as HTMLElement;
  if (!target) return false;

  const tagName = target.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea';
  const isContentEditable = target.contentEditable === 'true';
  
  // Allow formatting shortcuts in content editable areas, but prevent others
  if (isContentEditable) {
    const formattingKeys = ['b', 'i'];
    return !formattingKeys.includes(event.key.toLowerCase());
  }
  
  return isInput;
};

// =============================================================================
// KEYBOARD SHORTCUTS HOOK
// =============================================================================

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const {
    enabled = true,
    onSave,
    onNewDocument,
    onBold,
    onItalic,
    onUndo,
    onRedo,
  } = options;

  const { createDocument, activeDocument } = useDocumentStore();
  const lastActionRef = useRef<string>('');

  // Default actions
  const defaultSave = useCallback(async () => {
    if (activeDocument) {
      console.log('💾 Force save triggered via keyboard shortcut');
      // The auto-save system will handle the actual saving
      // We just trigger a visual indication or manual save
      lastActionRef.current = 'save';
    }
  }, [activeDocument]);

  const defaultNewDocument = useCallback(() => {
    try {
      const newDoc = createDocument();
      console.log('📝 New document created via keyboard shortcut:', newDoc.title);
      lastActionRef.current = 'new-document';
    } catch (error) {
      console.error('❌ Failed to create document via keyboard shortcut:', error);
    }
  }, [createDocument]);

  const defaultBold = useCallback(() => {
    try {
      const result = document.execCommand('bold');
      console.log('📝 Bold formatting applied via keyboard shortcut:', result);
      
      // Fallback: Add CSS class if execCommand doesn't work
      if (!result) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const span = document.createElement('span');
          span.style.fontWeight = 'bold';
          try {
            range.surroundContents(span);
          } catch (e) {
            console.log('Fallback bold formatting failed:', e);
          }
        }
      }
      lastActionRef.current = 'bold';
    } catch (error) {
      console.error('Bold formatting error:', error);
    }
  }, []);

  const defaultItalic = useCallback(() => {
    try {
      const result = document.execCommand('italic');
      console.log('📝 Italic formatting applied via keyboard shortcut:', result);
      
      // Fallback: Add CSS class if execCommand doesn't work
      if (!result) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const span = document.createElement('span');
          span.style.fontStyle = 'italic';
          try {
            range.surroundContents(span);
          } catch (e) {
            console.log('Fallback italic formatting failed:', e);
          }
        }
      }
      lastActionRef.current = 'italic';
    } catch (error) {
      console.error('Italic formatting error:', error);
    }
  }, []);

  const defaultUndo = useCallback(() => {
    try {
      const result = document.execCommand('undo');
      console.log('↩️ Undo action triggered via keyboard shortcut:', result);
      lastActionRef.current = 'undo';
    } catch (error) {
      console.error('Undo error:', error);
    }
  }, []);

  const defaultRedo = useCallback(() => {
    try {
      const result = document.execCommand('redo');
      console.log('↪️ Redo action triggered via keyboard shortcut:', result);
      lastActionRef.current = 'redo';
    } catch (error) {
      console.error('Redo error:', error);
    }
  }, []);

  // Define all keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    // Save - Ctrl+S / Cmd+S
    {
      key: 's',
      ...(isMac() ? { metaKey: true } : { ctrlKey: true }),
      action: onSave || defaultSave,
      description: `${formatShortcut('S', true)} - Save document`,
      preventDefault: true,
    },
    // New Document - Ctrl+N / Cmd+N
    {
      key: 'n',
      ...(isMac() ? { metaKey: true } : { ctrlKey: true }),
      action: onNewDocument || defaultNewDocument,
      description: `${formatShortcut('N', true)} - New document`,
      preventDefault: true,
    },
    // Bold - Ctrl+B / Cmd+B
    {
      key: 'b',
      ...(isMac() ? { metaKey: true } : { ctrlKey: true }),
      action: onBold || defaultBold,
      description: `${formatShortcut('B', true)} - Bold text`,
      preventDefault: true,
    },
    // Italic - Ctrl+I / Cmd+I
    {
      key: 'i',
      ...(isMac() ? { metaKey: true } : { ctrlKey: true }),
      action: onItalic || defaultItalic,
      description: `${formatShortcut('I', true)} - Italic text`,
      preventDefault: true,
    },
    // Undo - Ctrl+Z / Cmd+Z
    {
      key: 'z',
      ...(isMac() ? { metaKey: true } : { ctrlKey: true }),
      action: onUndo || defaultUndo,
      description: `${formatShortcut('Z', true)} - Undo`,
      preventDefault: true,
    },
    // Redo - Ctrl+Y / Cmd+Y (Windows) or Cmd+Shift+Z (Mac)
    ...(isMac() ? [
      {
        key: 'z',
        metaKey: true,
        shiftKey: true,
        action: onRedo || defaultRedo,
        description: `${formatShortcut('Z', true, true)} - Redo`,
        preventDefault: true,
      }
    ] : [
      {
        key: 'y',
        ctrlKey: true,
        action: onRedo || defaultRedo,
        description: `${formatShortcut('Y', true)} - Redo`,
        preventDefault: true,
      }
    ]),
  ];

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Find matching shortcut
    const matchingShortcut = shortcuts.find(shortcut => matchesShortcut(event, shortcut));
    
    if (matchingShortcut) {
      // Check if we should prevent the shortcut based on current focus
      const shouldPrevent = shouldPreventShortcut(event);
      
      // Always allow formatting shortcuts in content editable areas
      const isFormattingShortcut = ['b', 'i'].includes(event.key.toLowerCase());
      const target = event.target as HTMLElement;
      const isContentEditable = target?.contentEditable === 'true';
      
      if (shouldPrevent && !(isFormattingShortcut && isContentEditable)) {
        return;
      }

      // Prevent default browser behavior if specified
      if (matchingShortcut.preventDefault) {
        event.preventDefault();
        event.stopPropagation();
      }

      // Execute the shortcut action
      try {
        matchingShortcut.action();
      } catch (error) {
        console.error('❌ Error executing keyboard shortcut:', error);
      }
    }
  }, [enabled, shortcuts]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  // Return utility functions and state
  return {
    shortcuts,
    lastAction: lastActionRef.current,
    isEnabled: enabled,
    isMac: isMac(),
    formatShortcut,
  };
}

// =============================================================================
// HELPER HOOK FOR SHORTCUT DISPLAY
// =============================================================================

/**
 * Hook to get formatted shortcut strings for UI display
 */
export function useShortcutHelpers() {
  const platform = isMac();
  
  const getShortcut = useCallback((action: string): string => {
    const shortcuts: Record<string, string> = {
      save: formatShortcut('S', true),
      new: formatShortcut('N', true),
      bold: formatShortcut('B', true),
      italic: formatShortcut('I', true),
      undo: formatShortcut('Z', true),
      redo: platform ? formatShortcut('Z', true, true) : formatShortcut('Y', true),
    };
    
    return shortcuts[action] || '';
  }, [platform]);

  return {
    getShortcut,
    isMac: platform,
  };
}

// =============================================================================
// CONSTANTS FOR EXPORT
// =============================================================================

export const KEYBOARD_SHORTCUTS = {
  SAVE: isMac() ? '⌘+S' : 'Ctrl+S',
  NEW_DOCUMENT: isMac() ? '⌘+N' : 'Ctrl+N',
  BOLD: isMac() ? '⌘+B' : 'Ctrl+B',
  ITALIC: isMac() ? '⌘+I' : 'Ctrl+I',
  UNDO: isMac() ? '⌘+Z' : 'Ctrl+Z',
  REDO: isMac() ? '⌘+⇧+Z' : 'Ctrl+Y',
} as const;