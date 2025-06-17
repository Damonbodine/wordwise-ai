export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Database schema with RLS-compliant tables
export interface Database {
  public: {
    Tables: {
      // User profiles table (extends Supabase auth.users)
      user_profiles: {
        Row: {
          id: string // UUID matching auth.users.id
          email: string
          full_name: string | null
          avatar_url: string | null
          username: string | null
          subscription_tier: 'free' | 'pro' | 'enterprise'
          subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing'
          subscription_expires_at: string | null
          preferences: Json | null
          usage_stats: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          subscription_expires_at?: string | null
          preferences?: Json | null
          usage_stats?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          subscription_expires_at?: string | null
          preferences?: Json | null
          usage_stats?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      
      // Documents table with RLS
      documents: {
        Row: {
          id: string
          user_id: string // Foreign key to auth.users.id
          title: string
          content: string
          plain_text: string
          status: 'draft' | 'published' | 'archived'
          tags: string[] | null
          is_favorite: boolean
          is_archived: boolean
          word_count: number
          character_count: number
          reading_time: number
          analysis_data: Json | null
          settings: Json | null
          sharing: Json | null
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content?: string
          plain_text?: string
          status?: 'draft' | 'published' | 'archived'
          tags?: string[] | null
          is_favorite?: boolean
          is_archived?: boolean
          word_count?: number
          character_count?: number
          reading_time?: number
          analysis_data?: Json | null
          settings?: Json | null
          sharing?: Json | null
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          plain_text?: string
          status?: 'draft' | 'published' | 'archived'
          tags?: string[] | null
          is_favorite?: boolean
          is_archived?: boolean
          word_count?: number
          character_count?: number
          reading_time?: number
          analysis_data?: Json | null
          settings?: Json | null
          sharing?: Json | null
          version?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // Document collaboration table
      document_collaborators: {
        Row: {
          id: string
          document_id: string
          user_id: string
          permission: 'read' | 'comment' | 'edit' | 'admin'
          invited_by: string
          invited_at: string
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          permission?: 'read' | 'comment' | 'edit' | 'admin'
          invited_by: string
          invited_at?: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          permission?: 'read' | 'comment' | 'edit' | 'admin'
          invited_by?: string
          invited_at?: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_collaborators_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // Usage tracking for subscription limits
      user_usage: {
        Row: {
          id: string
          user_id: string
          month: string // YYYY-MM format
          documents_created: number
          words_analyzed: number
          api_calls: number
          storage_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          documents_created?: number
          words_analyzed?: number
          api_calls?: number
          storage_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          documents_created?: number
          words_analyzed?: number
          api_calls?: number
          storage_used?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_tier: 'free' | 'pro' | 'enterprise'
      subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing'
      document_status: 'draft' | 'published' | 'archived'
      collaboration_permission: 'read' | 'comment' | 'edit' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export type Document = Database['public']['Tables']['documents']['Row']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type DocumentUpdate = Database['public']['Tables']['documents']['Update']

export type DocumentCollaborator = Database['public']['Tables']['document_collaborators']['Row']
export type UserUsage = Database['public']['Tables']['user_usage']['Row']

// Auth-related types
export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: AuthUser
}

export interface AuthUser {
  id: string
  aud: string
  role?: string
  email?: string
  email_confirmed_at?: string
  phone?: string
  confirmed_at?: string
  last_sign_in_at?: string
  app_metadata: {
    provider?: string
    providers?: string[]
    [key: string]: any
  }
  user_metadata: {
    [key: string]: any
  }
  identities?: any[]
  created_at: string
  updated_at?: string
} 