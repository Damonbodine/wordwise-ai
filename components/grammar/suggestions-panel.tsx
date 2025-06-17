"use client";

import * as React from "react";
import { Check, X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextIssue } from "@/services/grammar-service";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface SuggestionsPanelProps {
  issues: TextIssue[];
  isVisible?: boolean;
  onAcceptSuggestion: (issueId: string) => void;
  onRejectSuggestion: (issueId: string) => void;
  onToggleVisibility?: () => void;
  className?: string;
}

interface SuggestionCardProps {
  issue: TextIssue;
  onAccept: () => void;
  onReject: () => void;
}

// =============================================================================
// INDIVIDUAL SUGGESTION CARD COMPONENT
// =============================================================================

function SuggestionCard({ issue, onAccept, onReject }: SuggestionCardProps) {
  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'spelling':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'grammar':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'vocabulary':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'style':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return (
    <Card className="p-4 mb-3 border border-border hover:shadow-sm transition-shadow">
      {/* Category Badge and Message */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn(
            "inline-flex items-center px-2 py-1 rounded text-xs font-medium border",
            getCategoryColor(issue.type)
          )}>
            {issue.category}
          </span>
          <span className="text-xs" title={`Severity: ${issue.severity}`}>
            {getSeverityIcon(issue.severity)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {Math.round(issue.confidence * 100)}% confidence
        </div>
      </div>

      {/* Explanation */}
      {issue.message && (
        <p className="text-sm text-foreground mb-3 leading-relaxed">
          {issue.message}
        </p>
      )}

      {/* Original Text */}
      <div className="mb-2">
        <div className="text-xs font-medium text-muted-foreground mb-1">Original:</div>
        <div className="bg-red-50 border-l-4 border-red-300 p-2 rounded">
          <code className="text-sm text-red-800 bg-transparent">"{issue.originalText}"</code>
        </div>
      </div>

      {/* Suggested Text */}
      <div className="mb-4">
        <div className="text-xs font-medium text-muted-foreground mb-1">Suggested:</div>
        <div className="bg-green-50 border-l-4 border-green-300 p-2 rounded">
          <code className="text-sm text-green-800 bg-transparent">"{issue.suggestedText}"</code>
        </div>
      </div>

      {/* Additional Explanation */}
      {issue.explanation && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">{issue.explanation}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onAccept}
          className="flex-1 bg-black hover:bg-black/90 text-white"
          size="sm"
        >
          <Check className="w-4 h-4 mr-2" />
          Accept
        </Button>
        <Button
          onClick={onReject}
          variant="ghost"
          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          size="sm"
        >
          <X className="w-4 h-4 mr-2" />
          Reject
        </Button>
      </div>
    </Card>
  );
}

// =============================================================================
// MAIN SUGGESTIONS PANEL COMPONENT
// =============================================================================

export function SuggestionsPanel({
  issues,
  isVisible = true,
  onAcceptSuggestion,
  onRejectSuggestion,
  onToggleVisibility,
  className
}: SuggestionsPanelProps) {
  const [collapsedCategories, setCollapsedCategories] = React.useState<Set<string>>(new Set());

  // Group issues by category
  const groupedIssues = React.useMemo(() => {
    const groups: Record<string, TextIssue[]> = {};
    
    issues.forEach(issue => {
      const category = issue.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(issue);
    });

    return groups;
  }, [issues]);

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  const totalIssues = issues.length;
  const hasIssues = totalIssues > 0;

  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn(
      "w-full h-full bg-background border-l border-border flex flex-col max-h-screen",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Suggestions</h3>
          {hasIssues && (
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-black rounded-full">
              {totalIssues}
            </span>
          )}
        </div>
        {onToggleVisibility && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleVisibility}
            className="w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!hasIssues ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-medium text-foreground mb-2">Great writing!</h4>
            <p className="text-sm text-muted-foreground">
              No grammar or spelling issues found in your text.
            </p>
          </div>
        ) : (
          // Issues List
          <div className="p-4">
            {Object.entries(groupedIssues).map(([category, categoryIssues]) => (
              <div key={category} className="mb-6">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center justify-between w-full p-2 text-left hover:bg-muted/50 rounded-md transition-colors mb-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{category}</span>
                    <span className="text-xs text-muted-foreground">
                      ({categoryIssues.length})
                    </span>
                  </div>
                  <span className={cn(
                    "text-xs transition-transform",
                    collapsedCategories.has(category) ? "rotate-180" : "rotate-0"
                  )}>
                    ▼
                  </span>
                </button>

                {/* Category Issues */}
                {!collapsedCategories.has(category) && (
                  <div className="space-y-3">
                    {categoryIssues.map(issue => (
                      <SuggestionCard
                        key={issue.id}
                        issue={issue}
                        onAccept={() => onAcceptSuggestion(issue.id)}
                        onReject={() => onRejectSuggestion(issue.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Quick Stats */}
      {hasIssues && (
        <div className="border-t border-border p-4 bg-muted/30">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-semibold text-red-600">
                {issues.filter(i => i.type === 'spelling').length}
              </div>
              <div className="text-xs text-muted-foreground">Spelling</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {issues.filter(i => i.type === 'grammar').length}
              </div>
              <div className="text-xs text-muted-foreground">Grammar</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">
                {issues.filter(i => i.type === 'style' || i.type === 'vocabulary').length}
              </div>
              <div className="text-xs text-muted-foreground">Style</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}