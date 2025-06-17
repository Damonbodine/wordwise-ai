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

  // Initialize grammar analysis store
  const {
    analyzeText,
    isAnalyzing,
  } = useGrammarStore();

  // Initialize auto-save hook with 2-second debounce as specified
  const autoSave = useAutoSave({
    debounceMs: 2000,
    enabled: true,
    maxRetries: 3,
    onSaveSuccess: (documentId) => {
      console.log(`✅ Auto-save successful for document: ${documentId}`);
    },
    onSaveError: (error, documentId) => {
      console.error(`❌ Auto-save failed for document ${documentId}:`, error);
    },
  });

  // Smart grammar analysis with rate limit prevention
  const grammarAnalysisTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastAnalyzedTextRef = React.useRef<string>('');
  const lastAnalysisTimeRef = React.useRef<number>(0);
  
  const triggerGrammarAnalysis = React.useCallback((text: string) => {
    if (!text.trim()) {
      return;
    }
    
    const now = Date.now();
    const timeSinceLastAnalysis = now - lastAnalysisTimeRef.current;
    const textLengthDiff = Math.abs(text.length - lastAnalyzedTextRef.current.length);
    
    // Smart triggering rules to avoid rate limits
    const shouldAnalyze = 
      // Significant content change (10+ characters)
      textLengthDiff >= 10 ||
      // Sentence completion (ends with punctuation)
      /[.!?]\s*$/.test(text.trim()) ||
      // Long pause in typing (10+ seconds)
      timeSinceLastAnalysis > 10000 ||
      // First analysis
      lastAnalyzedTextRef.current === '';
    
    if (!shouldAnalyze) {
      console.log('[GRAMMAR] Skipping analysis - minor change or recent analysis');
      return;
    }
    
    // Clear existing timeout
    if (grammarAnalysisTimeoutRef.current) {
      clearTimeout(grammarAnalysisTimeoutRef.current);
    }
    
    // Debounce for 2 seconds after smart trigger
    grammarAnalysisTimeoutRef.current = setTimeout(() => {
      // Limit text length to save tokens (max 500 chars)
      const analysisText = text.length > 500 ? text.substring(0, 500) + '...' : text;
      
      console.log('[GRAMMAR] Smart analysis trigger:', {
        textLength: text.length,
        analysisLength: analysisText.length,
        lengthDiff: textLengthDiff,
        timeSinceLastAnalysis: timeSinceLastAnalysis
      });
      
      lastAnalyzedTextRef.current = text;
      lastAnalysisTimeRef.current = Date.now();
      analyzeText(analysisText, activeDocumentId);
    }, 2000);
  }, [analyzeText, activeDocumentId]);
  
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
        
        // Trigger grammar analysis on text changes (debounced)
        console.log('🔄 Text changed, triggering grammar analysis for:', text.slice(0, 50) + '...');
        triggerGrammarAnalysis(text);
      }
    },
    onFocus: () => {
      setEditorFocus(true);
    },
    onBlur: () => {
      setEditorFocus(false);
    },
  });

  // Update editor content when active document changes
  React.useEffect(() => {
    // Get fresh state directly from store to avoid stale closures
    const storeState = useDocumentStore.getState();
    const currentActiveDocument = storeState.activeDocumentId 
      ? storeState.documents.find(doc => doc.id === storeState.activeDocumentId) 
      : null;
    
    console.log('🔄 Editor useEffect triggered:', {
      hasEditor: !!editor,
      storeActiveDocumentId: storeState.activeDocumentId,
      foundDocument: !!currentActiveDocument,
      documentTitle: currentActiveDocument?.title,
      documentContentLength: currentActiveDocument?.content?.length || 0,
    });
    
    if (!editor) {
      console.log('⏳ Editor not ready yet');
      return;
    }
    
    if (currentActiveDocument) {
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
        console.log(`✅ Successfully loaded document: "${currentActiveDocument.title}"`);
        
        // Mark as initialized after content is set
        setTimeout(() => {
          setIsInitializing(false);
          hasInitializedRef.current = true;
          
          // Trigger initial grammar analysis for loaded document
          if (currentActiveDocument.plainText) {
            triggerGrammarAnalysis(currentActiveDocument.plainText);
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
    } else if (storeState.activeDocumentId) {
      console.warn('⚠️ Active document ID set but document not found:', storeState.activeDocumentId);
      console.log('Available documents:', storeState.documents.map(d => ({ id: d.id, title: d.title })));
    } else {
      console.log('📭 No active document, clearing editor');
      editor.commands.setContent('<p></p>');
      setEditorContent('<p></p>', '');
    }
  }, [activeDocumentId, editor, documentChangeCounter]);

  // Cleanup auto-save and grammar analysis on unmount
  React.useEffect(() => {
    return () => {
      // Cancel any pending auto-save operations on unmount
      autoSave.cancelPendingSave();
      
      // Cancel any pending grammar analysis
      if (grammarAnalysisTimeoutRef.current) {
        clearTimeout(grammarAnalysisTimeoutRef.current);
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
      const currentContent = editor.getHTML();
      
      // Find and replace the original text with suggested text
      if (currentContent.includes(replacement.originalText)) {
        const updatedContent = currentContent.replace(replacement.originalText, replacement.suggestedText);
        
        // Update the editor content
        editor.commands.setContent(updatedContent);
        
        // Update the editor store
        const plainText = editor.getText();
        setEditorContent(updatedContent, plainText);
        
        // Trigger auto-save
        if (!isInitializing && hasInitializedRef.current) {
          autoSave.triggerAutoSave(updatedContent, plainText);
        }
        
        console.log('[TEXT EDITOR] Applied text replacement:', replacement.originalText, '→', replacement.suggestedText);
        
        // Call the callback if provided
        if (onApplyTextReplacement) {
          onApplyTextReplacement(replacement);
        }
        
        return true;
      } else {
        console.warn('[TEXT EDITOR] Original text not found for replacement:', replacement.originalText);
        return false;
      }
    } catch (error) {
      console.error('[TEXT EDITOR] Failed to apply text replacement:', error);
      return false;
    }
  }, [editor, setEditorContent, autoSave, isInitializing, onApplyTextReplacement]);

  // Expose the applyTextReplacement method via ref
  React.useImperativeHandle(ref, () => ({
    applyTextReplacement
  }), [applyTextReplacement]);

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
    </div>
  );
});

TextEditor.displayName = 'TextEditor'; 