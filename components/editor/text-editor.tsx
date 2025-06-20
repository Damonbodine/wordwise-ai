"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Underline from "@tiptap/extension-underline";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import { useDocumentStore } from "@/stores/document-store";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useGrammarStore } from "@/stores/grammar-store";
import { useAuthStore } from "@/stores/auth-store";
import { useWritingStyleStore } from "@/stores/writing-style-store";
import { hunspellService } from "@/services/hunspell-service";
import { GrammarHighlightExtension } from "./grammar-highlight-extension";
import { GrammarSuggestionPopup } from "./grammar-suggestion-popup";
import "@/styles/grammar-highlighting.css";

interface TextEditorProps {
  className?: string;
  placeholder?: string;
  editable?: boolean;
  autofocus?: boolean;
  onApplyTextReplacement?: (replacement: { originalText: string; suggestedText: string }) => void;
}

// Export ref interface for parent components
export interface TextEditorRef {
  applyTextReplacement: (replacement: { originalText: string; suggestedText: string }) => boolean;
}

export const TextEditor = React.forwardRef<TextEditorRef, TextEditorProps>(({
  className,
  placeholder = "Start writing your thoughts...",
  editable = true,
  autofocus = true,
  onApplyTextReplacement,
}, ref) => {
  const {
    currentEditorContent,
    setEditorContent,
    editorSettings,
    setEditorFocus,
    wordCount,
    characterCount,
  } = useEditorStore();

  const {
    activeDocument,
    activeDocumentId,
    documents,
  } = useDocumentStore();

  // Get user for database operations
  const { user } = useAuthStore();
  
  // Get current writing style
  const { currentStyle } = useWritingStyleStore();

  // Initialize grammar analysis store
  const {
    analyzeText,
    isAnalyzing,
    issues,
    acceptSuggestion,
    rejectSuggestion,
    clearAnalysis,
  } = useGrammarStore();

  // State for automatic suggestion popup
  const [popupState, setPopupState] = React.useState<{
    issue: any | null;
    position: { x: number; y: number } | null;
    isVisible: boolean;
  }>({
    issue: null,
    position: null,
    isVisible: false,
  });

  // Initialize auto-save hook with 2-second debounce as specified
  const autoSave = useAutoSave({
    debounceMs: 2000,
    enabled: true,
    maxRetries: 3,
    userId: user?.id, // Pass user ID for database persistence
    onSaveSuccess: (documentId) => {
      console.log(`✅ Auto-save successful for document: ${documentId}`);
    },
    onSaveError: (error, documentId) => {
      console.error(`❌ Auto-save failed for document ${documentId}:`, error);
    },
  });

  // Real-time grammar analysis with 2-second intervals
  const grammarAnalysisIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastAnalyzedTextRef = React.useRef<string>('');
  const currentTextRef = React.useRef<string>('');
  const textChangedRef = React.useRef<boolean>(false);
  
  const triggerGrammarAnalysis = React.useCallback(async (text: string) => {
    // Update current text and mark as changed
    currentTextRef.current = text;
    textChangedRef.current = true;
    
    // Re-enable Hunspell with debouncing to prevent loops
    if (text.trim() && text.length >= 5) {
      console.log('[HUNSPELL] Scheduling debounced analysis for text:', text.slice(0, 50));
      
      // Clear previous timeout
      clearTimeout((window as any).hunspellDebounceTimeout);
      
      // Only run Hunspell after user stops typing for 1 second
      (window as any).hunspellDebounceTimeout = setTimeout(async () => {
        try {
          console.log('[HUNSPELL] Debounced analysis triggered for text:', text.slice(0, 50));
          const spellingIssues = await hunspellService.analyzeSpelling(text);
          console.log('[HUNSPELL] Analysis complete, found:', spellingIssues.length, 'issues');
          
          if (spellingIssues.length > 0) {
            // Add spelling issues to grammar store
            const { addIssues } = useGrammarStore.getState();
            addIssues(spellingIssues);
            console.log(`[HUNSPELL] Added ${spellingIssues.length} spelling issues to store`);
          } else {
            console.log('[HUNSPELL] No spelling issues found');
          }
        } catch (error) {
          console.warn('[HUNSPELL] Spell check failed:', error);
        }
      }, 1000); // 1 second delay for Hunspell (faster than grammar)
    } else {
      console.log('[HUNSPELL] Skipping - text too short:', text.length);
    }
    
    // TEMPORARILY DISABLE ALL INTERVAL-BASED ANALYSIS
    // Start interval if not already running
    // if (!grammarAnalysisIntervalRef.current && text.trim()) {
    //   console.log('[GRAMMAR] Starting real-time analysis interval');
    //   
    //   grammarAnalysisIntervalRef.current = setInterval(() => {
    //     const currentText = currentTextRef.current;
    //     
    //     // Only analyze if text has changed and has content
    //     if (textChangedRef.current && currentText.trim() && currentText !== lastAnalyzedTextRef.current) {
    //       // Limit text length to save tokens (max 500 chars)
    //       const analysisText = currentText.length > 500 ? currentText.substring(0, 500) + '...' : currentText;
    //       
    //       console.log('[GRAMMAR] Real-time analysis trigger - GROQ DISABLED');
    //       
    //       lastAnalyzedTextRef.current = currentText;
    //       textChangedRef.current = false;
    //       // TEMPORARILY DISABLE GROQ - CAUSING JSON PARSING ERRORS
    //       // analyzeText(analysisText, activeDocumentId);
    //     }
    //   }, 2000); // Every 2 seconds - matches 30 requests/minute limit
    // }
  }, [analyzeText, activeDocumentId]);
  
  // Clear interval when text becomes empty or component unmounts
  React.useEffect(() => {
    return () => {
      if (grammarAnalysisIntervalRef.current) {
        clearInterval(grammarAnalysisIntervalRef.current);
      }
    };
  }, []);

  // Handle suggestion popup display
  const handleSuggestionClick = React.useCallback((issue: any, position: number, clickPosition?: { x: number; y: number }) => {
    // Use the provided click position if available, otherwise calculate from selection
    if (clickPosition) {
      setPopupState({
        issue,
        position: clickPosition,
        isVisible: true,
      });
    } else {
      // Fallback to selection-based positioning
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setPopupState({
          issue,
          position: {
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          },
          isVisible: true,
        });
      }
    }
  }, []);

  // Close popup
  const handleClosePopup = React.useCallback(() => {
    setPopupState({ issue: null, position: null, isVisible: false });
  }, []);

  // Removed auto-show popup - now only shows on click of underlined text

  // Update extension when issues change - CRITICAL FOR HIGHLIGHTING
  React.useEffect(() => {
    // Only proceed if editor is fully initialized
    if (!editor?.view || !editor?.extensionManager) {
      return;
    }
    
    if (issues && issues.length > 0) {
      console.log(`[EDITOR] Updating highlighting extension with ${issues.length} issues`);
      
      // Update the grammar highlighting extension with new issues
      const grammarExtension = editor.extensionManager.extensions.find(ext => ext.name === 'grammarHighlight');
      if (grammarExtension) {
        grammarExtension.options.issues = issues;
        grammarExtension.options.onSuggestionClick = handleSuggestionClick;
        
        // Force editor to re-render decorations by dispatching a transaction
        try {
          const { state, view } = editor;
          const tr = state.tr;
          view.dispatch(tr);
          console.log(`[EDITOR] Updated extension options and triggered re-render`);
        } catch (error) {
          console.warn(`[EDITOR] Error updating decorations:`, error);
        }
      } else {
        console.warn(`[EDITOR] Grammar highlight extension not found!`);
      }
    } else {
      console.log(`[EDITOR] Clearing highlighting - no issues`);
      // Clear highlighting when no issues
      const grammarExtension = editor.extensionManager?.extensions?.find(ext => ext.name === 'grammarHighlight');
      if (grammarExtension) {
        grammarExtension.options.issues = [];
        try {
          const { state, view } = editor;
          view.dispatch(state.tr);
        } catch (error) {
          console.warn(`[EDITOR] Error clearing decorations:`, error);
        }
      }
    }
  }, [issues]); // Remove editor dependency to avoid initialization error
  
  // Debug the store state
  React.useEffect(() => {
    console.log('📚 Document Store State:', {
      totalDocuments: documents.length,
      activeDocumentId,
      activeDocumentTitle: activeDocument?.title,
      documentIds: documents.map(d => ({ id: d.id, title: d.title }))
    });
  }, [documents.length, activeDocumentId, activeDocument?.title, documents]);

  // Add a local state to force re-renders when document changes
  const [documentChangeCounter, setDocumentChangeCounter] = React.useState(0);
  
  // Track if editor is initializing to prevent auto-save during setup
  const [isInitializing, setIsInitializing] = React.useState(true);
  const hasInitializedRef = React.useRef(false);

  // Subscribe to store changes for activeDocumentId
  React.useEffect(() => {
    const unsubscribe = useDocumentStore.subscribe((state) => {
      console.log('🔔 Store subscription triggered');
      setDocumentChangeCounter(prev => prev + 1);
    });

    return unsubscribe;
  }, []);

  // Manual save function using auto-save hook
  const handleManualSave = () => {
    autoSave.saveNow();
  };

  // Initialize TipTap editor
  const editor = useEditor({
    immediatelyRender: false, // Fix SSR hydration issues
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        blockquote: {},
        listItem: {},
        paragraph: {},
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder,
        considerAnyAsEmpty: true,
        showOnlyWhenEditable: true,
      }),
      CharacterCount.configure({
        limit: editorSettings.performance.maxDocumentSize,
      }),
      GrammarHighlightExtension.configure({
        issues: issues,
        onSuggestionClick: handleSuggestionClick,
      }),
    ],
    content: currentEditorContent || activeDocument?.content || "<p>Click here and start typing, then use the toolbar to format your text...</p>",
    editable: editable,
    autofocus: autofocus,
          editorProps: {
        attributes: {
          class: cn(
            "focus:outline-none max-w-none",
            "min-h-[200px] px-6 py-4",
            "text-foreground leading-relaxed",
            "prose prose-sm sm:prose lg:prose-lg xl:prose-xl", // Add prose classes for better typography
            "prose-gray dark:prose-invert", // Theme-aware prose
            "prose-headings:font-bold prose-headings:text-foreground",
            "prose-p:text-foreground prose-li:text-foreground",
            "prose-blockquote:border-primary prose-blockquote:bg-muted/50",
            "prose-ul:list-disc prose-ol:list-decimal",
            editorSettings.appearance.fontFamily && `font-[${editorSettings.appearance.fontFamily}]`,
            className
          ),
        style: `
          font-size: ${editorSettings.appearance.fontSize}px;
          line-height: ${editorSettings.appearance.lineHeight};
          max-width: ${editorSettings.appearance.maxLineWidth}px;
        `,
        spellcheck: editorSettings.behavior.spellCheck.toString(),
      },
    },
    onCreate: ({ editor }) => {
      // Set initial content from active document if available
      if (activeDocument) {
        const content = activeDocument.content || '<p></p>';
        editor.commands.setContent(content);
        setEditorContent(content, activeDocument.plainText || '');
        console.log(`📝 Editor initialized with document: "${activeDocument.title}"`);
      }
      
      // Mark initialization complete after a short delay
      setTimeout(() => {
        setIsInitializing(false);
        hasInitializedRef.current = true;
      }, 100);
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      
      // Update editor store immediately (real-time) - this calculates all stats
      setEditorContent(html, text);
      
      // Only trigger auto-save if not initializing and content has actually changed
      if (!isInitializing && hasInitializedRef.current) {
        autoSave.triggerAutoSave(html, text);
        
        // Smart grammar analysis triggers (for regular typing - NOT for accept/dismiss)
        if (!isInitializing && text.trim() && text.length >= 10) {
          clearTimeout((window as any).grammarDebounceTimeout);
          
          // Get tracking variables
          const previousText = (window as any).lastAnalyzedText || '';
          const lastAnalysisTime = (window as any).lastAnalysisTime || 0;
          const timeSinceLastAnalysis = Date.now() - lastAnalysisTime;
          
          // Check if this should trigger immediate analysis
          const shouldAnalyzeImmediately = (() => {
            // Check for sentence completion (ends with . ! ? followed by optional space)
            const endsWithSentence = /[.!?]\s*$/.test(text.trim());
            
            // Check for significant text change (20+ characters difference)
            const textDifference = Math.abs(text.length - previousText.length);
            const significantChange = textDifference >= 20;
            
            // Check if it's been a long time since last analysis (30+ seconds)
            const longTimePassed = timeSinceLastAnalysis > 30000;
            
            // Check if this is the first analysis for this document
            const firstAnalysis = !previousText;
            
            return endsWithSentence || significantChange || longTimePassed || firstAnalysis;
          })();
          
          if (shouldAnalyzeImmediately) {
            console.log('[GRAMMAR] 🚀 IMMEDIATE smart analysis triggered:', {
              sentenceEnd: /[.!?]\s*$/.test(text.trim()),
              significantChange: Math.abs(text.length - previousText.length) >= 20,
              longTime: timeSinceLastAnalysis > 30000,
              firstTime: !previousText
            });
            
            // Limit text length to save tokens (max 500 chars)
            const analysisText = text.length > 500 ? text.substring(0, 500) + '...' : text;
            analyzeText(analysisText, activeDocumentId, currentStyle.id);
            
            // Track analysis time and text
            (window as any).lastAnalysisTime = Date.now();
            (window as any).lastAnalyzedText = text;
          } else {
            console.log('[GRAMMAR] ⏰ Scheduling DELAYED analysis - no immediate triggers');
            (window as any).grammarDebounceTimeout = setTimeout(() => {
              console.log('[GRAMMAR] 🚀 DELAYED analysis triggered');
              
              // Limit text length to save tokens (max 500 chars)
              const analysisText = text.length > 500 ? text.substring(0, 500) + '...' : text;
              analyzeText(analysisText, activeDocumentId, currentStyle.id);
              
              // Track analysis time and text
              (window as any).lastAnalysisTime = Date.now();
              (window as any).lastAnalyzedText = text;
            }, 8000); // 8 second delay for non-urgent analysis
          }
        } else {
          console.log('[GRAMMAR] ❌ Skipping analysis - initializing:', isInitializing, 'text length:', text.length);
        }
      }
    },
    onFocus: () => {
      setEditorFocus(true);
    },
    onBlur: () => {
      setEditorFocus(false);
    },
  });


  // Track last loaded document ID to prevent reload loops
  const lastLoadedDocumentIdRef = React.useRef<string | null>(null);
  
  // Update editor content when active document changes
  React.useEffect(() => {
    // Use current reactive state from the hook, not getState()
    const currentActiveDocument = activeDocument;
    
    console.log('🔄 Editor useEffect triggered:', {
      hasEditor: !!editor,
      storeActiveDocumentId: activeDocumentId,
      foundDocument: !!currentActiveDocument,
      documentTitle: currentActiveDocument?.title,
      documentContentLength: currentActiveDocument?.content?.length || 0,
      lastLoadedId: lastLoadedDocumentIdRef.current,
    });
    
    if (!editor) {
      console.log('⏳ Editor not ready yet');
      return;
    }
    
    if (currentActiveDocument) {
      // Prevent reload loop - only load if document ID has actually changed
      if (lastLoadedDocumentIdRef.current === currentActiveDocument.id) {
        console.log('📋 Skipping document reload - same document ID:', currentActiveDocument.id);
        return;
      }
      
      const documentContent = currentActiveDocument.content || '<p></p>';
      const currentEditorContent = editor.getHTML();
      
      console.log('📋 Loading document content:', {
        docId: currentActiveDocument.id,
        docTitle: currentActiveDocument.title,
        contentPreview: documentContent.slice(0, 100),
        isEmptyDocument: documentContent === '<p></p>' || documentContent === '',
        currentEditorContentPreview: currentEditorContent.slice(0, 50)
      });
      
      // Always update content - no comparison check to ensure it loads
      try {
        // Reset initialization flag when switching documents
        setIsInitializing(true);
        hasInitializedRef.current = false;
        
        editor.commands.setContent(documentContent);
        setEditorContent(documentContent, currentActiveDocument.plainText || '');
        lastLoadedDocumentIdRef.current = currentActiveDocument.id; // Track loaded document
        console.log(`✅ Successfully loaded document: "${currentActiveDocument.title}"`);
        
        // Mark as initialized after content is set
        setTimeout(() => {
          setIsInitializing(false);
          hasInitializedRef.current = true;
          
          // Trigger initial grammar analysis for loaded document
          if (currentActiveDocument.plainText && currentActiveDocument.plainText.length >= 10) {
            setTimeout(() => {
              console.log('[GRAMMAR] Triggering initial analysis for loaded document');
              const analysisText = currentActiveDocument.plainText!.length > 500 
                ? currentActiveDocument.plainText!.substring(0, 500) + '...' 
                : currentActiveDocument.plainText!;
              analyzeText(analysisText, currentActiveDocument.id, currentStyle.id);
            }, 1000); // Delay to allow editor to fully initialize
          }
        }, 100);
        
        // Focus editor for empty documents
        if (documentContent === '<p></p>' || documentContent === '') {
          setTimeout(() => {
            editor.commands.focus();
            console.log('🎯 Focused editor for empty document');
          }, 200);
        }
      } catch (error) {
        console.error('❌ Failed to load document content:', error);
        setIsInitializing(false);
        hasInitializedRef.current = true;
      }
    } else if (activeDocumentId) {
      console.warn('⚠️ Active document ID set but document not found:', activeDocumentId);
      console.log('Available documents:', documents.map(d => ({ id: d.id, title: d.title })));
    } else {
      console.log('📭 No active document, clearing editor');
      editor.commands.setContent('<p></p>');
      setEditorContent('<p></p>', '');
    }
  }, [activeDocument, editor, documentChangeCounter]);

  // Cleanup auto-save and grammar analysis on unmount
  React.useEffect(() => {
    return () => {
      // Cancel any pending auto-save operations on unmount
      autoSave.cancelPendingSave();
      
      // Cancel any pending grammar analysis
      if (grammarAnalysisIntervalRef.current) {
        clearInterval(grammarAnalysisIntervalRef.current);
      }
    };
  }, []); // Empty dependency array - only run on unmount

  // Update editor settings when they change
  React.useEffect(() => {
    if (editor) {
      // Update editable state
      editor.setEditable(editable);
      
      // Update character count limit
      const characterCountExtension = editor.extensionManager.extensions.find(
        ext => ext.name === 'characterCount'
      );
      if (characterCountExtension) {
        editor.commands.setMeta('characterCountLimit', editorSettings.performance.maxDocumentSize);
      }
    }
  }, [editor, editable, editorSettings.performance.maxDocumentSize]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Bold: Cmd/Ctrl + B
      if ((event.metaKey || event.ctrlKey) && event.key === 'b' && !event.shiftKey) {
        event.preventDefault();
        editor.chain().focus().toggleBold().run();
      }
      
      // Italic: Cmd/Ctrl + I
      if ((event.metaKey || event.ctrlKey) && event.key === 'i' && !event.shiftKey) {
        event.preventDefault();
        editor.chain().focus().toggleItalic().run();
      }
      
      // Underline: Cmd/Ctrl + U
      if ((event.metaKey || event.ctrlKey) && event.key === 'u' && !event.shiftKey) {
        event.preventDefault();
        editor.chain().focus().toggleUnderline().run();
      }

      // Undo: Cmd/Ctrl + Z
      if ((event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        editor.chain().focus().undo().run();
      }

      // Redo: Cmd/Ctrl + Shift + Z
      if ((event.metaKey || event.ctrlKey) && event.key === 'z' && event.shiftKey) {
        event.preventDefault();
        editor.chain().focus().redo().run();
      }

      // Manual Save: Cmd/Ctrl + S
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        handleManualSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor]);

  // Function to apply text replacement directly to TipTap editor
  const applyTextReplacement = React.useCallback((replacement: { originalText: string; suggestedText: string }) => {
    if (!editor) {
      console.warn('[TEXT EDITOR] Cannot apply replacement: editor not ready');
      return false;
    }

    try {
      const currentPlainText = editor.getText();
      const currentHTML = editor.getHTML();
      
      console.log('[TEXT EDITOR] Attempting replacement:', {
        originalText: replacement.originalText,
        suggestedText: replacement.suggestedText,
        currentPlainText: currentPlainText.slice(0, 100) + '...',
        plainTextIncludes: currentPlainText.includes(replacement.originalText)
      });
      
      // Check if the original text exists in the plain text content
      if (currentPlainText.includes(replacement.originalText)) {
        // Simple and reliable approach: use string replacement on content
        let replaced = false;
        
        try {
          // Method 1: Try HTML content replacement (preserves formatting)
          const currentHTML = editor.getHTML();
          const updatedHTML = currentHTML.replace(replacement.originalText, replacement.suggestedText);
          
          if (updatedHTML !== currentHTML) {
            editor.commands.setContent(updatedHTML);
            replaced = true;
            console.log('[TEXT EDITOR] Successfully replaced using HTML method');
          } else {
            // Method 2: Try plain text replacement with setContent
            const updatedPlainText = currentPlainText.replace(replacement.originalText, replacement.suggestedText);
            if (updatedPlainText !== currentPlainText) {
              editor.commands.setContent(`<p>${updatedPlainText}</p>`);
              replaced = true;
              console.log('[TEXT EDITOR] Successfully replaced using plain text method');
            }
          }
        } catch (contentError) {
          console.warn('[TEXT EDITOR] Content replacement failed:', contentError);
          replaced = false;
        }
        
        if (replaced) {
          // Get updated content after replacement
          const updatedHTML = editor.getHTML();
          const updatedPlainText = editor.getText();
          
          // Update the editor store
          setEditorContent(updatedHTML, updatedPlainText);
          
          // Trigger auto-save
          if (!isInitializing && hasInitializedRef.current) {
            autoSave.triggerAutoSave(updatedHTML, updatedPlainText);
          }
          
          console.log('[TEXT EDITOR] Successfully applied text replacement:', replacement.originalText, '→', replacement.suggestedText);
          
          // Call the callback if provided
          if (onApplyTextReplacement) {
            onApplyTextReplacement(replacement);
          }
          
          // Trigger new grammar analysis after replacement
          setTimeout(() => {
            triggerGrammarAnalysis(updatedPlainText);
          }, 500);
          
          return true;
        } else {
          console.warn('[TEXT EDITOR] Failed to find and replace text using all methods:', {
            originalText: replacement.originalText,
            suggestedText: replacement.suggestedText
          });
          return false;
        }
      } else {
        console.warn('[TEXT EDITOR] Original text not found in plain text:', {
          originalText: replacement.originalText,
          currentPlainText: currentPlainText.slice(0, 200)
        });
        return false;
      }
    } catch (error) {
      console.error('[TEXT EDITOR] Failed to apply text replacement:', error, {
        originalText: replacement.originalText,
        suggestedText: replacement.suggestedText
      });
      return false;
    }
  }, [editor, setEditorContent, autoSave, isInitializing, onApplyTextReplacement, triggerGrammarAnalysis]);

  // Expose the applyTextReplacement method via ref
  React.useImperativeHandle(ref, () => ({
    applyTextReplacement
  }), [applyTextReplacement]);

  // Handle accepting a suggestion from popup
  const handleAcceptSuggestion = React.useCallback((issue: any) => {
    console.log('[TEXT EDITOR] Accepting suggestion:', issue);
    
    const replacement = acceptSuggestion(issue.id);
    console.log('[TEXT EDITOR] Got replacement:', replacement);
    
    if (replacement && editor) {
      // IMMEDIATELY clear all issues to prevent stale underlines
      console.log('[TEXT EDITOR] Clearing all issues to prevent stale positions');
      clearAnalysis();
      
      // Apply the replacement to the editor
      const success = applyTextReplacement(replacement);
      console.log('[TEXT EDITOR] Text replacement success:', success);
      
      if (success) {
        // Close the popup after successful replacement
        setPopupState({ issue: null, position: null, isVisible: false });
        
        // Immediately trigger fresh analysis to restore remaining issues
        setTimeout(() => {
          const updatedText = editor.getText();
          console.log('[TEXT EDITOR] Triggering immediate re-analysis after accept, text:', updatedText.substring(0, 50) + '...');
          analyzeText(updatedText, activeDocumentId, currentStyle.id);
        }, 500); // Give text replacement time to complete
      }
    } else {
      console.warn('[TEXT EDITOR] Cannot apply replacement - no replacement or editor not ready');
      // Still close the popup even if replacement failed
      setPopupState({ issue: null, position: null, isVisible: false });
    }
  }, [acceptSuggestion, editor, applyTextReplacement, clearAnalysis, analyzeText, activeDocumentId]);

  // Handle rejecting a suggestion from popup
  const handleRejectSuggestion = React.useCallback((issue: any) => {
    console.log('[TEXT EDITOR] Rejecting suggestion:', issue);
    rejectSuggestion(issue.id);
    setPopupState({ issue: null, position: null, isVisible: false });
  }, [rejectSuggestion]);

  if (!editor) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-8 bg-muted rounded mb-4"></div>
        <div className="h-4 bg-muted rounded mb-2"></div>
        <div className="h-4 bg-muted rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
    );
  }

  // Toolbar button component for consistency
  const ToolbarButton = ({ 
    onClick, 
    isActive, 
    children, 
    title, 
    disabled = false 
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
    disabled?: boolean;
  }) => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center p-2 text-sm rounded-md transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          isActive && "bg-accent text-accent-foreground",
          "min-w-[36px] h-9"
        )}
        title={title}
        aria-label={title}
      >
        {children}
      </button>
    );
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Comprehensive Formatting Toolbar */}
      <div className="border border-border rounded-t-lg bg-background p-2">
        <div className="flex flex-wrap items-center gap-1">
                     {/* Undo/Redo Group */}
           <div className="flex items-center border-r border-border pr-2 mr-2">
             <ToolbarButton
               onClick={() => {
                 if (editor.can().undo()) {
                   editor.chain().focus().undo().run();
                 }
               }}
               disabled={!editor.can().undo()}
               title="Undo (Cmd+Z)"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
               </svg>
             </ToolbarButton>
             
             <ToolbarButton
               onClick={() => {
                 if (editor.can().redo()) {
                   editor.chain().focus().redo().run();
                 }
               }}
               disabled={!editor.can().redo()}
               title="Redo (Cmd+Shift+Z)"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
               </svg>
             </ToolbarButton>
           </div>

          {/* Text Formatting Group */}
          <div className="flex items-center border-r border-border pr-2 mr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Bold (Cmd+B)"
            >
              <strong className="font-bold">B</strong>
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Italic (Cmd+I)"
            >
              <em className="italic">I</em>
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="Underline (Cmd+U)"
            >
              <span className="underline font-medium">U</span>
            </ToolbarButton>
          </div>

                     {/* Heading Group */}
           <div className="flex items-center border-r border-border pr-2 mr-2">
             <ToolbarButton
               onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
               isActive={editor.isActive('heading', { level: 1 })}
               title="Heading 1"
             >
               <span className="font-bold text-base">H1</span>
             </ToolbarButton>
             
             <ToolbarButton
               onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
               isActive={editor.isActive('heading', { level: 2 })}
               title="Heading 2"
             >
               <span className="font-bold text-sm">H2</span>
             </ToolbarButton>
             
             <ToolbarButton
               onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
               isActive={editor.isActive('heading', { level: 3 })}
               title="Heading 3"
             >
               <span className="font-bold text-xs">H3</span>
             </ToolbarButton>
           </div>

                     {/* List Group */}
           <div className="flex items-center border-r border-border pr-2 mr-2">
             <ToolbarButton
               onClick={() => editor.chain().focus().toggleBulletList().run()}
               isActive={editor.isActive('bulletList')}
               title="Bullet List"
             >
               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                 <circle cx="2" cy="7" r="1"/>
                 <circle cx="2" cy="12" r="1"/>
                 <circle cx="2" cy="17" r="1"/>
               </svg>
             </ToolbarButton>
             
             <ToolbarButton
               onClick={() => editor.chain().focus().toggleOrderedList().run()}
               isActive={editor.isActive('orderedList')}
               title="Numbered List"
             >
               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M3 6V4h2v1h1v1H3zm1-2.5A.5.5 0 003.5 3h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zM7 5h14v2H7V5zm-4 4v2h2v1H3v1h2v1H3v1h3V9H3zm1-1h1a.5.5 0 01.5.5v3a.5.5 0 01-.5.5H4a.5.5 0 01-.5-.5V9.5A.5.5 0 014 9zm3 2h14v2H7v-2zm-4 6h3v4H3v-1h2v-1H3v-1h2v-1H3z"/>
               </svg>
             </ToolbarButton>
           </div>

                     {/* Block Formatting Group */}
           <div className="flex items-center border-r border-border pr-2 mr-2">
             <ToolbarButton
               onClick={() => editor.chain().focus().toggleBlockquote().run()}
               isActive={editor.isActive('blockquote')}
               title="Quote"
             >
               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
               </svg>
             </ToolbarButton>
           </div>

           {/* Clear Formatting */}
           <ToolbarButton
             onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
             title="Clear Formatting"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </ToolbarButton>
        </div>
      </div>

      {/* Editor Container */}
      <div className="relative">
        <EditorContent
          editor={editor}
          className={cn(
            "min-h-[400px] w-full border-x border-b border-border bg-background rounded-b-lg",
            "focus-within:ring-2 focus-within:ring-ring focus-within:border-ring",
            "transition-colors duration-200"
          )}
        />
        
        {/* Character Count Display */}
        {editor.extensionManager.extensions.find(ext => ext.name === 'characterCount') && (
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
            {editor.storage.characterCount.characters()}/{editorSettings.performance.maxDocumentSize}
          </div>
        )}
      </div>

      {/* Editor Status Bar */}
      <div className="flex items-center justify-between mt-2 px-2 py-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          {/* Word Count from Editor Store */}
          <span>
            {wordCount} words
          </span>
          
          {/* Character Count from Editor Store */}
          <span>
            {characterCount} characters
          </span>
          
          {/* Reading Time */}
          <span>
            {Math.ceil(wordCount / 200)} min read
          </span>
          
          {/* Document Status */}
          {activeDocument && (
            <span className="text-muted-foreground/60" title={`Active Document: ${activeDocument.title}`}>
              📄 {activeDocument.title}
            </span>
          )}
          
          {/* Store Connection Indicator */}
          <span className="text-xs text-green-500" title="Connected to Zustand store">
            🔗 Store
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Save Status with Error Handling */}
          {autoSave.hasError ? (
            <div className="flex items-center gap-1 text-red-500" title={autoSave.error || 'Save error'}>
              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span>Error</span>
            </div>
          ) : autoSave.isLoading ? (
            <div className="flex items-center gap-1 text-blue-600">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>Saving...</span>
            </div>
          ) : autoSave.hasUnsavedChanges ? (
            <div className="flex items-center gap-1 text-orange-500">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <span>Unsaved</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-600">
              <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
              <span>Saved</span>
            </div>
          )}
          
          {/* Focus Indicator */}
          {editor.isFocused && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>Editing</span>
            </div>
          )}
          
          {/* Auto-save Status */}
          <div className="flex items-center gap-1 text-green-600">
            <span title="Auto-save enabled (2s delay with retry)">💾</span>
            {autoSave.lastSaved && (
              <span className="text-xs text-muted-foreground">
                {autoSave.lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          
          {/* Grammar Analysis Indicator */}
          <div className="flex items-center gap-1">
            {isAnalyzing ? (
              <>
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-blue-600">Analyzing</span>
                </>
              ) : (
                <span title="Grammar analysis enabled" className="text-green-600">
                  🔍 Grammar
                </span>
              )}
          </div>
          
          {/* Spell Check Indicator */}
          {editorSettings.behavior.spellCheck && (
            <span title="Spell check enabled">
              📝
            </span>
          )}
        </div>
      </div>

      {/* Grammar Suggestion Popup */}
      <GrammarSuggestionPopup
        issue={popupState.issue}
        position={popupState.position}
        onAccept={handleAcceptSuggestion}
        onReject={handleRejectSuggestion}
        onClose={handleClosePopup}
        isVisible={popupState.isVisible}
      />
    </div>
  );
});

TextEditor.displayName = 'TextEditor'; 