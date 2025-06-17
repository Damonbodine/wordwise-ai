import { supabase } from '@/lib/supabase';
import { 
  Document as SupabaseDocument, 
  DocumentInsert, 
  DocumentUpdate 
} from '@/types/supabase';
import { Document } from '@/types';

// =============================================================================
// SUPABASE DOCUMENT SERVICE
// =============================================================================

/**
 * Service layer for document CRUD operations with Supabase
 * Handles all database interactions for documents with proper error handling
 */
export class SupabaseDocumentService {
  
  /**
   * Create a new document in the database
   */
  async createDocument(
    title: string,
    content: string = '<p></p>',
    plainText: string = '',
    userId: string
  ): Promise<Document> {
    try {
      console.log('[SUPABASE DOC] Creating document:', { title, userId });

      const documentData: DocumentInsert = {
        user_id: userId,
        title,
        content,
        plain_text: plainText,
        status: 'draft',
        tags: [],
        is_favorite: false,
        is_archived: false,
        // word_count, character_count, reading_time will be calculated by DB trigger
        analysis_data: {},
        settings: {},
        sharing: {},
        version: 1
      };

      const { data, error } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (error) {
        console.error('[SUPABASE DOC] Create error:', error);
        throw new Error(`Failed to create document: ${error.message}`);
      }

      console.log('[SUPABASE DOC] Document created successfully:', data.id);
      return this.transformSupabaseDocument(data);

    } catch (error) {
      console.error('[SUPABASE DOC] Create document failed:', error);
      throw error;
    }
  }

  /**
   * Update an existing document
   */
  async updateDocument(
    id: string,
    updates: Partial<Document>,
    userId: string
  ): Promise<Document> {
    try {
      console.log('[SUPABASE DOC] Updating document:', { id, userId });

      // Transform our Document type to Supabase DocumentUpdate type
      const supabaseUpdates: DocumentUpdate = {
        ...(updates.title && { title: updates.title }),
        ...(updates.content && { content: updates.content }),
        ...(updates.plainText && { plain_text: updates.plainText }),
        ...(updates.status && { 
          status: updates.status === 'shared' ? 'published' : updates.status as ('draft' | 'published' | 'archived')
        }),
        ...(updates.tags && { tags: updates.tags }),
        ...(updates.isFavorite !== undefined && { is_favorite: updates.isFavorite }),
        ...(updates.isArchived !== undefined && { is_archived: updates.isArchived }),
        
        // Transform nested objects to JSONB for database storage
        ...(updates.analysis && { 
          analysis_data: JSON.parse(JSON.stringify({
            correctness: updates.analysis.grammarScore,
            clarity: updates.analysis.clarityScore,
            engagement: updates.analysis.engagementScore,
            grammarIssues: updates.analysis.grammarIssues,
            styleSuggestions: updates.analysis.styleSuggestions,
            clarityIssues: updates.analysis.clarityIssues,
            tone: updates.analysis.tone,
            lastAnalyzedAt: updates.analysis.lastAnalyzedAt,
          }))
        }),
        ...(updates.settings && { settings: JSON.parse(JSON.stringify(updates.settings)) }),
        ...(updates.sharing && { sharing: JSON.parse(JSON.stringify(updates.sharing)) }),
        
        // Note: stats fields like word_count, character_count, reading_time 
        // will be recalculated by DB trigger when plain_text changes
      };

      const { data, error } = await supabase
        .from('documents')
        .update(supabaseUpdates)
        .eq('id', id)
        .eq('user_id', userId) // Ensure user can only update their own documents
        .select()
        .single();

      if (error) {
        console.error('[SUPABASE DOC] Update error:', error);
        throw new Error(`Failed to update document: ${error.message}`);
      }

      if (!data) {
        throw new Error('Document not found or access denied');
      }

      console.log('[SUPABASE DOC] Document updated successfully:', id);
      return this.transformSupabaseDocument(data);

    } catch (error) {
      console.error('[SUPABASE DOC] Update document failed:', error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string, userId: string): Promise<void> {
    try {
      console.log('[SUPABASE DOC] Deleting document:', { id, userId });

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', userId); // Ensure user can only delete their own documents

      if (error) {
        console.error('[SUPABASE DOC] Delete error:', error);
        throw new Error(`Failed to delete document: ${error.message}`);
      }

      console.log('[SUPABASE DOC] Document deleted successfully:', id);

    } catch (error) {
      console.error('[SUPABASE DOC] Delete document failed:', error);
      throw error;
    }
  }

  /**
   * Get all documents for a user
   */
  async getUserDocuments(userId: string): Promise<Document[]> {
    try {
      console.log('[SUPABASE DOC] Fetching user documents:', userId);

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[SUPABASE DOC] Fetch documents error:', error);
        throw new Error(`Failed to fetch documents: ${error.message}`);
      }

      console.log('[SUPABASE DOC] Fetched documents:', data?.length || 0);
      return data?.map(doc => this.transformSupabaseDocument(doc)) || [];

    } catch (error) {
      console.error('[SUPABASE DOC] Fetch documents failed:', error);
      throw error;
    }
  }

  /**
   * Get a single document by ID
   */
  async getDocument(id: string, userId: string): Promise<Document | null> {
    try {
      console.log('[SUPABASE DOC] Fetching single document:', { id, userId });

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - document not found
          return null;
        }
        console.error('[SUPABASE DOC] Fetch document error:', error);
        throw new Error(`Failed to fetch document: ${error.message}`);
      }

      return this.transformSupabaseDocument(data);

    } catch (error) {
      console.error('[SUPABASE DOC] Fetch document failed:', error);
      throw error;
    }
  }

  /**
   * Share a document with other users (for future implementation)
   */
  async shareDocument(
    documentId: string, 
    emails: string[], 
    permission: 'read' | 'comment' | 'edit' = 'read',
    userId: string
  ): Promise<void> {
    try {
      console.log('[SUPABASE DOC] Sharing document:', { documentId, emails, permission });

      // First, verify the user owns the document
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('id')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (docError || !document) {
        throw new Error('Document not found or access denied');
      }

      // For now, just log the sharing request
      // Full implementation would involve:
      // 1. Finding users by email
      // 2. Creating document_collaborators records
      // 3. Sending invitation emails
      console.log('[SUPABASE DOC] Document sharing requested but not implemented yet');
      
    } catch (error) {
      console.error('[SUPABASE DOC] Share document failed:', error);
      throw error;
    }
  }

  /**
   * Transform Supabase document to our internal Document type
   */
  private transformSupabaseDocument(supabaseDoc: SupabaseDocument): Document {
    const analysisData = (supabaseDoc.analysis_data as any) || {};
    const settingsData = (supabaseDoc.settings as any) || {};
    const sharingData = (supabaseDoc.sharing as any) || {};

    return {
      id: supabaseDoc.id,
      title: supabaseDoc.title,
      content: supabaseDoc.content,
      plainText: supabaseDoc.plain_text,
      status: supabaseDoc.status as any,
      tags: supabaseDoc.tags || [],
      isFavorite: supabaseDoc.is_favorite,
      isArchived: supabaseDoc.is_archived,
      version: supabaseDoc.version,
      createdAt: new Date(supabaseDoc.created_at),
      updatedAt: new Date(supabaseDoc.updated_at),
      userId: supabaseDoc.user_id,
      
      // Transform stats from flat DB fields to nested DocumentStats object
      stats: {
        wordCount: supabaseDoc.word_count,
        characterCount: supabaseDoc.character_count,
        characterCountNoSpaces: supabaseDoc.character_count, // Approximate for now
        paragraphCount: Math.max(1, (supabaseDoc.content.match(/<p>/g) || []).length),
        sentenceCount: Math.max(1, (supabaseDoc.plain_text.match(/[.!?]+/g) || []).length),
        avgWordsPerSentence: supabaseDoc.word_count > 0 ? 
          Math.round(supabaseDoc.word_count / Math.max(1, (supabaseDoc.plain_text.match(/[.!?]+/g) || []).length)) : 0,
        readingTime: supabaseDoc.reading_time,
        readabilityScore: analysisData.readabilityScore || 85,
      },
      
      // Transform analysis from JSONB to DocumentAnalysis object
      analysis: {
        grammarScore: analysisData.correctness || 90,
        styleScore: analysisData.engagement || 85,
        clarityScore: analysisData.clarity || 90,
        engagementScore: analysisData.engagement || 85,
        grammarIssues: analysisData.grammarIssues || [],
        styleSuggestions: analysisData.styleSuggestions || [],
        clarityIssues: analysisData.clarityIssues || [],
        tone: analysisData.tone || {
          primaryTone: 'neutral',
          confidence: 0.8,
          tones: [],
          sentiment: 0,
          formality: 0.5,
        },
        lastAnalyzedAt: analysisData.lastAnalyzedAt ? new Date(analysisData.lastAnalyzedAt) : new Date(),
        isAnalyzing: false,
      },
      
      // Transform settings from JSONB to DocumentSettings object
      settings: {
        autoSave: settingsData.autoSave ?? true,
        autoSaveInterval: settingsData.autoSaveInterval ?? 30,
        grammarChecking: settingsData.grammarChecking ?? true,
        styleSuggestions: settingsData.styleSuggestions ?? true,
        claritySuggestions: settingsData.claritySuggestions ?? true,
        realTimeAnalysis: settingsData.realTimeAnalysis ?? true,
        language: settingsData.language ?? 'en',
        writingStyle: settingsData.writingStyle ?? 'general',
        targetAudience: settingsData.targetAudience ?? 'general',
      },
      
      // Transform sharing from JSONB to SharingSettings object
      sharing: {
        isPublic: sharingData.isPublic ?? false,
        shareLink: sharingData.shareLink,
        accessLevel: sharingData.accessLevel ?? 'view',
        collaborators: sharingData.collaborators || [],
        commentsEnabled: sharingData.commentsEnabled ?? false,
        suggestionsEnabled: sharingData.suggestionsEnabled ?? false,
      },
    };
  }

  /**
   * Health check - verify database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('[SUPABASE DOC] Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const supabaseDocumentService = new SupabaseDocumentService();

// Export for easier importing
export default supabaseDocumentService;