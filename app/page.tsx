"use client";

import * as React from "react";
import { Layout } from '@/components/layout/layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TextEditor, TextEditorRef } from '@/components/editor/text-editor'
import { DocumentHeader } from '@/components/editor/document-header'
import { GrammarSuggestions } from '@/components/grammar/grammar-suggestions'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useGrammarStore } from '@/stores/grammar-store'
import { useAuthStore } from '@/stores/auth-store'

function HomePage() {
  const { 
    issues, 
    isAnalyzing,
    acceptSuggestion, 
    rejectSuggestion
  } = useGrammarStore();

  const { user, profile } = useAuthStore();
  
  // Create ref for the text editor
  const textEditorRef = React.useRef<TextEditorRef>(null);
  
  // Handle accepting grammar suggestions
  const handleAcceptSuggestion = React.useCallback((replacement: { originalText: string; suggestedText: string }) => {
    if (textEditorRef.current) {
      const success = textEditorRef.current.applyTextReplacement(replacement);
      if (success) {
        console.log('[PAGE] Successfully applied grammar suggestion:', replacement.originalText, '→', replacement.suggestedText);
      } else {
        console.warn('[PAGE] Failed to apply grammar suggestion:', replacement);
      }
    } else {
      console.warn('[PAGE] TextEditor ref not available for applying suggestion');
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
        {/* Welcome Section - Compact */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Welcome to WordWise AI
          </h2>
          <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the future of writing with our intelligent assistant. 
            Create, edit, and perfect your content with AI-powered suggestions.
          </p>
        </div>

        {/* Text Editor Section */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <DocumentHeader />
          <CardContent className="p-0">
            <TextEditor 
              ref={textEditorRef}
              placeholder="Start writing your masterpiece here..." 
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Feature Cards - More Compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                Smart Grammar
              </CardTitle>
              <CardDescription className="text-xs">
                Advanced AI detects and corrects grammar mistakes in real-time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                Style Enhancement
              </CardTitle>
              <CardDescription className="text-xs">
                Improve clarity, tone, and readability with intelligent suggestions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                Real-time Analysis
              </CardTitle>
              <CardDescription className="text-xs">
                Get instant feedback as you type with lightning-fast processing
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomePage />
    </ProtectedRoute>
  );
} 