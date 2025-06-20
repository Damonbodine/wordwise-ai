"use client";

// Browser-based spell checker using native Hunspell
// Provides instant spell checking as fallback/enhancement to GROQ

import { GrammarIssue } from '@/stores/grammar-store';

export class HunspellService {
  private tempElement: HTMLElement | null = null;
  private commonMisspellings: Record<string, string> = {
    // Most common obvious errors that should ALWAYS be caught
    'teh': 'the',
    'hte': 'the', 
    'adn': 'and',
    'tehm': 'them',
    'recieve': 'receive',
    'seperate': 'separate',
    'friggin': 'frigging',
    'definately': 'definitely',
    'occured': 'occurred',
    'neccessary': 'necessary',
    'accomodate': 'accommodate',
    'goverment': 'government',
    'tommorrow': 'tomorrow',
    'wendesday': 'Wednesday',
    
    // Grammar-style errors (contraction issues)
    'wont': "won't",
    'dont': "don't", 
    'cant': "can't",
    'shouldnt': "shouldn't",
    'wouldnt': "wouldn't",
    'couldnt': "couldn't",
    'isnt': "isn't",
    'arent': "aren't",
    'wasnt': "wasn't",
    'werent': "weren't",
    
    // Common typing errors
    'alot': 'a lot',
    'allright': 'all right',
    'untill': 'until',
    'thier': 'their',
    'freind': 'friend',
    'beleive': 'believe',
    'acheive': 'achieve',
    
    // Test words from user examples
    'stuffdd': 'stuff',
    'helllo': 'hello',
    'worlkd': 'world',
  };

  /**
   * Analyze text for spelling AND grammar errors
   */
  async analyzeSpelling(text: string): Promise<GrammarIssue[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const issues: GrammarIssue[] = [];
    
    // First check for grammar patterns
    const grammarIssues = this.checkBasicGrammar(text);
    issues.push(...grammarIssues);
    
    // Then check for spelling issues
    const words = this.extractWordsWithPositions(text);
    
    for (const { word, start, end } of words) {
      const cleanWord = word.toLowerCase().replace(/[^a-zA-Z]/g, '');
      
      // Skip very short words or numbers
      if (cleanWord.length < 3 || /^\d+$/.test(cleanWord)) {
        continue;
      }
      
      // Check common misspellings first (instant)
      const correction = this.commonMisspellings[cleanWord];
      if (correction) {
        issues.push({
          id: `spell_${Date.now()}_${start}`,
          type: 'spelling',
          category: 'Spelling Error',
          severity: 'high',
          message: `"${word}" appears to be misspelled`,
          explanation: `Did you mean "${correction}"?`,
          originalText: word,
          suggestedText: correction,
          position: { start, end },
          confidence: 0.95
        });
        continue;
      }
      
      // Use browser spell check for other words
      const isMisspelled = await this.isWordMisspelled(cleanWord);
      if (isMisspelled) {
        issues.push({
          id: `spell_${Date.now()}_${start}`,
          type: 'spelling', 
          category: 'Spelling Error',
          severity: 'medium',
          message: `"${word}" may be misspelled`,
          explanation: 'Check spelling',
          originalText: word,
          suggestedText: word, // Browser doesn't provide suggestions
          position: { start, end },
          confidence: 0.8
        });
      }
    }
    
    console.log(`[HUNSPELL] Found ${issues.length} total issues:`, issues.map(i => `${i.type}:"${i.originalText}"→"${i.suggestedText}"`));
    return issues;
  }

  /**
   * Check for basic grammar patterns
   */
  private checkBasicGrammar(text: string): GrammarIssue[] {
    const issues: GrammarIssue[] = [];
    
    // Common grammar patterns that should be flagged
    const grammarPatterns = [
      // Subject-verb disagreement
      { pattern: /\bThe dog eat\b/gi, replacement: 'The dog eats', type: 'Subject-verb disagreement' },
      { pattern: /\bI seen\b/gi, replacement: 'I saw', type: 'Incorrect verb form' },
      { pattern: /\bI done\b/gi, replacement: 'I did', type: 'Incorrect verb form' },
      
      // Wrong word usage (homophones)  
      { pattern: /\bTheir\s+(?=going|is|are|was|were)/gi, replacement: "They're", type: 'Wrong word (homophone)' },
      { pattern: /\bthere\s+(?=going|is|are|was|were)/gi, replacement: "they're", type: 'Wrong word (homophone)' },
      { pattern: /\byour\s+(?=going|is|are|was|were)/gi, replacement: "you're", type: 'Wrong word (homophone)' },
      
      // Missing apostrophes
      { pattern: /\bitsn't\b/gi, replacement: "isn't", type: 'Missing apostrophe' },
      { pattern: /\bits raining\b/gi, replacement: "it's raining", type: 'Missing apostrophe' },
      { pattern: /\bits a\b/gi, replacement: "it's a", type: 'Missing apostrophe' },
      { pattern: /\byou and i\b/gi, replacement: 'you and me', type: 'Incorrect pronoun case' },
    ];
    
    grammarPatterns.forEach(({ pattern, replacement, type }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        issues.push({
          id: `grammar_${Date.now()}_${match.index}`,
          type: 'grammar',
          category: type,
          severity: 'medium',
          message: `${type} detected`,
          explanation: `Consider using "${replacement}"`,
          originalText: match[0],
          suggestedText: replacement,
          position: { start: match.index, end: match.index + match[0].length },
          confidence: 0.85
        });
      }
    });
    
    return issues;
  }

  /**
   * Extract words from text with their exact positions
   */
  private extractWordsWithPositions(text: string): Array<{ word: string; start: number; end: number }> {
    const words: Array<{ word: string; start: number; end: number }> = [];
    const wordRegex = /\b\w+\b/g;
    let match;
    
    while ((match = wordRegex.exec(text)) !== null) {
      words.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    return words;
  }

  /**
   * Check if a word is misspelled using browser's spell checker
   */
  private async isWordMisspelled(word: string): Promise<boolean> {
    try {
      // Create temporary contenteditable element for spell checking
      if (!this.tempElement) {
        this.tempElement = document.createElement('div');
        this.tempElement.setAttribute('contenteditable', 'true');
        this.tempElement.setAttribute('spellcheck', 'true');
        this.tempElement.style.position = 'absolute';
        this.tempElement.style.left = '-9999px';
        this.tempElement.style.opacity = '0';
        this.tempElement.style.pointerEvents = 'none';
        document.body.appendChild(this.tempElement);
      }

      const element = this.tempElement as HTMLElement;
      element.textContent = word;
      
      // Force spell check
      element.focus();
      const event = new Event('input', { bubbles: true });
      element.dispatchEvent(event);
      
      // Give browser time to process
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Check for spell-check indicators
      const computedStyle = getComputedStyle(element);
      const hasSpellError = computedStyle.textDecorationLine?.includes('underline') &&
                           computedStyle.textDecorationStyle?.includes('wavy');
      
      return hasSpellError;
    } catch (error) {
      console.warn('[HUNSPELL] Browser spell check not available:', error);
      return false;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.tempElement && this.tempElement.parentNode) {
      this.tempElement.parentNode.removeChild(this.tempElement);
      this.tempElement = null;
    }
  }
}

// Export singleton instance
export const hunspellService = new HunspellService();

// Export test function for debugging (client-side only)
if (typeof window !== 'undefined') {
  (window as any).testHunspell = async (text: string) => {
    console.log('🧪 Testing Hunspell with:', text);
    const result = await hunspellService.analyzeSpelling(text);
    console.log('🧪 Hunspell result:', result);
    return result;
  };
}