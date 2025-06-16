import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  User,
  UserPreferences,
  UserUsage,
  NotificationSettings,
  PrivacySettings,
  DocumentSettings,
  SubscriptionPlan,
  ThemeMode 
} from '@/types';

// =============================================================================
// USER STORE INTERFACE
// =============================================================================

interface UserStore {
  // Authentication state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  
  // Session state
  sessionId: string | null;
  lastActivity: Date | null;
  isOnline: boolean;
  
  // Actions - Authentication
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  
  // Actions - Profile Management
  updateProfile: (updates: Partial<Pick<User, 'name' | 'email' | 'avatar' | 'timezone' | 'language'>>) => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  
  // Actions - Preferences
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  updateNotificationSettings: (notifications: Partial<NotificationSettings>) => void;
  updatePrivacySettings: (privacy: Partial<PrivacySettings>) => void;
  updateDefaultDocumentSettings: (settings: Partial<DocumentSettings>) => void;
  
  // Actions - Theme
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  
  // Actions - Subscription
  updateSubscription: (plan: SubscriptionPlan) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  renewSubscription: () => Promise<void>;
  
  // Actions - Usage Statistics
  updateUsageStats: (usage: Partial<UserUsage>) => void;
  incrementDocumentCount: () => void;
  incrementWordCount: (wordCount: number) => void;
  recordIssueFixed: () => void;
  recordSuggestionAccepted: () => void;
  
  // Actions - Session Management
  updateLastActivity: () => void;
  setOnlineStatus: (isOnline: boolean) => void;
  extendSession: () => Promise<void>;
  
  // Utility functions
  hasFeatureAccess: (feature: string) => boolean;
  getRemainingUsage: () => UsageLimits;
  isSubscriptionActive: () => boolean;
  getDaysUntilRenewal: () => number;
  
  // Actions - Error Handling
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

interface UsageLimits {
  documentsRemaining: number;
  wordsRemaining: number;
  analysisRemaining: number;
  isUnlimited: boolean;
}

// =============================================================================
// HELPER FUNCTIONS & CONSTANTS
// =============================================================================

const PLAN_LIMITS = {
  free: {
    documents: 5,
    wordsPerMonth: 10000,
    analysisRequests: 100,
  },
  premium: {
    documents: 100,
    wordsPerMonth: 500000,
    analysisRequests: 10000,
  },
  business: {
    documents: 1000,
    wordsPerMonth: 2000000,
    analysisRequests: 50000,
  },
  enterprise: {
    documents: -1, // Unlimited
    wordsPerMonth: -1,
    analysisRequests: -1,
  },
};

const createDefaultPreferences = (): UserPreferences => ({
  theme: 'system' as ThemeMode,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 16,
  lineHeight: 1.6,
  defaultDocumentSettings: {
    autoSave: true,
    autoSaveInterval: 30,
    grammarChecking: true,
    styleSuggestions: true,
    claritySuggestions: true,
    realTimeAnalysis: true,
    language: 'en-US',
    writingStyle: 'general',
    targetAudience: 'general',
  },
  notifications: {
    email: true,
    push: false,
    grammarIssues: true,
    collaboration: true,
    systemUpdates: false,
    marketing: false,
  },
  privacy: {
    analytics: true,
    improvementSuggestions: true,
    profileVisibility: 'private',
    defaultDocumentVisibility: 'private',
  },
  keyboardShortcuts: true,
  autoTheme: true,
});

const createDefaultUsage = (): UserUsage => ({
  documentsCreated: 0,
  totalWords: 0,
  documentsThisMonth: 0,
  wordsThisMonth: 0,
  issuesFixed: 0,
  suggestionsAccepted: 0,
  lastUsed: new Date(),
});

const createMockUser = (): User => ({
  id: 'user-1',
  email: 'demo@wordwise.ai',
  name: 'Demo User',
  avatar: undefined,
  subscription: 'premium',
  preferences: createDefaultPreferences(),
  usage: createDefaultUsage(),
  createdAt: new Date('2024-01-01'),
  lastLoginAt: new Date(),
  isVerified: true,
  isActive: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  language: 'en-US',
});

// =============================================================================
// ZUSTAND STORE
// =============================================================================

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: createMockUser(), // Start with mock user for demo
        isAuthenticated: true, // Demo mode
        isLoading: false,
        authError: null,
        
        sessionId: 'demo-session-' + Date.now(),
        lastActivity: new Date(),
        isOnline: true,

        // Authentication Actions
        login: async (email: string, password: string) => {
          set({ isLoading: true, authError: null });
          
          try {
            // Mock authentication - in real app, this would be an API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const mockUser = createMockUser();
            mockUser.email = email;
            mockUser.lastLoginAt = new Date();
            
            set({
              user: mockUser,
              isAuthenticated: true,
              isLoading: false,
              sessionId: 'session-' + Date.now(),
              lastActivity: new Date(),
            });
          } catch (error) {
            set({
              authError: 'Invalid credentials',
              isLoading: false,
            });
          }
        },

        logout: async () => {
          set({ isLoading: true });
          
          try {
            // Mock logout - in real app, this would invalidate the session
            await new Promise(resolve => setTimeout(resolve, 500));
            
            set({
              user: null,
              isAuthenticated: false,
              sessionId: null,
              isLoading: false,
              authError: null,
            });
          } catch (error) {
            set({ isLoading: false });
          }
        },

        register: async (email: string, password: string, name: string) => {
          set({ isLoading: true, authError: null });
          
          try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const newUser = createMockUser();
            newUser.email = email;
            newUser.name = name;
            newUser.subscription = 'free';
            newUser.isVerified = false;
            newUser.createdAt = new Date();
            
            set({
              user: newUser,
              isAuthenticated: true,
              isLoading: false,
              sessionId: 'session-' + Date.now(),
            });
          } catch (error) {
            set({
              authError: 'Registration failed',
              isLoading: false,
            });
          }
        },

        refreshToken: async () => {
          // Mock token refresh
          set({ lastActivity: new Date() });
        },

        updatePassword: async (currentPassword: string, newPassword: string) => {
          set({ isLoading: true, authError: null });
          await new Promise(resolve => setTimeout(resolve, 1000));
          set({ isLoading: false });
        },

        resetPassword: async (email: string) => {
          set({ isLoading: true, authError: null });
          await new Promise(resolve => setTimeout(resolve, 1000));
          set({ isLoading: false });
        },

        verifyEmail: async (token: string) => {
          set({ isLoading: true });
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set((state) => ({
            user: state.user ? { ...state.user, isVerified: true } : null,
            isLoading: false,
          }));
        },

        // Profile Management Actions
        updateProfile: async (updates) => {
          set({ isLoading: true });
          
          try {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            set((state) => ({
              user: state.user ? { ...state.user, ...updates } : null,
              isLoading: false,
            }));
          } catch (error) {
            set({ isLoading: false });
          }
        },

        updateAvatar: async (avatarUrl: string) => {
          await get().updateProfile({ avatar: avatarUrl });
        },

        deleteAccount: async () => {
          set({ isLoading: true });
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          set({
            user: null,
            isAuthenticated: false,
            sessionId: null,
            isLoading: false,
          });
        },

        // Preferences Actions
        updatePreferences: (preferences) => {
          set((state) => ({
            user: state.user ? {
              ...state.user,
              preferences: { ...state.user.preferences, ...preferences }
            } : null,
          }));
        },

        updateNotificationSettings: (notifications) => {
          set((state) => ({
            user: state.user ? {
              ...state.user,
              preferences: {
                ...state.user.preferences,
                notifications: { ...state.user.preferences.notifications, ...notifications }
              }
            } : null,
          }));
        },

        updatePrivacySettings: (privacy) => {
          set((state) => ({
            user: state.user ? {
              ...state.user,
              preferences: {
                ...state.user.preferences,
                privacy: { ...state.user.preferences.privacy, ...privacy }
              }
            } : null,
          }));
        },

        updateDefaultDocumentSettings: (settings) => {
          set((state) => ({
            user: state.user ? {
              ...state.user,
              preferences: {
                ...state.user.preferences,
                defaultDocumentSettings: { ...state.user.preferences.defaultDocumentSettings, ...settings }
              }
            } : null,
          }));
        },

        // Theme Actions
        setTheme: (theme) => {
          get().updatePreferences({ theme });
        },

        toggleTheme: () => {
          const { user } = get();
          if (!user) return;
          
          const currentTheme = user.preferences.theme;
          const newTheme: ThemeMode = currentTheme === 'light' ? 'dark' : 
                                      currentTheme === 'dark' ? 'system' : 'light';
          get().setTheme(newTheme);
        },

        // Subscription Actions
        updateSubscription: async (plan: SubscriptionPlan) => {
          set({ isLoading: true });
          
          try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            set((state) => ({
              user: state.user ? { ...state.user, subscription: plan } : null,
              isLoading: false,
            }));
          } catch (error) {
            set({ isLoading: false });
          }
        },

        cancelSubscription: async () => {
          await get().updateSubscription('free');
        },

        renewSubscription: async () => {
          set({ isLoading: true });
          await new Promise(resolve => setTimeout(resolve, 1000));
          set({ isLoading: false });
        },

        // Usage Statistics Actions
        updateUsageStats: (usage) => {
          set((state) => ({
            user: state.user ? {
              ...state.user,
              usage: { ...state.user.usage, ...usage, lastUsed: new Date() }
            } : null,
          }));
        },

        incrementDocumentCount: () => {
          const { user } = get();
          if (!user) return;
          
          get().updateUsageStats({
            documentsCreated: user.usage.documentsCreated + 1,
            documentsThisMonth: user.usage.documentsThisMonth + 1,
          });
        },

        incrementWordCount: (wordCount) => {
          const { user } = get();
          if (!user) return;
          
          get().updateUsageStats({
            totalWords: user.usage.totalWords + wordCount,
            wordsThisMonth: user.usage.wordsThisMonth + wordCount,
          });
        },

        recordIssueFixed: () => {
          const { user } = get();
          if (!user) return;
          
          get().updateUsageStats({
            issuesFixed: user.usage.issuesFixed + 1,
          });
        },

        recordSuggestionAccepted: () => {
          const { user } = get();
          if (!user) return;
          
          get().updateUsageStats({
            suggestionsAccepted: user.usage.suggestionsAccepted + 1,
          });
        },

        // Session Management Actions
        updateLastActivity: () => {
          set({ lastActivity: new Date() });
        },

        setOnlineStatus: (isOnline) => {
          set({ isOnline });
        },

        extendSession: async () => {
          get().updateLastActivity();
          await get().refreshToken();
        },

        // Utility Functions
        hasFeatureAccess: (feature: string) => {
          const { user } = get();
          if (!user) return false;
          
          const plan = user.subscription;
          
          // Define feature access by plan
          const featureAccess = {
            free: ['basic-grammar', 'basic-spellcheck'],
            premium: ['basic-grammar', 'basic-spellcheck', 'style-suggestions', 'tone-analysis', 'collaboration'],
            business: ['basic-grammar', 'basic-spellcheck', 'style-suggestions', 'tone-analysis', 'collaboration', 'team-features', 'analytics'],
            enterprise: ['basic-grammar', 'basic-spellcheck', 'style-suggestions', 'tone-analysis', 'collaboration', 'team-features', 'analytics', 'custom-integration'],
          };
          
          return featureAccess[plan]?.includes(feature) || false;
        },

        getRemainingUsage: (): UsageLimits => {
          const { user } = get();
          if (!user) {
            return {
              documentsRemaining: 0,
              wordsRemaining: 0,
              analysisRemaining: 0,
              isUnlimited: false,
            };
          }
          
          const limits = PLAN_LIMITS[user.subscription];
          const usage = user.usage;
          
          return {
            documentsRemaining: limits.documents === -1 ? -1 : Math.max(0, limits.documents - usage.documentsCreated),
            wordsRemaining: limits.wordsPerMonth === -1 ? -1 : Math.max(0, limits.wordsPerMonth - usage.wordsThisMonth),
            analysisRemaining: limits.analysisRequests === -1 ? -1 : Math.max(0, limits.analysisRequests),
            isUnlimited: limits.documents === -1,
          };
        },

        isSubscriptionActive: () => {
          const { user } = get();
          return Boolean(user?.isActive && user?.subscription !== 'free');
        },

        getDaysUntilRenewal: () => {
          // Mock calculation - in real app, this would be based on subscription end date
          return 28;
        },

        // Error Handling Actions
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ authError: error }),
        clearError: () => set({ authError: null }),
      }),
      {
        name: 'user-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          sessionId: state.sessionId,
        }),
      }
    ),
    {
      name: 'user-store',
    }
  )
); 