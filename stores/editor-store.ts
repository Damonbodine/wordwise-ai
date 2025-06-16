import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  EditorSettings,
  EditorAppearance,
  EditorBehavior,
  AnalysisSettings,
  CollaborationSettings,
  AccessibilitySettings,
  PerformanceSettings,
  ThemeMode 
} from '@/types';

// =============================================================================
// EDITOR STORE INTERFACE
// =============================================================================

interface EditorStore {
  // Current content state
  currentEditorContent: string;
  currentPlainText: string;
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  paragraphCount: number;
  sentenceCount: number;
  readingTime: number;
  
  // Editor state
  editorSettings: EditorSettings;
  isEditorFocused: boolean;
  isAutoSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  
  // Selection and cursor state
  cursorPosition: number;
  selectionStart: number;
  selectionEnd: number;
  selectedText: string;
  
  // Editor modes and features
  isFullscreen: boolean;
  isDistractFreeMode: boolean;
  showWordCount: boolean;
  showReadingTime: boolean;
  
  // Actions - Content Management
  setEditorContent: (content: string, plainText?: string) => void;
  updateContent: (content: string, plainText?: string) => void;
  clearContent: () => void;
  insertText: (text: string, position?: number) => void;
  replaceText: (start: number, end: number, replacement: string) => void;
  
  // Actions - Settings Management
  updateEditorSettings: (settings: Partial<EditorSettings>) => void;
  updateAppearanceSettings: (appearance: Partial<EditorAppearance>) => void;
  updateBehaviorSettings: (behavior: Partial<EditorBehavior>) => void;
  updateAnalysisSettings: (analysis: Partial<AnalysisSettings>) => void;
  updateCollaborationSettings: (collaboration: Partial<CollaborationSettings>) => void;
  updateAccessibilitySettings: (accessibility: Partial<AccessibilitySettings>) => void;
  updatePerformanceSettings: (performance: Partial<PerformanceSettings>) => void;
  
  // Actions - Editor State
  setEditorFocus: (focused: boolean) => void;
  setAutoSaving: (saving: boolean) => void;
  markSaved: () => void;
  markUnsaved: () => void;
  
  // Actions - Selection and Cursor
  setCursorPosition: (position: number) => void;
  setSelection: (start: number, end: number) => void;
  getSelectedText: () => string;
  
  // Actions - Editor Modes
  toggleFullscreen: () => void;
  toggleDistractFreeMode: () => void;
  toggleWordCount: () => void;
  toggleReadingTime: () => void;
  
  // Actions - Theme
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  
  // Utility functions
  getContentStats: () => ContentStats;
  resetToDefaults: () => void;
}

interface ContentStats {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  paragraphCount: number;
  sentenceCount: number;
  readingTime: number;
  avgWordsPerSentence: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const calculateContentStats = (content: string, plainText: string): ContentStats => {
  const text = plainText || content.replace(/<[^>]*>/g, '');
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  const wordCount = words.length;
  const characterCount = text.length;
  const characterCountNoSpaces = text.replace(/\s/g, '').length;
  const paragraphCount = Math.max(paragraphs.length, 1);
  const sentenceCount = Math.max(sentences.length, 1);
  const readingTime = Math.ceil(wordCount / 200); // 200 WPM average
  const avgWordsPerSentence = wordCount / sentenceCount;
  
  return {
    wordCount,
    characterCount,
    characterCountNoSpaces,
    paragraphCount,
    sentenceCount,
    readingTime,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
  };
};

const createDefaultEditorSettings = (): EditorSettings => ({
  theme: 'system' as ThemeMode,
  appearance: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 16,
    lineHeight: 1.6,
    maxLineWidth: 800,
    showLineNumbers: false,
    showWordCount: true,
    showReadingTime: true,
    highlightCurrentLine: true,
    showInvisibles: false,
  },
  behavior: {
    autoSave: true,
    autoSaveInterval: 30000, // 30 seconds
    spellCheck: true,
    autoCorrect: false,
    tabSize: 4,
    insertSpaces: true,
    wordWrap: true,
    autoFocus: true,
  },
  analysis: {
    realTime: true,
    debounceDelay: 1000,
    grammarCheck: true,
    styleCheck: true,
    clarityCheck: true,
    toneAnalysis: true,
    plagiarismCheck: false,
    minTextLength: 10,
  },
  collaboration: {
    realTimeCollab: false,
    showCursors: true,
    showSelections: true,
    autoSaveCollab: true,
    conflictResolution: 'prompt',
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: true,
    focusIndicators: true,
  },
  performance: {
    throttleAnalysis: true,
    maxDocumentSize: 1000000, // 1MB
    lazyLoading: true,
    virtualization: false,
  },
});

// =============================================================================
// ZUSTAND STORE
// =============================================================================

export const useEditorStore = create<EditorStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentEditorContent: '',
      currentPlainText: '',
      wordCount: 0,
      characterCount: 0,
      characterCountNoSpaces: 0,
      paragraphCount: 0,
      sentenceCount: 0,
      readingTime: 0,
      
      editorSettings: createDefaultEditorSettings(),
      isEditorFocused: false,
      isAutoSaving: false,
      lastSaved: null,
      hasUnsavedChanges: false,
      
      cursorPosition: 0,
      selectionStart: 0,
      selectionEnd: 0,
      selectedText: '',
      
      isFullscreen: false,
      isDistractFreeMode: false,
      showWordCount: true,
      showReadingTime: true,

      // Content Management Actions
      setEditorContent: (content, plainText) => {
        const text = plainText || content.replace(/<[^>]*>/g, '');
        const stats = calculateContentStats(content, text);
        
        set({
          currentEditorContent: content,
          currentPlainText: text,
          ...stats,
          hasUnsavedChanges: true,
        });
      },

      updateContent: (content, plainText) => {
        get().setEditorContent(content, plainText);
      },

      clearContent: () => {
        set({
          currentEditorContent: '',
          currentPlainText: '',
          wordCount: 0,
          characterCount: 0,
          characterCountNoSpaces: 0,
          paragraphCount: 0,
          sentenceCount: 0,
          readingTime: 0,
          hasUnsavedChanges: false,
          cursorPosition: 0,
          selectionStart: 0,
          selectionEnd: 0,
          selectedText: '',
        });
      },

      insertText: (text, position) => {
        const { currentEditorContent, cursorPosition } = get();
        const insertPos = position !== undefined ? position : cursorPosition;
        const newContent = 
          currentEditorContent.slice(0, insertPos) + 
          text + 
          currentEditorContent.slice(insertPos);

        get().setEditorContent(newContent);
        get().setCursorPosition(insertPos + text.length);
      },

      replaceText: (start, end, replacement) => {
        const { currentEditorContent } = get();
        const newContent = 
          currentEditorContent.slice(0, start) + 
          replacement + 
          currentEditorContent.slice(end);

        get().setEditorContent(newContent);
        get().setCursorPosition(start + replacement.length);
      },

      // Settings Management Actions
      updateEditorSettings: (settings) => {
        set((state) => ({
          editorSettings: { ...state.editorSettings, ...settings },
        }));
      },

      updateAppearanceSettings: (appearance) => {
        set((state) => ({
          editorSettings: {
            ...state.editorSettings,
            appearance: { ...state.editorSettings.appearance, ...appearance },
          },
        }));
      },

      updateBehaviorSettings: (behavior) => {
        set((state) => ({
          editorSettings: {
            ...state.editorSettings,
            behavior: { ...state.editorSettings.behavior, ...behavior },
          },
        }));
      },

      updateAnalysisSettings: (analysis) => {
        set((state) => ({
          editorSettings: {
            ...state.editorSettings,
            analysis: { ...state.editorSettings.analysis, ...analysis },
          },
        }));
      },

      updateCollaborationSettings: (collaboration) => {
        set((state) => ({
          editorSettings: {
            ...state.editorSettings,
            collaboration: { ...state.editorSettings.collaboration, ...collaboration },
          },
        }));
      },

      updateAccessibilitySettings: (accessibility) => {
        set((state) => ({
          editorSettings: {
            ...state.editorSettings,
            accessibility: { ...state.editorSettings.accessibility, ...accessibility },
          },
        }));
      },

      updatePerformanceSettings: (performance) => {
        set((state) => ({
          editorSettings: {
            ...state.editorSettings,
            performance: { ...state.editorSettings.performance, ...performance },
          },
        }));
      },

      // Editor State Actions
      setEditorFocus: (focused) => set({ isEditorFocused: focused }),
      setAutoSaving: (saving) => set({ isAutoSaving: saving }),
      markSaved: () => set({ hasUnsavedChanges: false, lastSaved: new Date() }),
      markUnsaved: () => set({ hasUnsavedChanges: true }),

      // Selection and Cursor Actions
      setCursorPosition: (position) => set({ cursorPosition: position }),
      
      setSelection: (start, end) => {
        const { currentEditorContent } = get();
        const selectedText = currentEditorContent.slice(start, end);
        set({ 
          selectionStart: start, 
          selectionEnd: end, 
          selectedText,
          cursorPosition: end 
        });
      },

      getSelectedText: () => get().selectedText,

      // Editor Modes Actions
      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
      toggleDistractFreeMode: () => set((state) => ({ isDistractFreeMode: !state.isDistractFreeMode })),
      toggleWordCount: () => set((state) => ({ showWordCount: !state.showWordCount })),
      toggleReadingTime: () => set((state) => ({ showReadingTime: !state.showReadingTime })),

      // Theme Actions
      setTheme: (theme) => {
        set((state) => ({
          editorSettings: {
            ...state.editorSettings,
            theme,
          },
        }));
      },

      toggleTheme: () => {
        const { editorSettings } = get();
        const currentTheme = editorSettings.theme;
        const newTheme: ThemeMode = currentTheme === 'light' ? 'dark' : 
                                    currentTheme === 'dark' ? 'system' : 'light';
        get().setTheme(newTheme);
      },

      // Utility Functions
      getContentStats: () => {
        const { currentEditorContent, currentPlainText } = get();
        return calculateContentStats(currentEditorContent, currentPlainText);
      },

      resetToDefaults: () => {
        set({
          editorSettings: createDefaultEditorSettings(),
          isFullscreen: false,
          isDistractFreeMode: false,
          showWordCount: true,
          showReadingTime: true,
        });
      },
    }),
    {
      name: 'editor-store',
    }
  )
); 