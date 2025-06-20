"use client";

import * as React from "react";
import { Layout } from '@/components/layout/layout'
import { Card, CardContent } from '@/components/ui/card'
import { TextEditor, TextEditorRef } from '@/components/editor/text-editor'
import { DocumentHeader } from '@/components/editor/document-header'
import { GrammarSuggestions } from '@/components/grammar/grammar-suggestions'
import { useGrammarStore } from '@/stores/grammar-store'

/**
 * Debug page that bypasses authentication to test core functionality
 * Access via: http://localhost:3000/debug
 */
export default function DebugPage() {
  const { 
    issues, 
    isAnalyzing,
    acceptSuggestion, 
    rejectSuggestion
  } = useGrammarStore();
  
  // Create ref for the text editor
  const textEditorRef = React.useRef<TextEditorRef>(null);
  
  // Handle accepting grammar suggestions
  const handleAcceptSuggestion = React.useCallback((replacement: { originalText: string; suggestedText: string }) => {
    if (textEditorRef.current) {
      const success = textEditorRef.current.applyTextReplacement(replacement);
      if (success) {
        console.log('[DEBUG PAGE] Successfully applied grammar suggestion:', replacement.originalText, '→', replacement.suggestedText);
      } else {
        console.warn('[DEBUG PAGE] Failed to apply grammar suggestion:', replacement);
      }
    } else {
      console.warn('[DEBUG PAGE] TextEditor ref not available for applying suggestion');
    }
  }, []);

  return (
    <Layout 
      rightPanel={
        <GrammarSuggestions 
          onAcceptSuggestion={handleAcceptSuggestion}
        />
      }
    >
      <div className="space-y-6">
        {/* Debug Notice */}
        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Debug Mode</h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
            Authentication is bypassed. This page is for testing only.
          </p>
        </div>

        {/* Welcome Section */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            WordWise AI - Debug Mode
          </h2>
          <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
            Testing the editor without authentication
          </p>
        </div>

        {/* Text Editor Section */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <DocumentHeader />
          <CardContent className="p-0">
            <TextEditor 
              ref={textEditorRef}
              placeholder="Start writing to test the editor..." 
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}