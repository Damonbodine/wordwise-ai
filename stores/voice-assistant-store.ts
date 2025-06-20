import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// =============================================================================
// VOICE ASSISTANT STORE INTERFACE
// =============================================================================

export interface VoiceMessage {
  id: string;
  speaker: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isInterim?: boolean;
  confidence?: number;
}

export interface VoiceContext {
  hasDocument: boolean;
  documentId?: string;
  title?: string;
  wordCount?: number;
  content?: string;
  summary?: string;
  documentType?: 'essay' | 'email' | 'report' | 'creative' | 'notes' | 'other';
  context: string;
  lastUpdated?: Date;
}

export interface VoiceSettings {
  elevenLabsVoiceId: string;
  speechRate: number;
  volume: number;
  autoSuggestions: boolean;
  realTimeFeedback: boolean;
}

export interface ConversationSession {
  id: string;
  userId: string;
  documentId?: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'completed' | 'interrupted';
  messageCount: number;
  duration?: number;
}

export interface VoiceSuggestion {
  type: 'improvement' | 'structure' | 'clarity' | 'style';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface VoiceMetrics {
  totalConversations: number;
  totalDuration: number;
  averageLatency: number;
  apiCosts: {
    deepgram: number;
    elevenlabs: number;
    openai: number;
    total: number;
  };
  dailyUsage: {
    conversations: number;
    minutes: number;
    cost: number;
  };
}

interface VoiceAssistantStore {
  // Core state
  isInitialized: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  isConnected: boolean;
  error: string | null;
  
  // Conversation state
  currentSession: ConversationSession | null;
  messages: VoiceMessage[];
  documentContext: VoiceContext | null;
  conversationSummary: string | null;
  conversationSuggestions: VoiceSuggestion[] | null;
  
  // Audio state
  audioPermission: 'granted' | 'denied' | 'prompt' | 'unknown';
  microphoneLevel: number;
  isPlaying: boolean;
  
  // Settings
  settings: VoiceSettings;
  
  // Metrics and usage
  metrics: VoiceMetrics;
  
  // Connection status
  connectionStatus: {
    deepgram: 'connected' | 'connecting' | 'disconnected' | 'error';
    elevenlabs: 'connected' | 'connecting' | 'disconnected' | 'error';
    openai: 'connected' | 'connecting' | 'disconnected' | 'error';
  };

  // Actions - Initialization
  initialize: (userId: string) => Promise<void>;
  cleanup: () => void;
  
  // Actions - Session Management
  startConversation: (documentId?: string) => Promise<string>;
  endConversation: () => Promise<void>;
  pauseConversation: () => void;
  resumeConversation: () => void;
  
  // Actions - Recording
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<void>;
  toggleRecording: () => Promise<void>;
  
  // Actions - Messages
  addMessage: (message: Omit<VoiceMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<VoiceMessage>) => void;
  clearMessages: () => void;
  setConversationSummary: (summary: string) => void;
  setConversationSuggestions: (suggestions: VoiceSuggestion[] | null) => void;
  
  // Actions - Context
  updateDocumentContext: (context: VoiceContext) => void;
  refreshDocumentContext: () => void;
  
  // Actions - Settings
  updateSettings: (settings: Partial<VoiceSettings>) => void;
  loadUserSettings: (userId: string) => Promise<void>;
  saveUserSettings: (userId: string) => Promise<void>;
  
  // Actions - Audio
  setMicrophoneLevel: (level: number) => void;
  setAudioPermission: (permission: 'granted' | 'denied' | 'prompt' | 'unknown') => void;
  
  // Actions - Connection
  updateConnectionStatus: (service: keyof VoiceAssistantStore['connectionStatus'], status: string) => void;
  
  // Actions - Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Actions - State
  setRecording: (recording: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setPlaying: (playing: boolean) => void;
  setConnected: (connected: boolean) => void;
  
  // Computed properties
  isActive: boolean;
  canRecord: boolean;
  currentConversationDuration: number;
  totalMessagesInSession: number;
  isOverDailyLimit: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const createDefaultSettings = (): VoiceSettings => ({
  elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB', // Default voice from testing
  speechRate: 1.0,
  volume: 1.0,
  autoSuggestions: true,
  realTimeFeedback: true,
});

const createDefaultMetrics = (): VoiceMetrics => ({
  totalConversations: 0,
  totalDuration: 0,
  averageLatency: 0,
  apiCosts: {
    deepgram: 0,
    elevenlabs: 0,
    openai: 0,
    total: 0,
  },
  dailyUsage: {
    conversations: 0,
    minutes: 0,
    cost: 0,
  },
});

const DAILY_COST_LIMIT = parseFloat(process.env.VOICE_COST_LIMIT_DAILY || '10');
const MAX_CONVERSATION_LENGTH = parseInt(process.env.VOICE_MAX_CONVERSATION_LENGTH || '600000'); // 10 minutes

// =============================================================================
// ZUSTAND STORE
// =============================================================================

export const useVoiceAssistantStore = create<VoiceAssistantStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      isInitialized: false,
      isRecording: false,
      isProcessing: false,
      isConnected: false,
      error: null,
      
      currentSession: null,
      messages: [],
      documentContext: null,
      conversationSummary: null,
      conversationSuggestions: null,
      
      audioPermission: 'unknown',
      microphoneLevel: 0,
      isPlaying: false,
      
      settings: createDefaultSettings(),
      metrics: createDefaultMetrics(),
      
      connectionStatus: {
        deepgram: 'disconnected',
        elevenlabs: 'disconnected',
        openai: 'disconnected',
      },

      // Computed properties
      get isActive() {
        const { currentSession } = get();
        return currentSession?.status === 'active';
      },
      
      get canRecord() {
        const { audioPermission, isConnected, error } = get();
        return audioPermission === 'granted' && isConnected && !error;
      },
      
      get currentConversationDuration() {
        const { currentSession } = get();
        if (!currentSession || currentSession.status !== 'active') return 0;
        return Date.now() - currentSession.startedAt.getTime();
      },
      
      get totalMessagesInSession() {
        const { messages } = get();
        return messages.length;
      },
      
      get isOverDailyLimit() {
        const { metrics } = get();
        return metrics.dailyUsage.cost >= DAILY_COST_LIMIT;
      },

      // Initialization
      initialize: async (userId: string) => {
        try {
          console.log('[VOICE STORE] Initializing voice assistant for user:', userId);
          
          // Load user settings
          await get().loadUserSettings(userId);
          
          // Check audio permissions
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              stream.getTracks().forEach(track => track.stop()); // Stop the test stream
              set({ audioPermission: 'granted' });
            } catch (error) {
              console.warn('[VOICE STORE] Audio permission denied:', error);
              set({ audioPermission: 'denied' });
            }
          } else {
            console.warn('[VOICE STORE] getUserMedia not supported');
            set({ audioPermission: 'denied' });
          }
          
          set({ 
            isInitialized: true,
            error: null 
          });
          
          console.log('[VOICE STORE] Voice assistant initialized successfully');
        } catch (error) {
          console.error('[VOICE STORE] Failed to initialize:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to initialize voice assistant',
            isInitialized: false 
          });
        }
      },

      cleanup: () => {
        const { currentSession } = get();
        
        if (currentSession?.status === 'active') {
          get().endConversation();
        }
        
        set({
          isInitialized: false,
          isRecording: false,
          isProcessing: false,
          isConnected: false,
          currentSession: null,
          messages: [],
          documentContext: null,
          error: null,
        });
        
        console.log('[VOICE STORE] Voice assistant cleaned up');
      },

      // Session Management
      startConversation: async (documentId?: string) => {
        try {
          const state = get();
          
          if (state.isOverDailyLimit) {
            throw new Error('Daily usage limit reached');
          }
          
          if (state.currentSession?.status === 'active') {
            await get().endConversation();
          }

          // Extract document context if documentId provided
          if (documentId) {
            get().refreshDocumentContext();
          }

          const session: ConversationSession = {
            id: generateId(),
            userId: 'current-user', // TODO: Get from auth store
            documentId,
            startedAt: new Date(),
            status: 'active',
            messageCount: 0,
          };

          set({
            currentSession: session,
            messages: [],
            error: null,
          });

          console.log('[VOICE STORE] Conversation started:', session.id);
          return session.id;
        } catch (error) {
          console.error('[VOICE STORE] Failed to start conversation:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to start conversation' });
          throw error;
        }
      },

      endConversation: async () => {
        try {
          const { currentSession, messages } = get();
          
          if (!currentSession) return;

          const endedSession: ConversationSession = {
            ...currentSession,
            endedAt: new Date(),
            status: 'completed',
            messageCount: messages.length,
            duration: Date.now() - currentSession.startedAt.getTime(),
          };

          // Update metrics
          const { metrics } = get();
          const updatedMetrics: VoiceMetrics = {
            ...metrics,
            totalConversations: metrics.totalConversations + 1,
            totalDuration: metrics.totalDuration + (endedSession.duration || 0),
            dailyUsage: {
              ...metrics.dailyUsage,
              conversations: metrics.dailyUsage.conversations + 1,
              minutes: metrics.dailyUsage.minutes + ((endedSession.duration || 0) / 60000),
            },
          };

          set({
            currentSession: endedSession,
            isRecording: false,
            isProcessing: false,
            metrics: updatedMetrics,
          });

          console.log('[VOICE STORE] Conversation ended:', endedSession.id, 'Duration:', endedSession.duration);
        } catch (error) {
          console.error('[VOICE STORE] Failed to end conversation:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to end conversation' });
        }
      },

      pauseConversation: () => {
        set({ isRecording: false, isProcessing: false });
        console.log('[VOICE STORE] Conversation paused');
      },

      resumeConversation: () => {
        const { canRecord } = get();
        if (canRecord) {
          console.log('[VOICE STORE] Conversation resumed');
        } else {
          set({ error: 'Cannot resume: microphone not available' });
        }
      },

      // Recording Actions
      startRecording: async () => {
        try {
          const { canRecord, isRecording } = get();
          
          if (isRecording) return true;
          
          if (!canRecord) {
            throw new Error('Cannot start recording: microphone not available');
          }

          set({ 
            isRecording: true, 
            error: null 
          });
          
          console.log('[VOICE STORE] Recording started');
          return true;
        } catch (error) {
          console.error('[VOICE STORE] Failed to start recording:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to start recording',
            isRecording: false 
          });
          return false;
        }
      },

      stopRecording: async () => {
        try {
          set({ isRecording: false });
          console.log('[VOICE STORE] Recording stopped');
        } catch (error) {
          console.error('[VOICE STORE] Failed to stop recording:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to stop recording' });
        }
      },

      toggleRecording: async () => {
        const { isRecording } = get();
        if (isRecording) {
          await get().stopRecording();
        } else {
          await get().startRecording();
        }
      },

      // Message Management
      addMessage: (message) => {
        const newMessage: VoiceMessage = {
          ...message,
          id: generateId(),
          timestamp: new Date(),
        };

        set((state) => ({
          messages: [...state.messages, newMessage],
        }));

        // Update session message count
        const { currentSession } = get();
        if (currentSession) {
          set({
            currentSession: {
              ...currentSession,
              messageCount: currentSession.messageCount + 1,
            },
          });
        }

        console.log('[VOICE STORE] Message added:', message.speaker, message.content.substring(0, 50));
      },

      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map(msg =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        }));
      },

      clearMessages: () => {
        set({ messages: [] });
        console.log('[VOICE STORE] Messages cleared');
      },

      setConversationSummary: (summary) => {
        set({ conversationSummary: summary });
        console.log('[VOICE STORE] Conversation summary set:', summary.substring(0, 100) + '...');
      },

      setConversationSuggestions: (suggestions) => {
        set({ conversationSuggestions: suggestions });
        console.log('[VOICE STORE] Conversation suggestions set:', suggestions?.length || 0, 'suggestions');
      },

      // Context Management
      updateDocumentContext: (context) => {
        set({ documentContext: context });
        console.log('[VOICE STORE] Document context updated:', context.title);
      },

      refreshDocumentContext: () => {
        // TODO: Integrate with document store to get active document
        console.log('[VOICE STORE] Refreshing document context');
        // This will be implemented when we integrate with document store
      },

      // Settings Management
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
        console.log('[VOICE STORE] Settings updated:', newSettings);
      },

      loadUserSettings: async (userId) => {
        try {
          // TODO: Load from Supabase
          console.log('[VOICE STORE] Loading user settings for:', userId);
          // For now, use defaults
        } catch (error) {
          console.error('[VOICE STORE] Failed to load user settings:', error);
          // Continue with defaults
        }
      },

      saveUserSettings: async (userId) => {
        try {
          // TODO: Save to Supabase
          console.log('[VOICE STORE] Saving user settings for:', userId);
        } catch (error) {
          console.error('[VOICE STORE] Failed to save user settings:', error);
        }
      },

      // Audio State
      setMicrophoneLevel: (level) => {
        set({ microphoneLevel: level });
      },

      setAudioPermission: (permission) => {
        set({ audioPermission: permission });
        console.log('[VOICE STORE] Audio permission set to:', permission);
      },

      // Connection Management
      updateConnectionStatus: (service, status) => {
        set((state) => ({
          connectionStatus: {
            ...state.connectionStatus,
            [service]: status as any,
          },
        }));

        // Update overall connection status
        const { connectionStatus } = get();
        const allConnected = Object.values(connectionStatus).every(s => s === 'connected');
        const anyError = Object.values(connectionStatus).some(s => s === 'error');
        
        set({ 
          isConnected: allConnected,
          error: anyError ? 'Connection error with voice services' : null,
        });

        console.log('[VOICE STORE] Connection status updated:', service, status);
      },

      // Error Management
      setError: (error) => {
        set({ error });
        if (error) {
          console.error('[VOICE STORE] Error set:', error);
        }
      },

      clearError: () => {
        set({ error: null });
        console.log('[VOICE STORE] Error cleared');
      },

      // State Setters
      setRecording: (recording) => set({ isRecording: recording }),
      setProcessing: (processing) => set({ isProcessing: processing }),
      setPlaying: (playing) => set({ isPlaying: playing }),
      setConnected: (connected) => set({ isConnected: connected }),
    }),
    {
      name: 'voice-assistant-store',
    }
  )
);