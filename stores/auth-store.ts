import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase, auth } from '@/lib/supabase';
import type { AuthUser, AuthSession, UserProfile } from '@/types/supabase';

// =============================================================================
// AUTH STORE INTERFACE
// =============================================================================

interface AuthStore {
  // Authentication state
  user: AuthUser | null;
  session: AuthSession | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Authentication actions
  signUp: (email: string, password: string, userData?: any) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;

  // Profile management
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;

  // Session management
  initializeAuth: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isSessionValid: () => boolean;

  // Subscription helpers
  hasActiveSubscription: () => boolean;
  getSubscriptionLimits: () => SubscriptionLimits;
  canCreateDocument: () => boolean;
  canAnalyzeText: () => boolean;

  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

interface SubscriptionLimits {
  documentsPerMonth: number;
  wordsPerMonth: number;
  collaboratorsPerDocument: number;
  storageLimit: number; // in bytes
  hasAdvancedAnalysis: boolean;
  hasTeamFeatures: boolean;
  hasApiAccess: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getSubscriptionLimits = (tier: string): SubscriptionLimits => {
  switch (tier) {
    case 'pro':
      return {
        documentsPerMonth: 500,
        wordsPerMonth: 100000,
        collaboratorsPerDocument: 10,
        storageLimit: 5 * 1024 * 1024 * 1024, // 5GB
        hasAdvancedAnalysis: true,
        hasTeamFeatures: true,
        hasApiAccess: true,
      };
    case 'enterprise':
      return {
        documentsPerMonth: -1, // unlimited
        wordsPerMonth: -1, // unlimited
        collaboratorsPerDocument: -1, // unlimited
        storageLimit: -1, // unlimited
        hasAdvancedAnalysis: true,
        hasTeamFeatures: true,
        hasApiAccess: true,
      };
    default: // free tier
      return {
        documentsPerMonth: 10,
        wordsPerMonth: 10000,
        collaboratorsPerDocument: 3,
        storageLimit: 100 * 1024 * 1024, // 100MB
        hasAdvancedAnalysis: false,
        hasTeamFeatures: false,
        hasApiAccess: false,
      };
  }
};

const createOrUpdateUserProfile = async (user: AuthUser): Promise<UserProfile | null> => {
  try {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error } = await supabase
        .from('user_profiles')
        .update({
          email: user.email || existingProfile.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || existingProfile.full_name,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || existingProfile.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return updatedProfile;
    } else {
      // Create new profile
      const newProfile: any = {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        username: user.user_metadata?.username || null,
        subscription_tier: 'free',
        subscription_status: 'active',
        preferences: {
          theme: 'system',
          language: 'en',
          notifications: {
            email: true,
            push: false,
            marketing: false,
          },
        },
        usage_stats: {
          documentsCreated: 0,
          wordsAnalyzed: 0,
          lastActiveAt: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: createdProfile, error } = await supabase
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) throw error;
      return createdProfile;
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    return null;
  }
};

// =============================================================================
// ZUSTAND STORE
// =============================================================================

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        session: null,
        profile: null,
        isLoading: false,
        isInitialized: false,
        error: null,

        // Initialize authentication state
        initializeAuth: async () => {
          set({ isLoading: true });
          console.log('[AUTH] Starting authentication initialization...');
          
          try {
            // Get current session directly from supabase client
            console.log('[AUTH] Getting session...');
            console.log('[AUTH] Environment:', {
              isClient: typeof window !== 'undefined',
              hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
              hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            });
            
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            console.log('[AUTH] Session call completed:', { sessionData, sessionError });
            
            if (sessionError) {
              console.error('[AUTH] Session error:', sessionError);
              throw sessionError;
            }
            
            if (sessionData.session && sessionData.session.user) {
              const user = sessionData.session.user as AuthUser;
              const session = sessionData.session as AuthSession;
              
              // Create or update user profile
              const profile = await createOrUpdateUserProfile(user);
              
              set({
                user,
                session,
                profile,
                isInitialized: true,
                isLoading: false,
                error: null,
              });

              console.log('[SUCCESS] Authentication initialized with user');
            } else {
              set({
                user: null,
                session: null,
                profile: null,
                isInitialized: true,
                isLoading: false,
                error: null,
              });
            }

            // Set up auth state change listener
            auth.onAuthStateChange(async (event, session) => {
              console.log('[AUTH] Auth state changed:', event);
              
              if (session && session.user) {
                const user = session.user as AuthUser;
                const profile = await createOrUpdateUserProfile(user);
                
                set({
                  user,
                  session: session as AuthSession,
                  profile,
                  error: null,
                });
              } else {
                set({
                  user: null,
                  session: null,
                  profile: null,
                  error: null,
                });
              }
            });

          } catch (error: any) {
            console.error('❌ Authentication initialization failed:', error);
            set({
              user: null,
              session: null,
              profile: null,
              isInitialized: true,
              isLoading: false,
              error: error.message,
            });
          }
        },

        // Sign up with email and password
        signUp: async (email, password, userData = {}) => {
          set({ isLoading: true, error: null });
          console.log('[AUTH] Starting sign up for:', email);
          
          try {
            const { data, error } = await auth.signUp(email, password, userData);
            console.log('[AUTH] Sign up response:', { data, error });
            
            if (error) {
              console.error('[AUTH] Sign up error:', error);
              throw error;
            }
            
            console.log('[AUTH] Sign up successful');
            set({ isLoading: false });
            return { success: true };
          } catch (error: any) {
            console.error('[AUTH] Sign up failed:', error);
            const errorMessage = error.message || 'Sign up failed';
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }
        },

        // Sign in with email and password
        signIn: async (email, password) => {
          set({ isLoading: true, error: null });
          
          try {
            const { data, error } = await auth.signIn(email, password);
            
            if (error) throw error;
            
            // Profile will be set via onAuthStateChange
            set({ isLoading: false });
            return { success: true };
          } catch (error: any) {
            const errorMessage = error.message || 'Sign in failed';
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }
        },

        // Sign in with Google OAuth
        signInWithGoogle: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const { data, error } = await auth.signInWithGoogle();
            
            if (error) throw error;
            
            set({ isLoading: false });
            return { success: true };
          } catch (error: any) {
            const errorMessage = error.message || 'Google sign in failed';
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }
        },

        // Sign out
        signOut: async () => {
          console.log('[AUTH STORE] signOut called');
          set({ isLoading: true, error: null });
          
          try {
            // Check if we have a session before attempting signout
            const currentSession = get().session;
            console.log('[AUTH STORE] Current session exists:', !!currentSession);
            
            console.log('[AUTH STORE] Calling auth.signOut()...');
            const { error } = await auth.signOut();
            console.log('[AUTH STORE] auth.signOut() result:', { error });
            
            // Even if signOut fails due to missing session, we should clear local state
            if (error && error.message !== 'Auth session missing!') {
              throw error;
            }
            
            console.log('[AUTH STORE] Clearing auth state...');
            // Clear state regardless of API response
            set({
              user: null,
              session: null,
              profile: null,
              isLoading: false,
              error: null,
            });
            
            // Clear persisted storage
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.removeItem('supabase.auth.token');
            
            console.log('[AUTH STORE] signOut successful (state cleared)');
            return { success: true };
          } catch (error: any) {
            console.error('[AUTH STORE] signOut error:', error);
            
            // If it's just a session missing error, still clear local state
            if (error.message === 'Auth session missing!' || error.message === 'Session not found') {
              console.log('[AUTH STORE] No active session, clearing local state anyway');
              set({
                user: null,
                session: null,
                profile: null,
                isLoading: false,
                error: null,
              });
              
              // Clear persisted storage
              localStorage.removeItem('supabase.auth.token');
              sessionStorage.removeItem('supabase.auth.token');
              
              return { success: true };
            }
            
            const errorMessage = error.message || 'Sign out failed';
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }
        },

        // Reset password
        resetPassword: async (email) => {
          set({ isLoading: true, error: null });
          
          try {
            const { error } = await auth.resetPassword(email);
            
            if (error) throw error;
            
            set({ isLoading: false });
            return { success: true };
          } catch (error: any) {
            const errorMessage = error.message || 'Password reset failed';
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }
        },

        // Update password
        updatePassword: async (newPassword) => {
          set({ isLoading: true, error: null });
          
          try {
            const { error } = await auth.updatePassword(newPassword);
            
            if (error) throw error;
            
            set({ isLoading: false });
            return { success: true };
          } catch (error: any) {
            const errorMessage = error.message || 'Password update failed';
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }
        },

        // Update user profile
        updateProfile: async (updates) => {
          const { user, profile } = get();
          if (!user || !profile) {
            return { success: false, error: 'User not authenticated' };
          }

          set({ isLoading: true, error: null });
          
          try {
            const { data: updatedProfile, error } = await supabase
              .from('user_profiles')
              .update({
                ...updates,
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id)
              .select()
              .single();

            if (error) throw error;
            
            set({ profile: updatedProfile, isLoading: false });
            return { success: true };
          } catch (error: any) {
            const errorMessage = error.message || 'Profile update failed';
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }
        },

        // Refresh user profile
        refreshProfile: async () => {
          const { user } = get();
          if (!user) return;

          try {
            const { data: profile, error } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            if (error) throw error;
            
            set({ profile });
          } catch (error) {
            console.error('Error refreshing profile:', error);
          }
        },

        // Refresh session
        refreshSession: async () => {
          try {
            const { data } = await auth.getSession();
            if (data.session) {
              set({ session: data.session as AuthSession });
            }
          } catch (error) {
            console.error('Error refreshing session:', error);
          }
        },

        // Check if session is valid (within 1 hour limit)
        isSessionValid: () => {
          const { session } = get();
          if (!session) return false;
          
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = session.expires_at || (now + session.expires_in);
          
          return now < expiresAt;
        },

        // Check if user has active subscription
        hasActiveSubscription: () => {
          const { profile } = get();
          if (!profile) return false;
          
          return profile.subscription_status === 'active' && 
                 profile.subscription_tier !== 'free';
        },

        // Get subscription limits
        getSubscriptionLimits: () => {
          const { profile } = get();
          const tier = profile?.subscription_tier || 'free';
          return getSubscriptionLimits(tier);
        },

        // Check if user can create documents
        canCreateDocument: () => {
          const { profile } = get();
          if (!profile) return false;
          
          const limits = getSubscriptionLimits(profile.subscription_tier);
          
          // Unlimited for enterprise
          if (limits.documentsPerMonth === -1) return true;
          
          // Check current usage (would need to implement usage tracking)
          return true; // For now, assume they can create
        },

        // Check if user can analyze text
        canAnalyzeText: () => {
          const { profile } = get();
          if (!profile) return false;
          
          const limits = getSubscriptionLimits(profile.subscription_tier);
          
          // Unlimited for enterprise
          if (limits.wordsPerMonth === -1) return true;
          
          // Check current usage (would need to implement usage tracking)
          return true; // For now, assume they can analyze
        },

        // State management helpers
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'auth-store',
        // Only persist minimal state
        partialize: (state) => ({
          isInitialized: state.isInitialized,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
); 