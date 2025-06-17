-- Fix RLS Policy Infinite Recursion Issue
-- This migration removes conflicting policies and creates optimized ones

-- ============================================================================
-- DROP PROBLEMATIC POLICIES
-- ============================================================================

-- Drop the conflicting shared documents policy that causes recursion
DROP POLICY IF EXISTS "Users can view shared documents" ON documents;

-- Drop problematic collaborator policies that reference documents
DROP POLICY IF EXISTS "Document owners can manage collaborators" ON document_collaborators;
DROP POLICY IF EXISTS "Admins can manage collaborators" ON document_collaborators;

-- ============================================================================
-- CREATE OPTIMIZED NON-RECURSIVE POLICIES
-- ============================================================================

-- Simple, efficient document policies (no recursion)
-- Users can only access their own documents for now
-- (Sharing functionality can be added later with proper optimization)

-- Keep the basic document policies (these are fine)
-- "Users can view their own documents" - already exists
-- "Users can insert their own documents" - already exists  
-- "Users can update their own documents" - already exists
-- "Users can delete their own documents" - already exists

-- Simplified collaborator policies (no cross-table references)
CREATE POLICY "Users can view their collaborations" ON document_collaborators
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage documents they own collaborations" ON document_collaborators
    FOR ALL USING (auth.uid() = invited_by);

-- ============================================================================
-- OPTIMIZE EXISTING POLICIES  
-- ============================================================================

-- Ensure all policies are using the most efficient approach
-- (The basic document policies from 001_initial_schema.sql are already optimal)

-- Add index to improve RLS performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id_auth ON documents(user_id) WHERE user_id IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test query that should work after this fix:
-- SELECT * FROM documents WHERE user_id = auth.uid();