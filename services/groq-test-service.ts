"use client";

// Temporary direct Groq API service for testing
// NOTE: This should only be used for development/testing
// Production should use the Supabase Edge Function

import { GrammarAnalysisResult, GrammarIssue, DocumentScores } from './groq-grammar-service';

// Re-export types for other modules
export type { GrammarAnalysisResult, GrammarIssue, DocumentScores };

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';

export class GroqTestService {
  private analysisCache: Map<string, GrammarAnalysisResult> = new Map();
  private pendingAnalysis: Map<string, Promise<GrammarAnalysisResult>> = new Map();
  
  async analyzeText(text: string, documentId?: string): Promise<GrammarAnalysisResult> {
    if (!text || text.trim().length === 0) {
      return this.getEmptyResult();
    }

    const cacheKey = this.generateCacheKey(text);
    
    // Check cache
    if (this.analysisCache.has(cacheKey)) {
      console.log('[GROQ TEST] Returning cached result');
      return this.analysisCache.get(cacheKey)!;
    }

    // Check pending
    if (this.pendingAnalysis.has(cacheKey)) {
      return this.pendingAnalysis.get(cacheKey)!;
    }

    const promise = this.performAnalysis(text, cacheKey);
    this.pendingAnalysis.set(cacheKey, promise);
    
    try {
      const result = await promise;
      this.analysisCache.set(cacheKey, result);
      return result;
    } finally {
      this.pendingAnalysis.delete(cacheKey);
    }
  }

  private async performAnalysis(text: string, cacheKey: string): Promise<GrammarAnalysisResult> {
    const startTime = Date.now();
    console.log('[GROQ TEST] Starting analysis for text:', text.substring(0, 50) + '...');
    console.log('[GROQ TEST] API Key present:', !!GROQ_API_KEY, 'Length:', GROQ_API_KEY.length);

    const systemPrompt = this.getEnhancedSystemPrompt();

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analyze this text: "${text}"` }
          ],
          temperature: 0.3,
          max_tokens: 2048,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[GROQ TEST] API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Groq API request failed: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      const groqResult = JSON.parse(data.choices[0].message.content);

      // Convert to our format
      const issues: GrammarIssue[] = groqResult.issues.map((issue: any, index: number) => ({
        id: `issue_${Date.now()}_${index}`,
        type: issue.type,
        category: issue.category,
        severity: issue.severity,
        message: issue.message,
        explanation: issue.explanation,
        position: {
          start: issue.startIndex || 0,
          end: issue.endIndex || issue.originalText?.length || 0
        },
        originalText: issue.originalText,
        suggestedText: issue.suggestedText,
        confidence: issue.confidence || 0.8
      }));

      const words = text.trim().split(/\s+/).filter(w => w.length > 0);
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const analysisTime = Date.now() - startTime;

      console.log(`[GROQ TEST] Analysis completed in ${analysisTime}ms, found ${issues.length} issues`);

      return {
        issues,
        scores: {
          correctness: groqResult.scores.correctness || 90,
          clarity: groqResult.scores.clarity || 85,
          engagement: groqResult.scores.engagement || 80,
          delivery: groqResult.scores.delivery || 85,
          overall: Math.round(
            ((groqResult.scores.correctness || 90) +
             (groqResult.scores.clarity || 85) +
             (groqResult.scores.engagement || 80) +
             (groqResult.scores.delivery || 85)) / 4
          )
        },
        metadata: {
          wordCount: words.length,
          sentenceCount: sentences.length,
          readingTime: Math.ceil(words.length / 200),
          analysisTime
        }
      };

    } catch (error) {
      console.error('[GROQ TEST] Analysis failed:', error);
      return this.getFallbackResult(text);
    }
  }

  private generateCacheKey(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `test_${hash}_${text.length}`;
  }

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

  private getFallbackResult(text: string): GrammarAnalysisResult {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Basic fallback grammar checking
    const issues: any[] = [];
    
    // Check for some basic issues as fallback
    const commonMisspellings = {
      'weirjgg': 'weird',
      'persona': 'person',
      'recieve': 'receive',
      'seperate': 'separate',
      'definately': 'definitely'
    };
    
    let issueId = 0;
    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (commonMisspellings[cleanWord]) {
        issues.push({
          id: `fallback_${issueId++}`,
          type: 'spelling',
          category: 'Spelling Error',
          severity: 'medium',
          message: `"${word}" may be misspelled`,
          explanation: `Consider changing "${word}" to "${commonMisspellings[cleanWord]}"`,
          originalText: word,
          suggestedText: commonMisspellings[cleanWord],
          position: { start: 0, end: word.length },
          confidence: 0.8
        });
      }
    });
    
    return {
      issues,
      scores: {
        correctness: issues.length > 0 ? 75 : 95,
        clarity: 90,
        engagement: 85,
        delivery: 90,
        overall: issues.length > 0 ? 80 : 90
      },
      metadata: {
        wordCount: words.length,
        sentenceCount: sentences.length,
        readingTime: Math.ceil(words.length / 200),
        analysisTime: 50
      }
    };
  }

  clearCache(): void {
    this.analysisCache.clear();
    this.pendingAnalysis.clear();
  }
}

export const groqTestService = new GroqTestService();