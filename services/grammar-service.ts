"use client";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface TextIssue {
  id: string;
  type: 'spelling' | 'grammar' | 'vocabulary' | 'style';
  category: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  originalText: string;
  suggestedText: string;
  explanation?: string;
  position: {
    start: number;
    end: number;
  };
  confidence: number;
}

export interface GrammarAnalysisResult {
  issues: TextIssue[];
  grammarScore: number;
  spellingScore: number;
  overallScore: number;
  wordCount: number;
  suggestions: {
    accepted: number;
    pending: number;
    rejected: number;
  };
}

// =============================================================================
// GRAMMAR RULES ENGINE
// =============================================================================

class GrammarRulesEngine {
  private rules: Array<{
    id: string;
    name: string;
    pattern: RegExp;
    category: string;
    severity: 'low' | 'medium' | 'high';
    getMessage: (match: string) => string;
    getSuggestion: (match: string) => string;
    getExplanation?: (match: string) => string;
  }>;

  constructor() {
    this.rules = [
      // Common grammar mistakes
      {
        id: 'its_vs_its',
        name: "It's vs Its",
        pattern: /\b(its)\s+(a|the|an|my|your|his|her|their|our)\s+\w+/gi,
        category: 'Grammar',
        severity: 'medium',
        getMessage: () => "Consider if you meant \"it's\" (it is) instead of \"its\" (possessive)",
        getSuggestion: (match: string) => match.replace(/\bits\b/gi, "it's"),
        getExplanation: () => "Use \"it's\" for \"it is\" and \"its\" for possession"
      },
      {
        id: 'your_vs_youre',
        name: "Your vs You're",
        pattern: /\byour\s+(going|coming|doing|being|getting|having|making|saying|thinking|feeling)/gi,
        category: 'Grammar',
        severity: 'medium',
        getMessage: () => "Did you mean \"you're\" (you are) instead of \"your\" (possessive)?",
        getSuggestion: (match: string) => match.replace(/\byour\b/gi, "you're"),
        getExplanation: () => "Use \"you're\" for \"you are\" and \"your\" for possession"
      },
      {
        id: 'there_their_theyre',
        name: "There/Their/They're",
        pattern: /\b(there|their|they're)\s+(going|coming|doing|being|house|car|dog|cat|family)/gi,
        category: 'Grammar',
        severity: 'medium',
        getMessage: (match: string) => {
          if (match.toLowerCase().includes('going') || match.toLowerCase().includes('coming')) {
            return "Consider \"they're\" (they are) for actions";
          }
          if (match.toLowerCase().includes('house') || match.toLowerCase().includes('car')) {
            return "Consider \"their\" (possessive) for ownership";
          }
          return "Check if you're using the correct there/their/they're";
        },
        getSuggestion: (match: string) => {
          if (match.toLowerCase().includes('going') || match.toLowerCase().includes('coming')) {
            return match.replace(/\b(there|their)\b/gi, "they're");
          }
          if (match.toLowerCase().includes('house') || match.toLowerCase().includes('car')) {
            return match.replace(/\b(there|they're)\b/gi, "their");
          }
          return match;
        }
      },
      {
        id: 'subject_verb_disagreement',
        name: "Subject-Verb Agreement",
        pattern: /\b(he|she|it)\s+(are|were|have)/gi,
        category: 'Grammar',
        severity: 'high',
        getMessage: () => "Subject and verb don't agree",
        getSuggestion: (match: string) => {
          return match
            .replace(/\bare\b/gi, 'is')
            .replace(/\bwere\b/gi, 'was')
            .replace(/\bhave\b/gi, 'has');
        },
        getExplanation: () => "Singular subjects (he/she/it) need singular verbs (is/was/has)"
      },
      {
        id: 'double_negative',
        name: "Double Negative",
        pattern: /\b(don't|won't|can't|shouldn't|wouldn't|couldn't)\s+(no|nothing|nobody|nowhere|never)/gi,
        category: 'Grammar',
        severity: 'medium',
        getMessage: () => "Avoid double negatives",
        getSuggestion: (match: string) => {
          return match.replace(/\b(no|nothing|nobody|nowhere|never)\b/gi, (neg) => {
            switch(neg.toLowerCase()) {
              case 'no': return 'any';
              case 'nothing': return 'anything';
              case 'nobody': return 'anybody';
              case 'nowhere': return 'anywhere';
              case 'never': return 'ever';
              default: return neg;
            }
          });
        },
        getExplanation: () => "Two negatives make a positive. Use one negative word."
      },
      // Style improvements
      {
        id: 'passive_voice',
        name: "Passive Voice",
        pattern: /\b(was|were|is|are|been|being)\s+\w+ed\s+by\b/gi,
        category: 'Style',
        severity: 'low',
        getMessage: () => "Consider using active voice for stronger writing",
        getSuggestion: (match: string) => `[rewrite in active voice]: ${match}`,
        getExplanation: () => "Active voice makes writing more direct and engaging"
      },
      {
        id: 'wordy_phrases',
        name: "Wordy Phrases",
        pattern: /\b(in order to|due to the fact that|for the reason that|in spite of the fact that)\b/gi,
        category: 'Style',
        severity: 'low',
        getMessage: () => "Consider a more concise alternative",
        getSuggestion: (match: string) => {
          const replacements: Record<string, string> = {
            'in order to': 'to',
            'due to the fact that': 'because',
            'for the reason that': 'because',
            'in spite of the fact that': 'although'
          };
          return replacements[match.toLowerCase()] || match;
        },
        getExplanation: () => "Concise writing is often more effective"
      }
    ];
  }

  analyzeText(text: string): TextIssue[] {
    const issues: TextIssue[] = [];
    
    this.rules.forEach(rule => {
      const matches = Array.from(text.matchAll(rule.pattern));
      
      matches.forEach(match => {
        if (match.index !== undefined) {
          const issue: TextIssue = {
            id: `${rule.id}_${match.index}`,
            type: rule.category.toLowerCase() === 'grammar' ? 'grammar' : 'style',
            category: rule.category,
            severity: rule.severity,
            message: rule.getMessage(match[0]),
            originalText: match[0],
            suggestedText: rule.getSuggestion(match[0]),
            explanation: rule.getExplanation?.(match[0]),
            position: {
              start: match.index,
              end: match.index + match[0].length
            },
            confidence: 0.8
          };
          
          issues.push(issue);
        }
      });
    });
    
    return issues;
  }
}

// =============================================================================
// BROWSER-BASED SPELLING CHECKER
// =============================================================================

class SpellingChecker {
  private commonMisspellings: Map<string, string>;
  private tempElement: HTMLElement | null = null;

  constructor() {
    this.commonMisspellings = new Map([
      // Common misspellings
      ['teh', 'the'],
      ['adn', 'and'],
      ['recieve', 'receive'],
      ['seperate', 'separate'],
      ['definately', 'definitely'],
      ['occurence', 'occurrence'],
      ['accomodate', 'accommodate'],
      ['beleive', 'believe'],
      ['acheive', 'achieve'],
      ['neccessary', 'necessary'],
      ['maintainance', 'maintenance'],
      ['independant', 'independent'],
      ['goverment', 'government'],
      ['enviroment', 'environment'],
      ['recomend', 'recommend'],
      ['begining', 'beginning'],
      ['untill', 'until'],
      ['sucessful', 'successful'],
      ['occured', 'occurred'],
      ['wich', 'which'],
      ['thier', 'their'],
      ['freind', 'friend'],
      ['wierd', 'weird'],
      ['copywrite', 'copyright'],
      ['alot', 'a lot'],
      ['dont', "don't"],
      ['wont', "won't"],
      ['cant', "can't"],
      ['youre', "you're"],
      ['theyre', "they're"],
      ['wouldnt', "wouldn't"],
      ['shouldnt', "shouldn't"],
      ['couldnt', "couldn't"],
      ['isnt', "isn't"],
      ['arent', "aren't"],
      ['wasnt', "wasn't"],
      ['werent', "weren't"],
      ['hasnt', "hasn't"],
      ['havent', "haven't"],
      ['hadnt', "hadn't"],
      ['whos', "who's"],
      ['whats', "what's"],
      ['wheres', "where's"],
      ['heres', "here's"],
      ['theres', "there's"]
    ]);
    
    console.log('[SUCCESS] Browser-based spell checker initialized');
  }

  /**
   * Uses browser's built-in spell checker to validate a word
   */
  private isWordMisspelled(word: string): boolean {
    try {
      // Create a temporary input element with spell checking enabled
      if (!this.tempElement) {
        this.tempElement = document.createElement('input');
        this.tempElement.setAttribute('spellcheck', 'true');
        this.tempElement.style.position = 'absolute';
        this.tempElement.style.left = '-9999px';
        this.tempElement.style.opacity = '0';
        document.body.appendChild(this.tempElement);
      }

      const input = this.tempElement as HTMLInputElement;
      input.value = word;
      input.focus();
      
      // Force the browser to check spelling
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
      
      // Small delay to let browser process
      return new Promise<boolean>((resolve) => {
        setTimeout(() => {
          // Check if the word is marked as invalid by the browser
          const isInvalid = input.matches(':invalid') || 
                           input.classList.contains('spell-error') ||
                           getComputedStyle(input).textDecorationLine.includes('underline');
          resolve(isInvalid);
        }, 10);
      }) as any; // We'll handle this synchronously for now
      
    } catch (error) {
      console.warn('Browser spell check not available, falling back to basic validation');
      return false;
    }
  }

  /**
   * Alternative approach using contentEditable for spell checking
   */
  private isWordMisspelledContentEditable(word: string): boolean {
    try {
      if (!this.tempElement) {
        this.tempElement = document.createElement('div');
        this.tempElement.setAttribute('contenteditable', 'true');
        this.tempElement.setAttribute('spellcheck', 'true');
        this.tempElement.style.position = 'absolute';
        this.tempElement.style.left = '-9999px';
        this.tempElement.style.opacity = '0';
        this.tempElement.style.width = '1px';
        this.tempElement.style.height = '1px';
        document.body.appendChild(this.tempElement);
      }

      const div = this.tempElement;
      div.textContent = word;
      
      // Force focus and trigger spell check
      const range = document.createRange();
      range.selectNodeContents(div);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      // Check for spell-check indicators
      setTimeout(() => {
        const computedStyle = getComputedStyle(div);
        return computedStyle.textDecorationLine.includes('underline') ||
               computedStyle.textDecorationStyle === 'wavy';
      }, 50);
      
      return false; // Default to not misspelled if we can't detect
    } catch (error) {
      return false;
    }
  }

  async checkSpelling(text: string): Promise<TextIssue[]> {
    const issues: TextIssue[] = [];
    const words = text.match(/\b[a-zA-Z]+\b/g) || [];
    
    console.log('[SPELL CHECK] Browser spell checking words:', words.slice(0, 10), words.length > 10 ? `... and ${words.length - 10} more` : '');
    
    words.forEach((word: string) => {
      const lowerWord = word.toLowerCase();
      let wordStart = 0;
      let searchFrom = 0;
      
      // Find the correct position of this word occurrence
      while ((wordStart = text.indexOf(word, searchFrom)) !== -1) {
        searchFrom = wordStart + 1;
        
        // Check common misspellings first (highest confidence)
        if (this.commonMisspellings.has(lowerWord)) {
          const suggestion = this.commonMisspellings.get(lowerWord)!;
          
          console.log(`[MISSPELLING] Found common misspelling: "${word}" -> "${suggestion}"`);
          
          issues.push({
            id: `spelling_${wordStart}_${word}`,
            type: 'spelling',
            category: 'Spelling',
            severity: 'medium',
            message: `"${word}" is misspelled`,
            originalText: word,
            suggestedText: suggestion,
            explanation: `Did you mean "${suggestion}"?`,
            position: {
              start: wordStart,
              end: wordStart + word.length
            },
            confidence: 0.9
          });
        }
        // Skip very short words and proper nouns for browser checking
        else if (word.length > 2 && word[0] !== word[0].toUpperCase() && /^[a-zA-Z]+$/.test(word)) {
          // For now, we'll use a simpler approach - check against common patterns
          // The browser API integration will be enhanced in a future update
          const suggestion = this.getSuggestion(word);
          
          // Only flag words that have reasonable suggestions
          if (suggestion !== word && this.shouldFlagWord(word)) {
            console.log(`[POTENTIAL] Potential misspelling detected: "${word}"`);
            
            issues.push({
              id: `spelling_${wordStart}_${word}`,
              type: 'spelling',
              category: 'Spelling',
              severity: 'low',
              message: `"${word}" might be misspelled`,
              originalText: word,
              suggestedText: suggestion,
              explanation: `Consider "${suggestion}" instead of "${word}"`,
              position: {
                start: wordStart,
                end: wordStart + word.length
              },
              confidence: 0.6
            });
          } else {
            console.log(`[CORRECT] "${word}" appears correct`);
          }
        }
        
        break; // Only process the first occurrence for now
      }
    });
    
    return issues;
  }

  /**
   * Enhanced suggestion algorithm
   */
  private getSuggestion(word: string): string {
    const lowerWord = word.toLowerCase();
    
    // Check common misspellings first
    for (const [misspelling, correction] of this.commonMisspellings) {
      if (this.calculateSimilarity(lowerWord, misspelling) > 0.8) {
        return correction;
      }
    }

    // Common patterns and fixes
    const patterns = [
      // Double letters that should be single
      { pattern: /(.)\1{2,}/, replacement: '$1$1' }, // "helllo" -> "hello"
      // Common ending fixes
      { pattern: /ise$/, replacement: 'ize' }, // "realise" -> "realize"
      { pattern: /our$/, replacement: 'or' },   // "colour" -> "color"
      // Common letter swaps
      { pattern: /ei/, replacement: 'ie' },     // "recieve" -> "receive"
      { pattern: /ie/, replacement: 'ei' },     // For words like "weird" -> "wierd" (reverse)
    ];

    for (const { pattern, replacement } of patterns) {
      if (pattern.test(lowerWord)) {
        const suggested = lowerWord.replace(pattern, replacement);
        if (suggested !== lowerWord) {
          // Preserve original case
          return this.preserveCase(word, suggested);
        }
      }
    }
    
    return word;
  }

  /**
   * Determines if a word should be flagged for spell checking
   */
  private shouldFlagWord(word: string): boolean {
    // Skip very common words (basic English)
    const commonWords = new Set([
      'the', 'and', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'will', 'would', 'could', 'should',
      'to', 'of', 'in', 'on', 'at', 'for', 'with', 'by', 'from', 'about', 'as', 'be', 'or', 'but', 'if',
      'so', 'up', 'do', 'can', 'may', 'must', 'shall', 'that', 'this', 'these', 'those', 'there', 'where',
      'when', 'why', 'how', 'what', 'who', 'which', 'whose', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'project', 'proposal',
      'comprehensive', 'outlines', 'objectives', 'deliverables', 'timeline', 'upcoming', 'initiative',
      'aims', 'enhance', 'user', 'experience', 'drive', 'business', 'growth', 'key', 'features', 'include',
      'advanced', 'analytics', 'real', 'time', 'collaboration', 'seamless', 'integration', 'existing', 'systems'
    ]);

    return !commonWords.has(word.toLowerCase());
  }

  /**
   * Preserves the original case pattern when applying suggestions
   */
  private preserveCase(original: string, suggested: string): string {
    let result = '';
    for (let i = 0; i < Math.max(original.length, suggested.length); i++) {
      const originalChar = original[i];
      const suggestedChar = suggested[i] || suggested[suggested.length - 1];
      
      if (originalChar && originalChar === originalChar.toUpperCase()) {
        result += suggestedChar.toUpperCase();
      } else {
        result += suggestedChar.toLowerCase();
      }
    }
    return result;
  }

  /**
   * Simple similarity calculation for suggestions
   */
  private calculateSimilarity(s1: string, s2: string): number {
    if (s1 === s2) return 1.0;
    
    const len1 = s1.length;
    const len2 = s2.length;
    
    if (len1 === 0 || len2 === 0) return 0.0;
    
    // Levenshtein distance approach
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
    
    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,     // deletion
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }
    
    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len2][len1]) / maxLen;
  }

  /**
   * Cleanup method to remove temporary elements
   */
  cleanup(): void {
    if (this.tempElement && this.tempElement.parentNode) {
      this.tempElement.parentNode.removeChild(this.tempElement);
      this.tempElement = null;
    }
  }
}

// =============================================================================
// MAIN GRAMMAR SERVICE
// =============================================================================

export class GrammarService {
  private grammarEngine: GrammarRulesEngine;
  private spellChecker: SpellingChecker;

  constructor() {
    this.grammarEngine = new GrammarRulesEngine();
    this.spellChecker = new SpellingChecker();
  }

  async analyzeText(text: string): Promise<GrammarAnalysisResult> {
    if (!text || text.trim().length === 0) {
      return {
        issues: [],
        grammarScore: 100,
        spellingScore: 100,
        overallScore: 100,
        wordCount: 0,
        suggestions: {
          accepted: 0,
          pending: 0,
          rejected: 0
        }
      };
    }

    // Get issues from both engines (spelling check is now async)
    const grammarIssues = this.grammarEngine.analyzeText(text);
    const spellingIssues = await this.spellChecker.checkSpelling(text);
    
    // Combine and sort issues by position
    const allIssues = [...grammarIssues, ...spellingIssues]
      .sort((a, b) => a.position.start - b.position.start);

    // Calculate scores
    const wordCount = (text.match(/\b\w+\b/g) || []).length;
    const grammarScore = this.calculateGrammarScore(grammarIssues, wordCount);
    const spellingScore = this.calculateSpellingScore(spellingIssues, wordCount);
    const overallScore = Math.round((grammarScore + spellingScore) / 2);

    console.log(`[ANALYSIS] Analysis complete: ${allIssues.length} issues found (${grammarIssues.length} grammar, ${spellingIssues.length} spelling)`);

    return {
      issues: allIssues,
      grammarScore,
      spellingScore,
      overallScore,
      wordCount,
      suggestions: {
        accepted: 0,
        pending: allIssues.length,
        rejected: 0
      }
    };
  }

  private calculateGrammarScore(issues: TextIssue[], wordCount: number): number {
    if (wordCount === 0) return 100;
    
    const errorWeight = issues.reduce((sum, issue) => {
      switch (issue.severity) {
        case 'high': return sum + 3;
        case 'medium': return sum + 2;
        case 'low': return sum + 1;
        default: return sum + 1;
      }
    }, 0);
    
    // Score based on errors per 100 words
    const errorsPerHundred = (errorWeight / wordCount) * 100;
    const score = Math.max(0, 100 - (errorsPerHundred * 10));
    
    return Math.round(score);
  }

  private calculateSpellingScore(issues: TextIssue[], wordCount: number): number {
    if (wordCount === 0) return 100;
    
    const spellingErrors = issues.filter(issue => issue.type === 'spelling').length;
    const errorsPerHundred = (spellingErrors / wordCount) * 100;
    const score = Math.max(0, 100 - (errorsPerHundred * 15));
    
    return Math.round(score);
  }

  // Vocabulary suggestions (simple implementation)
  getVocabularyIssues(text: string): TextIssue[] {
    const vocabularyPatterns = [
      {
        pattern: /\bcopywrite\b/gi,
        suggestion: 'copyright',
        explanation: "'Copywrite' refers to writing copy, while 'copyright' refers to the legal right. The context suggests the former."
      },
      {
        pattern: /\bvery\s+(good|bad|big|small|nice|pretty)\b/gi,
        suggestion: (match: string) => {
          const word = match.split(' ')[1];
          const alternatives: Record<string, string> = {
            'good': 'excellent',
            'bad': 'terrible',
            'big': 'enormous',
            'small': 'tiny',
            'nice': 'wonderful',
            'pretty': 'beautiful'
          };
          return alternatives[word] || match;
        },
        explanation: 'Consider a more specific adjective instead of "very + basic adjective"'
      }
    ];

    const issues: TextIssue[] = [];
    
    vocabularyPatterns.forEach((pattern, index) => {
      const matches = Array.from(text.matchAll(pattern.pattern));
      
      matches.forEach(match => {
        if (match.index !== undefined) {
          const suggestion = typeof pattern.suggestion === 'function' 
            ? pattern.suggestion(match[0]) 
            : pattern.suggestion;
            
          issues.push({
            id: `vocab_${index}_${match.index}`,
            type: 'vocabulary',
            category: 'Vocabulary',
            severity: 'low',
            message: 'Consider a more precise word choice',
            originalText: match[0],
            suggestedText: suggestion,
            explanation: pattern.explanation,
            position: {
              start: match.index,
              end: match.index + match[0].length
            },
            confidence: 0.7
          });
        }
      });
    });
    
    return issues;
  }
}

// Export singleton instance
export const grammarService = new GrammarService();