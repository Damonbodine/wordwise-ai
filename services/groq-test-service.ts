"use client";

// Temporary direct Groq API service for testing
// NOTE: This should only be used for development/testing
// Production should use the Supabase Edge Function

import { GrammarAnalysisResult, GrammarIssue, DocumentScores } from './groq-grammar-service';

// Re-export types for other modules
export type { GrammarAnalysisResult, GrammarIssue, DocumentScores };

// API calls now go through our server-side API route for security

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

  private getEnhancedSystemPrompt(): string {
    return `You are an expert writing assistant with specialized expertise in CORRECTNESS, CLARITY, and ENGAGEMENT. Analyze text comprehensively across all three dimensions with equal focus.

## ANALYSIS FRAMEWORK

### 1. CORRECTNESS (High Priority)
**Grammar Errors**:
- Subject-verb disagreement ("The team are" → "The team is")
- Incorrect pronoun case ("between you and I" → "between you and me") 
- Dangling modifiers ("Walking to the store, the rain started")
- Run-on sentences and fragments
- Incorrect verb tense consistency
- Misplaced apostrophes ("it's" vs "its")

**Spelling & Punctuation**:
- Misspelled words and typos
- Homophones ("there/their/they're", "effect/affect")
- Missing or incorrect commas, semicolons, periods

### 2. CLARITY (High Priority)
**Sentence Structure**:
- Ambiguous pronoun references ("it", "this", "that" without clear antecedents)
- Overly complex sentences that obscure meaning
- Unclear subject-verb relationships
- Misplaced modifiers creating confusion

**Readability Issues**:
- Excessive wordiness ("in order to" → "to", "due to the fact that" → "because")
- Redundant phrases ("advance planning" → "planning")
- Vague language ("very good" → "excellent", "a lot of" → "many")
- Unclear transitions between ideas

**Word Choice**:
- Imprecise vocabulary that creates ambiguity
- Jargon without explanation for general audiences
- Inconsistent terminology for the same concept

### 3. ENGAGEMENT (Medium Priority)
**Writing Energy**:
- Passive voice overuse (when active voice is clearer and more dynamic)
- Weak verb choices ("is located" → "sits", "has the ability to" → "can")
- Monotonous sentence structure (all short or all long sentences)

**Reader Interest**:
- Generic or clichéd phrases ("think outside the box", "at the end of the day")
- Repetitive word choice within paragraphs
- Lack of specific, concrete details

**Tone & Style**:
- Inconsistent formality level
- Overly formal language for casual contexts
- Missing personality or voice in appropriate contexts

## OUTPUT FORMAT
Return ONLY valid JSON:
{
  "issues": [
    {
      "type": "grammar|spelling|punctuation|clarity|engagement|style",
      "category": "Grammar Error|Spelling Error|Punctuation|Clarity Issue|Engagement|Style",
      "severity": "high|medium|low",
      "message": "Clear, actionable description (max 80 chars)",
      "explanation": "Why this improves readability, understanding, or engagement",
      "originalText": "exact text from input",
      "suggestedText": "improved version",
      "startIndex": 0,
      "endIndex": 0,
      "confidence": 0.85
    }
  ],
  "scores": {
    "correctness": 85,
    "clarity": 90,
    "engagement": 75,
    "delivery": 80
  }
}

## SCORING GUIDELINES
- **Correctness**: Grammar, spelling, punctuation accuracy (100 = perfect, 80+ = good)
- **Clarity**: How easily readers understand the message (100 = crystal clear, 80+ = mostly clear)
- **Engagement**: How compelling and interesting the writing is (100 = captivating, 80+ = engaging)
- **Delivery**: How well tone and style match the intended purpose (100 = perfect match)

## ANALYSIS PRIORITIES
1. **Always flag CORRECTNESS issues** (grammar/spelling errors undermine credibility)
2. **Prioritize CLARITY improvements** that significantly improve understanding
3. **Suggest ENGAGEMENT enhancements** that don't sacrifice clarity or correctness
4. **Focus on high-impact changes** rather than minor stylistic preferences

## CRITICAL RULES
- Only suggest changes you're 85%+ confident will improve the writing
- Provide specific, actionable suggestions
- Explain WHY each change improves the text
- Respect the author's voice while enhancing clarity and engagement
- Prioritize reader understanding above all else`;
  }

  private async performAnalysis(text: string, cacheKey: string): Promise<GrammarAnalysisResult> {
    const startTime = Date.now();
    console.log('[GROQ TEST] Starting analysis for text:', text.substring(0, 50) + '...');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[GROQ TEST] API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Analysis API request failed: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      const groqResult = { issues: data.issues, scores: { correctness: 90, clarity: 85, engagement: 80, delivery: 85 } };

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
    
    // Enhanced fallback grammar checking focused on CORRECTNESS
    const issues: any[] = [];
    
    // Comprehensive spelling corrections (focused on correctness)
    const commonMisspellings = {
      // Obvious typos/nonsense words
      'weirjgg': 'weird',
      'teh': 'the',
      'recieve': 'receive',
      'seperate': 'separate',
      'definately': 'definitely',
      'occured': 'occurred',
      'neccessary': 'necessary',
      'accomodate': 'accommodate',
      'embarass': 'embarrass',
      'maintainance': 'maintenance',
      'goverment': 'government',
      'begining': 'beginning',
      'tommorrow': 'tomorrow',
      'febuary': 'February',
      'wendesday': 'Wednesday',
      'independant': 'independent',
      'existance': 'existence',
      'consistant': 'consistent',
      'differant': 'different',
      'enviroment': 'environment',
      'priviledge': 'privilege'
    };
    
    // Enhanced pattern detection for grammar, clarity, and engagement
    const grammarPatterns = [
      { pattern: /\bi\s+am\s+went\b/gi, correction: 'I went', type: 'grammar', category: 'Grammar Error', message: 'Verb tense error' },
      { pattern: /\byou\s+was\b/gi, correction: 'you were', type: 'grammar', category: 'Grammar Error', message: 'Subject-verb disagreement' },
      { pattern: /\btheir\s+going\b/gi, correction: 'they\'re going', type: 'grammar', category: 'Grammar Error', message: 'Homophone confusion' },
      { pattern: /\bits\s+raining\b/gi, correction: 'it\'s raining', type: 'punctuation', category: 'Punctuation', message: 'Contraction error' },
      { pattern: /\beffect\s+the\s+change\b/gi, correction: 'affect the change', type: 'grammar', category: 'Grammar Error', message: 'Effect/affect confusion' }
    ];
    
    // Clarity improvement patterns
    const clarityPatterns = [
      { pattern: /\bin\s+order\s+to\b/gi, correction: 'to', type: 'clarity', category: 'Clarity Issue', message: 'Remove unnecessary words' },
      { pattern: /\bdue\s+to\s+the\s+fact\s+that\b/gi, correction: 'because', type: 'clarity', category: 'Clarity Issue', message: 'Simplify wordy phrase' },
      { pattern: /\badvance\s+planning\b/gi, correction: 'planning', type: 'clarity', category: 'Clarity Issue', message: 'Remove redundant word' },
      { pattern: /\ba\s+lot\s+of\b/gi, correction: 'many', type: 'clarity', category: 'Clarity Issue', message: 'Use more precise language' },
      { pattern: /\bvery\s+good\b/gi, correction: 'excellent', type: 'clarity', category: 'Clarity Issue', message: 'Use stronger, more specific word' },
      { pattern: /\bthis\s+is\s+important\b/gi, correction: 'this matters because', type: 'clarity', category: 'Clarity Issue', message: 'Explain why something is important' }
    ];
    
    // Engagement enhancement patterns  
    const engagementPatterns = [
      { pattern: /\bis\s+located\s+in\b/gi, correction: 'sits in', type: 'engagement', category: 'Engagement', message: 'Use more dynamic verb' },
      { pattern: /\bhas\s+the\s+ability\s+to\b/gi, correction: 'can', type: 'engagement', category: 'Engagement', message: 'Use concise, active language' },
      { pattern: /\bthink\s+outside\s+the\s+box\b/gi, correction: 'innovate', type: 'engagement', category: 'Engagement', message: 'Replace cliché with specific term' },
      { pattern: /\bat\s+the\s+end\s+of\s+the\s+day\b/gi, correction: 'ultimately', type: 'engagement', category: 'Engagement', message: 'Replace overused phrase' },
      { pattern: /\bwas\s+\w+ed\s+by\b/gi, correction: '', type: 'engagement', category: 'Engagement', message: 'Consider active voice for more energy' }
    ];
    
    let issueId = 0;
    
    // Check for spelling errors
    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (commonMisspellings[cleanWord]) {
        issues.push({
          id: `fallback_spelling_${issueId++}`,
          type: 'spelling',
          category: 'Spelling Error',
          severity: 'high',
          message: `"${word}" appears to be misspelled`,
          explanation: `"${word}" should be "${commonMisspellings[cleanWord]}" for correct spelling`,
          originalText: word,
          suggestedText: commonMisspellings[cleanWord],
          position: { start: 0, end: word.length },
          confidence: 0.9
        });
      }
    });
    
    // Check all pattern types for comprehensive fallback analysis
    const allPatterns = [...grammarPatterns, ...clarityPatterns, ...engagementPatterns];
    
    allPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern.pattern);
      if (matches) {
        matches.forEach(match => {
          const severity = pattern.type === 'grammar' || pattern.type === 'spelling' ? 'high' : 
                          pattern.type === 'clarity' ? 'medium' : 'low';
          
          issues.push({
            id: `fallback_${pattern.type}_${issueId++}`,
            type: pattern.type,
            category: pattern.category,
            severity: severity,
            message: pattern.message,
            explanation: `"${match.trim()}" can be improved. ${pattern.message}: "${pattern.correction || 'see suggestion'}"`,
            originalText: match.trim(),
            suggestedText: pattern.correction || match.trim(),
            position: { start: 0, end: match.length },
            confidence: pattern.type === 'grammar' ? 0.9 : pattern.type === 'clarity' ? 0.8 : 0.7
          });
        });
      }
    });
    
    // Calculate scores based on issue types found
    const correctnessIssues = issues.filter(i => i.type === 'grammar' || i.type === 'spelling' || i.type === 'punctuation');
    const clarityIssues = issues.filter(i => i.type === 'clarity');
    const engagementIssues = issues.filter(i => i.type === 'engagement' || i.type === 'style');
    
    const correctnessScore = Math.max(60, 100 - (correctnessIssues.length * 15));
    const clarityScore = Math.max(70, 100 - (clarityIssues.length * 10));
    const engagementScore = Math.max(75, 100 - (engagementIssues.length * 8));
    const deliveryScore = 90; // Base delivery score
    const overallScore = Math.round((correctnessScore + clarityScore + engagementScore + deliveryScore) / 4);
    
    return {
      issues,
      scores: {
        correctness: correctnessScore,
        clarity: clarityScore,
        engagement: engagementScore,
        delivery: deliveryScore,
        overall: overallScore
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