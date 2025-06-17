-- ============================================================================
-- WordWise AI Database Schema with Row Level Security (RLS)
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Subscription tiers
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');

-- Subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');

-- Document status
CREATE TYPE document_status AS ENUM ('draft', 'published', 'archived');

-- Collaboration permissions
CREATE TYPE collaboration_permission AS ENUM ('read', 'comment', 'edit', 'admin');

-- ============================================================================
-- USER PROFILES TABLE
-- ============================================================================

-- User profiles table (extends auth.users)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    username TEXT UNIQUE,
    subscription_tier subscription_tier DEFAULT 'free' NOT NULL,
    subscription_status subscription_status DEFAULT 'active' NOT NULL,
    subscription_expires_at TIMESTAMPTZ,
    preferences JSONB DEFAULT '{}' NOT NULL,
    usage_stats JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- DOCUMENTS TABLE
-- ============================================================================

-- Documents table with RLS
CREATE TABLE documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '<p></p>' NOT NULL,
    plain_text TEXT DEFAULT '' NOT NULL,
    status document_status DEFAULT 'draft' NOT NULL,
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    word_count INTEGER DEFAULT 0 NOT NULL,
    character_count INTEGER DEFAULT 0 NOT NULL,
    reading_time INTEGER DEFAULT 0 NOT NULL,
    analysis_data JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    sharing JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for better performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);

-- Enable RLS on documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies for documents (shared document policies added later)
CREATE POLICY "Users can view their own documents" ON documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON documents
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- DOCUMENT COLLABORATORS TABLE
-- ============================================================================

-- Document collaboration table
CREATE TABLE document_collaborators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    permission collaboration_permission DEFAULT 'read' NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    invited_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(document_id, user_id)
);

-- Indexes for better performance
CREATE INDEX idx_document_collaborators_document_id ON document_collaborators(document_id);
CREATE INDEX idx_document_collaborators_user_id ON document_collaborators(user_id);

-- Enable RLS on document_collaborators
ALTER TABLE document_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_collaborators
CREATE POLICY "Document owners can manage collaborators" ON document_collaborators
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_collaborators.document_id
            AND d.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own collaborations" ON document_collaborators
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage collaborators" ON document_collaborators
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM document_collaborators dc
            WHERE dc.document_id = document_collaborators.document_id
            AND dc.user_id = auth.uid()
            AND dc.permission = 'admin'
            AND dc.accepted_at IS NOT NULL
        )
    );

-- ============================================================================
-- ADDITIONAL DOCUMENT POLICIES (after document_collaborators exists)
-- ============================================================================

-- Policy for shared documents (via document_collaborators)
CREATE POLICY "Users can view shared documents" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM document_collaborators dc
            WHERE dc.document_id = documents.id
            AND dc.user_id = auth.uid()
            AND dc.accepted_at IS NOT NULL
        )
    );

CREATE POLICY "Users can update shared documents with edit permission" ON documents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM document_collaborators dc
            WHERE dc.document_id = documents.id
            AND dc.user_id = auth.uid()
            AND dc.permission IN ('edit', 'admin')
            AND dc.accepted_at IS NOT NULL
        )
    );

-- ============================================================================
-- USER USAGE TABLE
-- ============================================================================

-- Usage tracking for subscription limits
CREATE TABLE user_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL, -- YYYY-MM format
    documents_created INTEGER DEFAULT 0 NOT NULL,
    words_analyzed INTEGER DEFAULT 0 NOT NULL,
    api_calls INTEGER DEFAULT 0 NOT NULL,
    storage_used BIGINT DEFAULT 0 NOT NULL, -- in bytes
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, month)
);

-- Indexes for better performance
CREATE INDEX idx_user_usage_user_id_month ON user_usage(user_id, month);

-- Enable RLS on user_usage
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_usage
CREATE POLICY "Users can view their own usage" ON user_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON user_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON user_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trigger_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trigger_document_collaborators_updated_at
    BEFORE UPDATE ON document_collaborators
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trigger_user_usage_updated_at
    BEFORE UPDATE ON user_usage
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Function to automatically update document statistics
CREATE OR REPLACE FUNCTION public.update_document_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate word count (simple word counting)
    NEW.word_count = COALESCE(
        array_length(
            string_to_array(
                regexp_replace(NEW.plain_text, '[^\w\s]', '', 'g'),
                ' '
            ),
            1
        ),
        0
    );
    
    -- Calculate character count
    NEW.character_count = LENGTH(NEW.plain_text);
    
    -- Calculate reading time (assuming 200 words per minute)
    NEW.reading_time = GREATEST(1, CEIL(NEW.word_count / 200.0));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update document statistics
CREATE TRIGGER trigger_update_document_stats
    BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_document_stats();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert initial usage tracking for existing users (if any)
-- This would be handled by the application, but included for completeness

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

/*
Important security considerations implemented:

1. Row Level Security (RLS) is enabled on all tables
2. Users can only access their own data or data explicitly shared with them
3. Document collaboration requires explicit invitation and acceptance
4. Usage tracking is isolated per user
5. Automatic profile creation on user signup
6. Proper foreign key constraints with CASCADE deletes
7. Indexes for performance on frequently queried columns
8. Triggers for maintaining data consistency (timestamps, statistics)

To use this schema:
1. Run this migration in your Supabase project
2. Set up Google OAuth in Supabase Auth settings
3. Configure your app with the Supabase URL and anon key
4. The RLS policies will automatically protect user data

Testing RLS policies:
- Create test users and documents
- Verify users can only see their own data
- Test document sharing functionality
- Confirm usage tracking works correctly
*/ 