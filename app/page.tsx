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