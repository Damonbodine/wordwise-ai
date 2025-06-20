import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { groqTestService as groqGrammarService, GrammarAnalysisResult } from '@/services/groq-test-service';

// Re-export types for compatibility
export type GrammarIssue = GrammarAnalysisResult['issues'][0];
export type DocumentScores = GrammarAnalysisResult['scores'];

// =============================================================================
// GRAMMAR STORE INTERFACE
// =============================================================================

interface GrammarStore {
  // Current analysis state
  issues: GrammarIssue[];
  scores: DocumentScores;
  isAnalyzing: boolean;
  lastAnalyzedText: string | null;
  
  // Selected issue for display
  selectedIssueId: string | null;
  
  // Accepted/rejected suggestions tracking
  acceptedSuggestions: Set<string>;
  rejectedSuggestions: Set<string>;
  
  // Actions
  analyzeText: (text: string, documentId?: string, writingStyle?: string) => Promise<void>;
  addIssues: (newIssues: GrammarIssue[]) => void;
  selectIssue: (issueId: string | null) => void;
  acceptSuggestion: (issueId: string) => { originalText: string; suggestedText: string } | null;
  rejectSuggestion: (issueId: string) => void;
  clearAnalysis: () => void;
  getVisibleIssues: () => GrammarIssue[];
  getScoreByCategory: (category: keyof DocumentScores) => number;
}

// =============================================================================
// GRAMMAR STORE IMPLEMENTATION
// =============================================================================

export const useGrammarStore = create<GrammarStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      issues: [],
      scores: {
        correctness: 100,
        clarity: 100,
        engagement: 100,
        delivery: 100,
        overall: 100
      },
      isAnalyzing: false,
      lastAnalyzedText: null,
      selectedIssueId: null,
      acceptedSuggestions: new Set(),
      rejectedSuggestions: new Set(),

      // Analyze text using Groq service
      analyzeText: async (text: string, documentId?: string, writingStyle?: string) => {
        console.log('[GRAMMAR STORE] 🔥 analyzeText called with:', { textLength: text.length, textPreview: text.substring(0, 50), documentId, writingStyle });
        
        const { lastAnalyzedText, acceptedSuggestions, rejectedSuggestions } = get();
        
        // Skip if text hasn't changed
        if (text === lastAnalyzedText) {
          console.log('[GRAMMAR STORE] ⏭️ Skipping - text unchanged');
          return;
        }

        console.log('[GRAMMAR STORE] 🔄 Setting isAnalyzing = true');
        set({ isAnalyzing: true });

        try {
          console.log('[GRAMMAR STORE] 📡 Calling groqGrammarService.analyzeText...');
          const result = await groqGrammarService.analyzeText(text, documentId, writingStyle);
          console.log('[GRAMMAR STORE] 📥 Got result:', result);
          
          // Filter out issues that have been accepted or rejected
          const filteredIssues = result.issues.filter(issue => {
            // If the issue text has been accepted, don't show it again
            const wasAccepted = Array.from(acceptedSuggestions).some(id => {
              const acceptedIssue = get().issues.find(i => i.id === id);
              return acceptedIssue && acceptedIssue.originalText === issue.originalText;
            });
            
            return !wasAccepted && !rejectedSuggestions.has(issue.id);
          });

          // Smart merge: keep existing issues unless superseded by new ones
          const { issues: existingIssues } = get();
          
          // Remove existing issues that overlap with new ones (same position)
          const nonOverlappingExisting = existingIssues.filter(existing => {
            return !filteredIssues.some(newIssue => 
              newIssue.position.start === existing.position.start &&
              newIssue.position.end === existing.position.end
            );
          });
          
          // Combine non-overlapping existing issues with new filtered issues
          const mergedIssues = [...nonOverlappingExisting, ...filteredIssues];

          console.log('[GRAMMAR STORE] 💾 Setting new issues in store:', {
            originalIssues: result.issues.length,
            filteredIssues: filteredIssues.length,
            mergedIssues: mergedIssues.length,
            scores: result.scores
          });

          set({
            issues: mergedIssues,
            scores: result.scores,
            isAnalyzing: false,
            lastAnalyzedText: text
          });

          console.log(`[GRAMMAR STORE] ✅ Analysis completed: ${filteredIssues.length} issues stored in state`);
        } catch (error) {
          console.error('[GRAMMAR] Analysis failed:', error);
          set({ isAnalyzing: false });
        }
      },

      // Add issues immediately (for Hunspell spell checking)
      addIssues: (newIssues: GrammarIssue[]) => {
        const { issues, acceptedSuggestions, rejectedSuggestions } = get();
        
        // Clear all existing issues first to prevent stacking
        // (We'll regenerate them all each time)
        const clearedIssues: GrammarIssue[] = [];
        
        // Filter new issues for validity and uniqueness
        const filteredNewIssues = newIssues.filter(newIssue => {
          // Don't add if already accepted or rejected by originalText
          const wasHandled = Array.from(acceptedSuggestions).some(id => {
            const acceptedIssue = issues.find(i => i.id === id);
            return acceptedIssue && acceptedIssue.originalText === newIssue.originalText;
          }) || Array.from(rejectedSuggestions).some(id => {
            const rejectedIssue = issues.find(i => i.id === id);
            return rejectedIssue && rejectedIssue.originalText === newIssue.originalText;
          });
          
          if (wasHandled) return false;
          
          // Ensure position data exists
          if (!newIssue.position || typeof newIssue.position.start !== 'number') {
            console.warn('[GRAMMAR STORE] Skipping issue without valid position:', newIssue);
            return false;
          }
          
          return true;
        });
        
        // Remove duplicates within the new issues based on text position
        const uniqueNewIssues = filteredNewIssues.filter((issue, index, array) => {
          return index === array.findIndex(other => 
            other.position.start === issue.position.start &&
            other.position.end === issue.position.end &&
            other.originalText === issue.originalText
          );
        });
        
        if (uniqueNewIssues.length > 0) {
          set({
            issues: uniqueNewIssues // Replace all issues with new ones
          });
          console.log(`[GRAMMAR STORE] Set ${uniqueNewIssues.length} unique issues (cleared previous)`);
        } else {
          set({ issues: [] }); // Clear issues if none are valid
        }
      },

      // Select an issue to display details
      selectIssue: (issueId: string | null) => {
        set({ selectedIssueId: issueId });
      },

      // Accept a suggestion and return the text replacement info
      acceptSuggestion: (issueId: string) => {
        const { issues, acceptedSuggestions } = get();
        const issue = issues.find(i => i.id === issueId);
        
        if (!issue) return null;

        // Add to accepted set
        const newAccepted = new Set(acceptedSuggestions);
        newAccepted.add(issueId);
        
        // Remove from issues and clear selection
        set({
          acceptedSuggestions: newAccepted,
          issues: issues.filter(i => i.id !== issueId),
          selectedIssueId: null
        });

        console.log(`[GRAMMAR] Accepted suggestion: ${issue.message}`);
        
        // Return the replacement info for the editor to apply
        return {
          originalText: issue.originalText,
          suggestedText: issue.suggestedText
        };
      },

      // Reject a suggestion
      rejectSuggestion: (issueId: string) => {
        const { issues, rejectedSuggestions } = get();
        const issue = issues.find(i => i.id === issueId);
        
        if (!issue) return;

        // Add to rejected set
        const newRejected = new Set(rejectedSuggestions);
        newRejected.add(issueId);
        
        // Remove from issues and clear selection
        set({
          rejectedSuggestions: newRejected,
          issues: issues.filter(i => i.id !== issueId),
          selectedIssueId: null
        });

        console.log(`[GRAMMAR] Rejected suggestion: ${issue.message}`);
      },

      // Clear all analysis data
      clearAnalysis: () => {
        groqGrammarService.clearCache();
        set({
          issues: [],
          scores: {
            correctness: 100,
            clarity: 100,
            engagement: 100,
            delivery: 100,
            overall: 100
          },
          isAnalyzing: false,
          lastAnalyzedText: null,
          selectedIssueId: null,
          acceptedSuggestions: new Set(),
          rejectedSuggestions: new Set()
        });
      },

      // Get visible issues (not accepted or rejected)
      getVisibleIssues: () => {
        const { issues, acceptedSuggestions, rejectedSuggestions } = get();
        return issues.filter(issue => 
          !acceptedSuggestions.has(issue.id) && 
          !rejectedSuggestions.has(issue.id)
        );
      },

      // Get score by category
      getScoreByCategory: (category: keyof DocumentScores) => {
        const { scores } = get();
        return scores[category];
      }
    }),
    {
      name: 'grammar-store'
    }
  )
);