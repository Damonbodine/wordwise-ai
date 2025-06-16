import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  Document, 
  DocumentStats, 
  DocumentAnalysis, 
  DocumentSettings,
  SharingSettings,
  DocumentStatus,
  WritingStyle,
  TargetAudience,
  ToneAnalysis 
} from '@/types';

// =============================================================================
// DOCUMENT STORE INTERFACE
// =============================================================================

interface DocumentStore {
  // State
  documents: Document[];
  activeDocumentId: string | null;
  isLoading: boolean;
  error: string | null;

  // Computed getters
  activeDocument: Document | null;
  documentCount: number;
  totalWordCount: number;

  // Actions
  createDocument: (title?: string, content?: string) => Document;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  setActiveDocument: (id: string | null) => void;
  duplicateDocument: (id: string) => Document | null;
  
  // Content management
  updateDocumentContent: (id: string, content: string, plainText: string) => void;
  updateDocumentTitle: (id: string, title: string) => void;
  updateDocumentSettings: (id: string, settings: Partial<DocumentSettings>) => void;
  
  // Organization
  toggleFavorite: (id: string) => void;
  archiveDocument: (id: string) => void;
  unarchiveDocument: (id: string) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
  
  // Analysis
  updateDocumentAnalysis: (id: string, analysis: Partial<DocumentAnalysis>) => void;
  updateDocumentStats: (id: string, stats: Partial<DocumentStats>) => void;
  
  // Bulk operations
  deleteMultipleDocuments: (ids: string[]) => void;
  archiveMultipleDocuments: (ids: string[]) => void;
  
  // Utility
  getDocumentById: (id: string) => Document | undefined;
  getDocumentsByStatus: (status: DocumentStatus) => Document[];
  getRecentDocuments: (limit?: number) => Document[];
  searchDocuments: (query: string) => Document[];
  
  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const createDefaultStats = (): DocumentStats => ({
  wordCount: 0,
  characterCount: 0,
  characterCountNoSpaces: 0,
  paragraphCount: 0,
  sentenceCount: 0,
  avgWordsPerSentence: 0,
  readingTime: 0,
  readabilityScore: 0,
});

const createDefaultAnalysis = (): DocumentAnalysis => ({
  grammarScore: 100,
  styleScore: 100,
  clarityScore: 100,
  engagementScore: 100,
  grammarIssues: [],
  styleSuggestions: [],
  clarityIssues: [],
  tone: {
    primaryTone: 'neutral',
    confidence: 0.8,
    tones: [],
    sentiment: 0,
    formality: 0.5,
  },
  lastAnalyzedAt: new Date(),
  isAnalyzing: false,
});

const createDefaultSettings = (): DocumentSettings => ({
  autoSave: true,
  autoSaveInterval: 30,
  grammarChecking: true,
  styleSuggestions: true,
  claritySuggestions: true,
  realTimeAnalysis: true,
  language: 'en-US',
  writingStyle: 'general' as WritingStyle,
  targetAudience: 'general' as TargetAudience,
});

const createDefaultSharing = (): SharingSettings => ({
  isPublic: false,
  accessLevel: 'view',
  collaborators: [],
  commentsEnabled: false,
  suggestionsEnabled: false,
});

const calculateStats = (content: string, plainText: string): DocumentStats => {
  const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
  const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = plainText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  const wordCount = words.length;
  const characterCount = plainText.length;
  const characterCountNoSpaces = plainText.replace(/\s/g, '').length;
  const paragraphCount = Math.max(paragraphs.length, 1);
  const sentenceCount = Math.max(sentences.length, 1);
  const avgWordsPerSentence = wordCount / sentenceCount;
  const readingTime = Math.ceil(wordCount / 200); // 200 WPM average
  
  // Simple readability score based on sentence length and word complexity
  const avgSentenceLength = wordCount / sentenceCount;
  const readabilityScore = Math.max(0, Math.min(100, 100 - (avgSentenceLength - 15) * 2));
  
  return {
    wordCount,
    characterCount,
    characterCountNoSpaces,
    paragraphCount,
    sentenceCount,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    readingTime,
    readabilityScore: Math.round(readabilityScore),
  };
};

// =============================================================================
// MOCK DATA FOR DEVELOPMENT
// =============================================================================

const createMockDocument = (
  id: string, 
  title: string, 
  content: string, 
  daysAgo: number = 1, 
  hoursAgo: number = 2, 
  isFavorite: boolean = false
): Document => {
  const plainText = content.replace(/<[^>]*>/g, '');
  const now = new Date();
  
  return {
    id,
    title,
    content,
    plainText,
    createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000),
    userId: 'user-1',
    stats: calculateStats(content, plainText),
    analysis: createDefaultAnalysis(),
    settings: createDefaultSettings(),
    sharing: createDefaultSharing(),
    status: 'draft' as DocumentStatus,
    tags: [],
    version: 1,
    isArchived: false,
    isFavorite,
  };
};

const initialDocuments: Document[] = [
  createMockDocument('doc-1', 'Project Proposal', '<h1>Project Proposal</h1><p>This is a comprehensive project proposal that outlines the key objectives, deliverables, and timeline for our upcoming initiative. The project aims to enhance user experience and drive business growth.</p><p>Key features include advanced analytics, real-time collaboration, and seamless integration with existing systems.</p>', 3, 1, true),
  createMockDocument('doc-2', 'Meeting Notes', '<h2>Weekly Team Meeting</h2><p>Discussed progress on current projects and identified potential roadblocks. Action items were assigned to team members with specific deadlines.</p><ul><li>Review mockups by Friday</li><li>Complete user testing next week</li><li>Prepare presentation for stakeholders</li></ul>', 1, 2, false),
  createMockDocument('doc-3', 'Research Paper', '<h1>The Impact of AI on Modern Writing</h1><p>Artificial Intelligence has revolutionized the way we approach writing and content creation. This paper explores the various applications of AI in writing assistance, from grammar checking to style suggestions.</p><p>The research methodology involved analyzing user behavior patterns and measuring improvement in writing quality over time.</p>', 5, 8, false),
  createMockDocument('doc-4', 'User Guide', '<h1>Getting Started Guide</h1><p>Welcome to WordWise AI! This guide will help you get up and running quickly with our intelligent writing assistant.</p><h2>Basic Features</h2><p>Learn about real-time grammar checking, style suggestions, and document organization features that will enhance your writing experience.</p>', 2, 4, true),
];

// =============================================================================
// ZUSTAND STORE
// =============================================================================

export const useDocumentStore = create<DocumentStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      documents: initialDocuments,
      activeDocumentId: initialDocuments[0]?.id || null,
      isLoading: false,
      error: null,

      // Computed getters
      get activeDocument() {
        const { documents, activeDocumentId } = get();
        return activeDocumentId ? documents.find(doc => doc.id === activeDocumentId) || null : null;
      },

      get documentCount() {
        return get().documents.filter(doc => !doc.isArchived).length;
      },

      get totalWordCount() {
        return get().documents
          .filter(doc => !doc.isArchived)
          .reduce((total, doc) => total + doc.stats.wordCount, 0);
      },

      // CRUD Actions
      createDocument: (title = 'Untitled Document', content = '') => {
        const id = generateId();
        const plainText = content.replace(/<[^>]*>/g, '');
        const now = new Date();
        
        const newDocument: Document = {
          id,
          title,
          content,
          plainText,
          createdAt: now,
          updatedAt: now,
          userId: 'user-1', // TODO: Get from auth context
          stats: calculateStats(content, plainText),
          analysis: createDefaultAnalysis(),
          settings: createDefaultSettings(),
          sharing: createDefaultSharing(),
          status: 'draft',
          tags: [],
          version: 1,
          isArchived: false,
          isFavorite: false,
        };

        set((state) => {
          console.log('🏪 Document Store: Creating document', {
            newDocId: id,
            newDocTitle: title,
            previousActiveId: state.activeDocumentId,
            totalDocs: state.documents.length + 1
          });
          
          return {
            documents: [newDocument, ...state.documents],
            activeDocumentId: id,
          };
        });

        console.log('✅ Document created successfully:', { id, title });
        return newDocument;
      },

      updateDocument: (id, updates) => {
        set((state) => ({
          documents: state.documents.map(doc =>
            doc.id === id
              ? { ...doc, ...updates, updatedAt: new Date(), version: doc.version + 1 }
              : doc
          ),
        }));
      },

      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter(doc => doc.id !== id),
          activeDocumentId: state.activeDocumentId === id ? null : state.activeDocumentId,
        }));
      },

      setActiveDocument: (id) => {
        const currentState = get();
        const previousDocumentId = currentState.activeDocumentId;
        const previousDocument = previousDocumentId ? currentState.documents.find(doc => doc.id === previousDocumentId) : null;
        const newDocument = id ? currentState.documents.find(doc => doc.id === id) : null;
        
        console.log('🔄 Document Store: Setting active document', {
          previousDocumentId,
          previousDocumentTitle: previousDocument?.title || 'None',
          newDocumentId: id,
          newDocumentTitle: newDocument?.title || 'None',
          documentsAvailable: currentState.documents.length,
          timestamp: new Date().toISOString()
        });
        
        if (id && !newDocument) {
          console.warn('⚠️ Document Store: Attempting to set active document to non-existent ID', {
            requestedId: id,
            availableIds: currentState.documents.map(doc => ({ id: doc.id, title: doc.title }))
          });
        }
        
        set({ activeDocumentId: id });
        
        console.log('✅ Document Store: Active document updated', {
          success: true,
          activeDocumentId: id,
          activeDocumentExists: !!newDocument
        });
      },

      duplicateDocument: (id) => {
        const { documents } = get();
        const original = documents.find(doc => doc.id === id);
        if (!original) return null;

        const newId = generateId();
        const now = new Date();
        const duplicated: Document = {
          ...original,
          id: newId,
          title: `${original.title} (Copy)`,
          createdAt: now,
          updatedAt: now,
          version: 1,
          isFavorite: false,
        };

        set((state) => ({
          documents: [duplicated, ...state.documents],
          activeDocumentId: newId,
        }));

        return duplicated;
      },

      // Content management
      updateDocumentContent: (id, content, plainText) => {
        const stats = calculateStats(content, plainText);
        set((state) => ({
          documents: state.documents.map(doc =>
            doc.id === id
              ? { 
                  ...doc, 
                  content, 
                  plainText, 
                  stats, 
                  updatedAt: new Date(),
                  version: doc.version + 1 
                }
              : doc
          ),
        }));
      },

      updateDocumentTitle: (id, title) => {
        get().updateDocument(id, { title });
      },

      updateDocumentSettings: (id, settings) => {
        set((state) => ({
          documents: state.documents.map(doc =>
            doc.id === id
              ? { ...doc, settings: { ...doc.settings, ...settings }, updatedAt: new Date() }
              : doc
          ),
        }));
      },

      // Organization
      toggleFavorite: (id) => {
        set((state) => ({
          documents: state.documents.map(doc =>
            doc.id === id
              ? { ...doc, isFavorite: !doc.isFavorite, updatedAt: new Date() }
              : doc
          ),
        }));
      },

      archiveDocument: (id) => {
        get().updateDocument(id, { isArchived: true });
      },

      unarchiveDocument: (id) => {
        get().updateDocument(id, { isArchived: false });
      },

      addTag: (id, tag) => {
        set((state) => ({
          documents: state.documents.map(doc =>
            doc.id === id
              ? { 
                  ...doc, 
                  tags: doc.tags.includes(tag) ? doc.tags : [...doc.tags, tag],
                  updatedAt: new Date() 
                }
              : doc
          ),
        }));
      },

      removeTag: (id, tag) => {
        set((state) => ({
          documents: state.documents.map(doc =>
            doc.id === id
              ? { 
                  ...doc, 
                  tags: doc.tags.filter(t => t !== tag),
                  updatedAt: new Date() 
                }
              : doc
          ),
        }));
      },

      // Analysis
      updateDocumentAnalysis: (id, analysis) => {
        set((state) => ({
          documents: state.documents.map(doc =>
            doc.id === id
              ? { 
                  ...doc, 
                  analysis: { ...doc.analysis, ...analysis },
                  updatedAt: new Date() 
                }
              : doc
          ),
        }));
      },

      updateDocumentStats: (id, stats) => {
        set((state) => ({
          documents: state.documents.map(doc =>
            doc.id === id
              ? { 
                  ...doc, 
                  stats: { ...doc.stats, ...stats },
                  updatedAt: new Date() 
                }
              : doc
          ),
        }));
      },

      // Bulk operations
      deleteMultipleDocuments: (ids) => {
        set((state) => ({
          documents: state.documents.filter(doc => !ids.includes(doc.id)),
          activeDocumentId: ids.includes(state.activeDocumentId || '') ? null : state.activeDocumentId,
        }));
      },

      archiveMultipleDocuments: (ids) => {
        set((state) => ({
          documents: state.documents.map(doc =>
            ids.includes(doc.id)
              ? { ...doc, isArchived: true, updatedAt: new Date() }
              : doc
          ),
        }));
      },

      // Utility functions
      getDocumentById: (id) => {
        return get().documents.find(doc => doc.id === id);
      },

      getDocumentsByStatus: (status) => {
        return get().documents.filter(doc => doc.status === status && !doc.isArchived);
      },

      getRecentDocuments: (limit = 10) => {
        return get().documents
          .filter(doc => !doc.isArchived)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, limit);
      },

      searchDocuments: (query) => {
        const lowercaseQuery = query.toLowerCase();
        return get().documents.filter(doc =>
          !doc.isArchived && (
            doc.title.toLowerCase().includes(lowercaseQuery) ||
            doc.plainText.toLowerCase().includes(lowercaseQuery) ||
            doc.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
          )
        );
      },

      // State management
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'document-store',
    }
  )
); 