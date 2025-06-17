'use client';

import React from 'react';
import { useGrammarStore } from '@/stores/grammar-store';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  MoreHorizontal,
  AlertCircle,
  Lightbulb,
  Target,
  Megaphone,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { groqGrammarService } from '@/services/groq-grammar-service';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface GrammarSuggestionsProps {
  onAcceptSuggestion?: (replacement: { originalText: string; suggestedText: string }) => void;
}

// =============================================================================
// GRAMMAR SUGGESTIONS COMPONENT
// =============================================================================

export const GrammarSuggestions: React.FC<GrammarSuggestionsProps> = ({
  onAcceptSuggestion
}) => {
  const {
    issues,
    scores,
    isAnalyzing,
    selectedIssueId,
    selectIssue,
    acceptSuggestion,
    rejectSuggestion,
    getVisibleIssues
  } = useGrammarStore();

  const visibleIssues = getVisibleIssues();
  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  // Handle accepting a suggestion
  const handleAccept = (issueId: string) => {
    const replacement = acceptSuggestion(issueId);
    if (replacement && onAcceptSuggestion) {
      onAcceptSuggestion(replacement);
    }
  };

  // Get icon for issue type
  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'spelling':
      case 'grammar':
        return <AlertCircle className="h-4 w-4" />;
      case 'clarity':
        return <Lightbulb className="h-4 w-4" />;
      case 'engagement':
        return <Target className="h-4 w-4" />;
      case 'delivery':
        return <Megaphone className="h-4 w-4" />;
      case 'style':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  // Get color for issue type (category-based color coding)
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'spelling':
      case 'grammar':
      case 'punctuation':
        return 'text-red-700 bg-red-50 border-red-200'; // Correctness = Red
      case 'clarity':
        return 'text-blue-700 bg-blue-50 border-blue-200'; // Clarity = Blue
      case 'engagement':
        return 'text-purple-700 bg-purple-50 border-purple-200'; // Engagement = Purple
      case 'delivery':
        return 'text-green-700 bg-green-50 border-green-200'; // Delivery = Green
      case 'style':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200'; // Style = Indigo
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get severity color (intensity-based within category)
  const getSeverityColor = (severity: string, type: string) => {
    const baseColor = getTypeColor(type);
    
    switch (severity) {
      case 'high':
        return baseColor; // Full intensity
      case 'medium':
        return baseColor.replace('-700', '-600').replace('-50', '-25'); // Medium intensity
      case 'low':
        return baseColor.replace('-700', '-500').replace('-50', '-25'); // Lower intensity
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Overall Score */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Overall Score</h3>
          <span className="text-2xl font-bold">{scores.overall}</span>
        </div>
        <Progress value={scores.overall} className="h-2" />
      </div>

      {/* Score Categories */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Correctness</span>
            <span className="text-sm font-medium">{scores.correctness}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Clarity</span>
            <span className="text-sm font-medium">{scores.clarity}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Engagement</span>
            <span className="text-sm font-medium">{scores.engagement}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Delivery</span>
            <span className="text-sm font-medium">{scores.delivery}</span>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="all" className="h-full">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="correctness" className="text-xs">Correctness</TabsTrigger>
              <TabsTrigger value="clarity" className="text-xs">Clarity</TabsTrigger>
              <TabsTrigger value="engagement" className="text-xs">Engagement</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="p-4 space-y-3">
            {isAnalyzing ? (
              <div className="text-center py-8">
                <div className="animate-pulse">
                  <p className="text-sm text-muted-foreground">Analyzing text...</p>
                </div>
              </div>
            ) : visibleIssues.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Great writing!</p>
                <p className="text-xs text-muted-foreground">No issues found</p>
              </div>
            ) : (
              visibleIssues.map((issue) => (
                <Card
                  key={issue.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedIssueId === issue.id && "ring-2 ring-primary"
                  )}
                  onClick={() => selectIssue(issue.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "p-1 rounded",
                          getSeverityColor(issue.severity, issue.type)
                        )}>
                          {getIssueIcon(issue.type)}
                        </div>
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {issue.category}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {issue.message}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          getSeverityColor(issue.severity, issue.type)
                        )}
                      >
                        {issue.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  {selectedIssueId === issue.id && (
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="p-2 bg-muted rounded text-sm">
                          <p className="font-medium mb-1">Original:</p>
                          <p className="text-red-600 line-through">{issue.originalText}</p>
                        </div>
                        
                        <div className="p-2 bg-muted rounded text-sm">
                          <p className="font-medium mb-1">Suggested:</p>
                          <p className="text-green-600">{issue.suggestedText}</p>
                        </div>
                        
                        {issue.explanation && (
                          <p className="text-xs text-muted-foreground">
                            {issue.explanation}
                          </p>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAccept(issue.id);
                            }}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              rejectSuggestion(issue.id);
                            }}
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="correctness" className="p-4 space-y-3">
            {visibleIssues
              .filter(i => i.type === 'spelling' || i.type === 'grammar')
              .length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">Perfect grammar!</p>
                  <p className="text-xs text-muted-foreground">No correctness issues found</p>
                </div>
              ) : (
                visibleIssues
                  .filter(i => i.type === 'spelling' || i.type === 'grammar')
                  .map(issue => (
                    <Card
                      key={issue.id}
                      className={cn(
                        "cursor-pointer transition-all",
                        selectedIssueId === issue.id && "ring-2 ring-primary"
                      )}
                      onClick={() => selectIssue(issue.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "p-1 rounded",
                              getSeverityColor(issue.severity, issue.type)
                            )}>
                              {getIssueIcon(issue.type)}
                            </div>
                            <div>
                              <CardTitle className="text-sm font-medium">
                                {issue.category}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground mt-1">
                                {issue.message}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              getSeverityColor(issue.severity, issue.type)
                            )}
                          >
                            {issue.severity}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      {selectedIssueId === issue.id && (
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="p-2 bg-muted rounded text-sm">
                              <p className="font-medium mb-1">Original:</p>
                              <p className="text-red-600 line-through">{issue.originalText}</p>
                            </div>
                            
                            <div className="p-2 bg-muted rounded text-sm">
                              <p className="font-medium mb-1">Suggested:</p>
                              <p className="text-green-600">{issue.suggestedText}</p>
                            </div>
                            
                            {issue.explanation && (
                              <p className="text-xs text-muted-foreground">
                                {issue.explanation}
                              </p>
                            )}
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAccept(issue.id);
                                }}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rejectSuggestion(issue.id);
                                }}
                              >
                                Dismiss
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))
              )}
          </TabsContent>

          <TabsContent value="clarity" className="p-4 space-y-3">
            {visibleIssues
              .filter(i => i.type === 'clarity' || i.type === 'style')
              .length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">Crystal clear!</p>
                  <p className="text-xs text-muted-foreground">No clarity issues found</p>
                </div>
              ) : (
                visibleIssues
                  .filter(i => i.type === 'clarity' || i.type === 'style')
                  .map(issue => (
                    <Card
                      key={issue.id}
                      className={cn(
                        "cursor-pointer transition-all",
                        selectedIssueId === issue.id && "ring-2 ring-primary"
                      )}
                      onClick={() => selectIssue(issue.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "p-1 rounded",
                              getSeverityColor(issue.severity, issue.type)
                            )}>
                              {getIssueIcon(issue.type)}
                            </div>
                            <div>
                              <CardTitle className="text-sm font-medium">
                                {issue.category}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground mt-1">
                                {issue.message}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              getSeverityColor(issue.severity, issue.type)
                            )}
                          >
                            {issue.severity}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      {selectedIssueId === issue.id && (
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="p-2 bg-muted rounded text-sm">
                              <p className="font-medium mb-1">Original:</p>
                              <p className="text-red-600 line-through">{issue.originalText}</p>
                            </div>
                            
                            <div className="p-2 bg-muted rounded text-sm">
                              <p className="font-medium mb-1">Suggested:</p>
                              <p className="text-green-600">{issue.suggestedText}</p>
                            </div>
                            
                            {issue.explanation && (
                              <p className="text-xs text-muted-foreground">
                                {issue.explanation}
                              </p>
                            )}
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAccept(issue.id);
                                }}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rejectSuggestion(issue.id);
                                }}
                              >
                                Dismiss
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))
              )}
          </TabsContent>

          <TabsContent value="engagement" className="p-4 space-y-3">
            {visibleIssues
              .filter(i => i.type === 'engagement' || i.type === 'delivery')
              .length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">Highly engaging!</p>
                  <p className="text-xs text-muted-foreground">No engagement issues found</p>
                </div>
              ) : (
                visibleIssues
                  .filter(i => i.type === 'engagement' || i.type === 'delivery')
                  .map(issue => (
                    <Card
                      key={issue.id}
                      className={cn(
                        "cursor-pointer transition-all",
                        selectedIssueId === issue.id && "ring-2 ring-primary"
                      )}
                      onClick={() => selectIssue(issue.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "p-1 rounded",
                              getSeverityColor(issue.severity, issue.type)
                            )}>
                              {getIssueIcon(issue.type)}
                            </div>
                            <div>
                              <CardTitle className="text-sm font-medium">
                                {issue.category}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground mt-1">
                                {issue.message}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              getSeverityColor(issue.severity, issue.type)
                            )}
                          >
                            {issue.severity}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      {selectedIssueId === issue.id && (
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="p-2 bg-muted rounded text-sm">
                              <p className="font-medium mb-1">Original:</p>
                              <p className="text-red-600 line-through">{issue.originalText}</p>
                            </div>
                            
                            <div className="p-2 bg-muted rounded text-sm">
                              <p className="font-medium mb-1">Suggested:</p>
                              <p className="text-green-600">{issue.suggestedText}</p>
                            </div>
                            
                            {issue.explanation && (
                              <p className="text-xs text-muted-foreground">
                                {issue.explanation}
                              </p>
                            )}
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAccept(issue.id);
                                }}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rejectSuggestion(issue.id);
                                }}
                              >
                                Dismiss
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))
              )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};