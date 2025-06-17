"use client";

import { supabase } from '@/lib/supabase';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface GrammarIssue {
  id: string;
  type: 'spelling' | 'grammar' | 'style' | 'clarity' | 'engagement' | 'delivery';
  category: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  explanation: string;
  position: {
    start: number;
    end: number;
  };
  originalText: string;
  suggestedText: string;
  confidence: number;
}

export interface DocumentScores {
  correctness: number;
  clarity: number;
  engagement: number;
  delivery: number;
  overall: number;
}

export interface AnalysisMetadata {
  wordCount: number;
  sentenceCount: number;
  readingTime: number;
  analysisTime: number;
}

export interface GrammarAnalysisResult {
  issues: GrammarIssue[];
  scores: DocumentScores;
  metadata: AnalysisMetadata;
}

// =============================================================================
// GROQ-POWERED GRAMMAR SERVICE
// =============================================================================

export class GroqGrammarService {
  private analysisCache: Map<string, GrammarAnalysisResult> = new Map();
  private pendingAnalysis: Map<string, Promise<GrammarAnalysisResult>> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private DEBOUNCE_DELAY = 500; // ms
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Analyzes text using Groq API via Supabase Edge Function
   * Implements debouncing and caching for optimal performance
   */
  async analyzeText(
    text: string,
    documentId?: string,
    immediate: boolean = false
  ): Promise<GrammarAnalysisResult> {
    // Return empty result for empty text
    if (!text || text.trim().length === 0) {
      return this.getEmptyResult();
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(text);
    
    // Check cache first
    const cachedResult = this.analysisCache.get(cacheKey);
    if (cachedResult && !this.isCacheExpired(cacheKey)) {
      console.log('[GROQ] Returning cached analysis');
      return cachedResult;
    }

    // If analysis is already pending, return the existing promise
    const pendingPromise = this.pendingAnalysis.get(cacheKey);
    if (pendingPromise) {
      console.log('[GROQ] Returning pending analysis');
      return pendingPromise;
    }

    // If not immediate, debounce the request
    if (!immediate) {
      return this.debounceAnalysis(text, cacheKey, documentId);
    }

    // Perform the analysis
    return this.performAnalysis(text, cacheKey, documentId);
  }

  /**
   * Debounces analysis requests to avoid excessive API calls
   */
  private debounceAnalysis(
    text: string,
    cacheKey: string,
    documentId?: string
  ): Promise<GrammarAnalysisResult> {
    // Clear existing timer for this cache key
    const existingTimer = this.debounceTimers.get(cacheKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Create a new promise that will be resolved after the debounce delay
    const promise = new Promise<GrammarAnalysisResult>((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          const result = await this.performAnalysis(text, cacheKey, documentId);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.debounceTimers.delete(cacheKey);
        }
      }, this.DEBOUNCE_DELAY);

      this.debounceTimers.set(cacheKey, timer);
    });

    return promise;
  }

  /**
   * Performs the actual analysis by calling the Supabase Edge Function
   */
  private async performAnalysis(
    text: string,
    cacheKey: string,
    documentId?: string
  ): Promise<GrammarAnalysisResult> {
    console.log('[GROQ] Starting text analysis...');
    const startTime = Date.now();

    try {
      // Create the promise and store it to prevent duplicate requests
      const analysisPromise = this.callEdgeFunction(text, documentId);
      this.pendingAnalysis.set(cacheKey, analysisPromise);

      // Wait for the analysis to complete
      const result = await analysisPromise;

      // Cache the result
      this.analysisCache.set(cacheKey, result);
      
      // Log performance
      console.log(`[GROQ] Analysis completed in ${Date.now() - startTime}ms`);
      
      return result;
    } catch (error) {
      console.error('[GROQ] Analysis failed:', error);
      throw error;
    } finally {
      // Clean up pending analysis
      this.pendingAnalysis.delete(cacheKey);
    }
  }

  /**
   * Calls the Supabase Edge Function for text analysis
   */
  private async callEdgeFunction(
    text: string,
    documentId?: string
  ): Promise<GrammarAnalysisResult> {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-text', {
        body: {
          text,
          documentId,
          analysisType: text.length > 1000 ? 'full' : 'quick'
        }
      });

      if (error) {
        throw error;
      }

      return data as GrammarAnalysisResult;
    } catch (error) {
      console.error('[GROQ] Edge function error:', error);
      // Return a fallback result if the API fails
      return this.getFallbackResult(text);
    }
  }

  /**
   * Generates a cache key for the given text
   */
  private generateCacheKey(text: string): string {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `analysis_${hash}_${text.length}`;
  }

  /**
   * Checks if a cached result has expired
   */
  private isCacheExpired(cacheKey: string): boolean {
    // For now, we'll keep cache indefinitely during the session
    // You could implement timestamp-based expiration if needed
    return false;
  }

  /**
   * Returns an empty result for empty text
   */
  private getEmptyResult(): GrammarAnalysisResult {
    return {
      issues: [],
      scores: {
        correctness: 100,
        clarity: 100,
        engagement: 100,
        delivery: 100,
        overall: 100
      },
      metadata: {
        wordCount: 0,
        sentenceCount: 0,
        readingTime: 0,
        analysisTime: 0
      }
    };
  }

  /**
   * Returns a fallback result when API fails
   * Uses basic client-side analysis
   */
  private getFallbackResult(text: string): GrammarAnalysisResult {
    console.log('[GROQ] Using fallback analysis');
    
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Basic client-side checks
    const issues: GrammarIssue[] = [];
    
    // Check for double spaces
    const doubleSpaceMatch = text.match(/\s{2,}/g);
    if (doubleSpaceMatch) {
      doubleSpaceMatch.forEach((match, index) => {
        const position = text.indexOf(match);
        issues.push({
          id: `fallback_${Date.now()}_${index}`,
          type: 'style',
          category: 'Formatting',
          severity: 'low',
          message: 'Remove extra spaces',
          explanation: 'Multiple consecutive spaces should be reduced to a single space.',
          position: {
            start: position,
            end: position + match.length
          },
          originalText: match,
          suggestedText: ' ',
          confidence: 0.9
        });
      });
    }

    return {
      issues,
      scores: {
        correctness: issues.length === 0 ? 100 : 90,
        clarity: 85,
        engagement: 85,
        delivery: 85,
        overall: 86
      },
      metadata: {
        wordCount: words.length,
        sentenceCount: sentences.length,
        readingTime: Math.ceil(words.length / 200),
        analysisTime: 10
      }
    };
  }

  /**
   * Clears the analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear();
    this.pendingAnalysis.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  /**
   * Gets the category color for UI display
   */
  static getCategoryColor(type: GrammarIssue['type']): string {
    const colors = {
      spelling: '#ef4444',      // red
      grammar: '#f59e0b',       // amber
      style: '#3b82f6',         // blue
      clarity: '#8b5cf6',       // violet
      engagement: '#10b981',    // emerald
      delivery: '#6366f1'       // indigo
    };
    return colors[type] || '#6b7280'; // gray default
  }

  /**
   * Gets the category icon for UI display
   */
  static getCategoryIcon(type: GrammarIssue['type']): string {
    const icons = {
      spelling: '📝',
      grammar: '📐',
      style: '✨',
      clarity: '💡',
      engagement: '🎯',
      delivery: '📢'
    };
    return icons[type] || '📌';
  }
}

// Export singleton instance
export const groqGrammarService = new GroqGrammarService();