"use client";

import * as React from "react";
import { Check, X, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GrammarIssue } from "@/stores/grammar-store";

interface GrammarSuggestionPopupProps {
  issue: GrammarIssue | null;
  position: { x: number; y: number } | null;
  onAccept: (issue: GrammarIssue) => void;
  onReject: (issue: GrammarIssue) => void;
  onClose: () => void;
  isVisible: boolean;
}

export function GrammarSuggestionPopup({
  issue,
  position,
  onAccept,
  onReject,
  onClose,
  isVisible
}: GrammarSuggestionPopupProps) {
  const popupRef = React.useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  // Close popup on Escape key
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, onClose]);
  

  if (!isVisible || !issue || !position) {
    return null;
  }

  const getIssueColor = (type: string) => {
    const colors = {
      spelling: 'text-red-700 bg-red-50 border-red-200',
      grammar: 'text-amber-700 bg-amber-50 border-amber-200',
      punctuation: 'text-red-700 bg-red-50 border-red-200',
      style: 'text-blue-700 bg-blue-50 border-blue-200',
      clarity: 'text-violet-700 bg-violet-50 border-violet-200',
      engagement: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      delivery: 'text-indigo-700 bg-indigo-50 border-indigo-200'
    };
    return colors[type as keyof typeof colors] || 'text-gray-700 bg-gray-50 border-gray-200';
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'spelling':
      case 'grammar':
      case 'punctuation':
        return '🔴';
      case 'clarity':
        return '💡';
      case 'style':
        return '✨';
      case 'engagement':
        return '🎯';
      case 'delivery':
        return '📢';
      default:
        return '📝';
    }
  };

  return (
    <div
      ref={popupRef}
      className="fixed z-50 animate-in fade-in-0 zoom-in-95"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 150}px`, // Position 150px above the click point
        transform: 'translateX(-50%)', // Center horizontally
      }}
    >
      <Card className="w-80 shadow-lg border border-border/50 bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4">
          {/* Header with Issue Type */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">{getIssueIcon(issue.type)}</span>
              <span className={cn(
                "inline-flex items-center px-2 py-1 rounded text-xs font-medium border",
                getIssueColor(issue.type)
              )}>
                {issue.category}
              </span>
              <span className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              )}>
                {issue.severity}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Issue Message */}
          <p className="text-sm font-medium text-foreground mb-2">
            {issue.message}
          </p>

          {/* Original vs Suggested Text */}
          <div className="space-y-2 mb-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Original:</div>
              <div className="bg-red-50 border-l-4 border-red-300 p-2 rounded text-sm">
                <span className="text-red-800 line-through">{issue.originalText}</span>
              </div>
            </div>
            
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Suggested:</div>
              <div className="bg-green-50 border-l-4 border-green-300 p-2 rounded text-sm">
                <span className="text-green-800 font-medium">{issue.suggestedText}</span>
              </div>
            </div>
          </div>

          {/* Explanation */}
          {issue.explanation && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">{issue.explanation}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onAccept(issue)}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-8"
              size="sm"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Accept
            </Button>
            <Button
              onClick={() => onReject(issue)}
              variant="ghost"
              className="flex-1 text-muted-foreground hover:text-foreground hover:bg-muted h-8"
              size="sm"
            >
              <X className="w-4 h-4 mr-1.5" />
              Dismiss
            </Button>
          </div>

          {/* Confidence Indicator */}
          <div className="mt-2 text-center">
            <span className="text-xs text-muted-foreground">
              {Math.round(issue.confidence * 100)}% confidence
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Arrow pointer */}
      <div 
        className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
      />
    </div>
  );
}