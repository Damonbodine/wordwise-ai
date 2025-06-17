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
  analyzeText: (text: string, documentId?: string) => Promise<void>;
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
      analyzeText: async (text: string, documentId?: string) => {
        const { lastAnalyzedText, acceptedSuggestions, rejectedSuggestions } = get();
        
        // Skip if text hasn't changed
        if (text === lastAnalyzedText) {
          return;
        }

        set({ isAnalyzing: true });

        try {
          const result = await groqGrammarService.analyzeText(text, documentId);
          
          // Filter out issues that have been accepted or rejected
          const filteredIssues = result.issues.filter(issue => {
            // If the issue text has been accepted, don't show it again
            const wasAccepted = Array.from(acceptedSuggestions).some(id => {
              const acceptedIssue = get().issues.find(i => i.id === id);
              return acceptedIssue && acceptedIssue.originalText === issue.originalText;
            });
            
            return !wasAccepted && !rejectedSuggestions.has(issue.id);
          });

          set({
            issues: filteredIssues,
            scores: result.scores,
            isAnalyzing: false,
            lastAnalyzedText: text
          });

          console.log(`[GRAMMAR] Analysis completed: ${filteredIssues.length} issues found`);
        } catch (error) {
          console.error('[GRAMMAR] Analysis failed:', error);
          set({ isAnalyzing: false });
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