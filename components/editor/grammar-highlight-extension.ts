import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { GrammarIssue } from '@/stores/grammar-store';

// Plugin key for the grammar highlighting
const grammarHighlightPluginKey = new PluginKey('grammarHighlight');

export interface GrammarHighlightOptions {
  issues: GrammarIssue[];
  onSuggestionClick: (issue: GrammarIssue, position: number, clickPosition?: { x: number; y: number }) => void;
}

// Helper functions for styling
function getIssueClassName(type: string, severity: string): string {
  const baseClass = 'grammar-issue';
  const typeClass = `grammar-issue-${type}`;
  const severityClass = `grammar-issue-${severity}`;
  return `${baseClass} ${typeClass} ${severityClass}`;
}

export const GrammarHighlightExtension = Extension.create<GrammarHighlightOptions>({
  name: 'grammarHighlight',

  addOptions() {
    return {
      issues: [],
      onSuggestionClick: () => {},
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    
    return [
      new Plugin({
        key: grammarHighlightPluginKey,
        
        state: {
          init() {
            return DecorationSet.empty;
          },
          
          apply(tr, decorationSet, oldState, newState) {
            // Force rebuild decorations when issues change (ignore transaction mapping)
            const issues = extension.options.issues;
            
            if (!issues || issues.length === 0) {
              console.log(`[GRAMMAR HIGHLIGHT] No issues to highlight`);
              return DecorationSet.empty;
            }

            const text = newState.doc.textContent;
            const decorations: Decoration[] = [];
            const usedPositions = new Set<string>(); // Track positions to avoid duplicates
            
            console.log(`[GRAMMAR HIGHLIGHT] Creating decorations for ${issues.length} issues in text:`, text.substring(0, 100));
            
            issues.forEach((issue, index) => {
              
              // Always use indexOf to find the text in the actual document
              // GROQ identifies errors but positioning should be done by our code
              let from, to;
              
              // Find the original text in the actual document text
              const startPos = text.indexOf(issue.originalText);
              if (startPos !== -1) {
                // Convert to ProseMirror 1-based indexing
                from = startPos + 1;
                to = startPos + issue.originalText.length + 1;
                console.log(`[GRAMMAR HIGHLIGHT] Found "${issue.originalText}" at positions ${from}-${to}`);
              } else {
                // Text not found - GROQ hallucinated this text, skip this issue
                console.warn(`[GRAMMAR HIGHLIGHT] Text "${issue.originalText}" not found in document, skipping issue`);
                return; // Skip this issue entirely
              }
              
              // Debug: Always log position validation
              console.log(`[GRAMMAR HIGHLIGHT] Position check for "${issue.originalText}":`, {
                from, to, docSize: newState.doc.content.size, valid: (from >= 1 && to <= newState.doc.content.size && from < to)
              });
              
              // Validate positions are within document bounds
              if (from >= 1 && to <= newState.doc.content.size && from < to) {
                // Create a unique key for this position to avoid duplicates
                const posKey = `${from}-${to}-${issue.type}`;
                
                // Only add decoration if we haven't already decorated this position
                if (!usedPositions.has(posKey)) {
                  usedPositions.add(posKey);
                  
                  const className = getIssueClassName(issue.type, issue.severity);
                  
                  console.log(`[GRAMMAR HIGHLIGHT] Creating decoration from ${from} to ${to} with class "${className}" for "${issue.originalText}"`);
                  
                  const decoration = Decoration.inline(from, to, {
                    class: className,
                    'data-issue-id': issue.id,
                    'data-issue-type': issue.type,
                    'data-issue-text': issue.originalText,
                    'data-issue-severity': issue.severity,
                  }, {
                    inclusiveStart: false,
                    inclusiveEnd: false,
                  });
                  
                  decorations.push(decoration);
                  console.log(`[GRAMMAR HIGHLIGHT] Added decoration for "${issue.originalText}" at positions ${from}-${to}`);
                }
              } else {
                console.warn('[GRAMMAR HIGHLIGHT] Invalid position for issue:', {
                  issue: issue.originalText,
                  groqPosition: issue.position,
                  calculatedFrom: from,
                  calculatedTo: to,
                  docSize: newState.doc.content.size,
                  textLength: text.length
                });
              }
            });
            
            console.log(`[GRAMMAR HIGHLIGHT] Created ${decorations.length} total decorations`);
            const newDecorationSet = DecorationSet.create(newState.doc, decorations);
            console.log(`[GRAMMAR HIGHLIGHT] DecorationSet created:`, newDecorationSet);
            return newDecorationSet;
          },
        },

        props: {
          decorations(state) {
            return grammarHighlightPluginKey.getState(state);
          },
          
          handleClick(view, pos, event) {
            const target = event.target as HTMLElement;
            
            // Position-based approach: find issues that contain the click position
            // ProseMirror positions are 1-based, issues use 0-based positions
            const clickPos = pos - 1; // Convert to 0-based
            
            // Find all issues that overlap with the clicked position
            const clickedIssues = extension.options.issues.filter(issue => {
              // Check if click position is within issue bounds
              if (issue.position) {
                return clickPos >= issue.position.start && clickPos <= issue.position.end;
              }
              return false;
            });
            
            console.log('[GRAMMAR CLICK] Position-based detection:', {
              clickPos,
              target: target.textContent?.substring(0, 20) + '...',
              foundIssues: clickedIssues.map(i => ({ 
                id: i.id, 
                text: i.originalText,
                type: i.type,
                start: i.position?.start,
                end: i.position?.end
              })),
              allIssues: extension.options.issues.length
            });
            
            // If we found issues at this position, use the first one (highest priority)
            if (clickedIssues.length > 0) {
              const issue = clickedIssues[0];
              console.log('[GRAMMAR CLICK] Selected issue:', issue);
              
              // Get the exact position of the clicked text for proper popup positioning
              const coords = view.coordsAtPos(pos);
              const position = {
                x: coords.left,
                y: coords.top - 10, // Position above the text
              };
              
              // Trigger the suggestion popup with the click position
              extension.options.onSuggestionClick(issue, pos, position);
              return true; // Prevent default click handling
            }
            
            console.log('[GRAMMAR CLICK] No issue found at position:', clickPos);
            return false;
          },
        },
      }),
    ];
  },

});

export default GrammarHighlightExtension;