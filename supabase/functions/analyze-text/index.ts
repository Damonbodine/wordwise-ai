import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyzeRequest {
  text: string
  documentId?: string
  analysisType?: 'full' | 'quick'
}

interface GrammarIssue {
  id: string
  type: 'spelling' | 'grammar' | 'style' | 'clarity' | 'engagement' | 'delivery'
  category: string
  severity: 'low' | 'medium' | 'high'
  message: string
  explanation: string
  position: {
    start: number
    end: number
  }
  originalText: string
  suggestedText: string
  confidence: number
}

interface AnalysisResponse {
  issues: GrammarIssue[]
  scores: {
    correctness: number
    clarity: number
    engagement: number
    delivery: number
    overall: number
  }
  metadata: {
    wordCount: number
    sentenceCount: number
    readingTime: number
    analysisTime: number
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()
    
    // Get the Groq API key from environment variables
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured')
    }

    // Parse request body
    const { text, documentId, analysisType = 'quick' } = await req.json() as AnalyzeRequest

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare the prompt for Groq
    const systemPrompt = `You are an advanced grammar and writing assistant. Analyze the given text for grammar, spelling, style, clarity, engagement, and delivery issues. 

Return a JSON response with the following structure:
{
  "issues": [
    {
      "type": "spelling|grammar|style|clarity|engagement|delivery",
      "category": "Specific category name",
      "severity": "low|medium|high",
      "message": "Brief description of the issue",
      "explanation": "Detailed explanation of why this is an issue",
      "originalText": "The problematic text",
      "suggestedText": "The corrected text",
      "startIndex": number,
      "endIndex": number,
      "confidence": 0.0-1.0
    }
  ],
  "scores": {
    "correctness": 0-100,
    "clarity": 0-100,
    "engagement": 0-100,
    "delivery": 0-100
  },
  "analysis": {
    "tone": "formal|informal|neutral|academic|conversational",
    "readabilityLevel": "elementary|middle|high|college|graduate",
    "mainIssues": ["list", "of", "main", "issues"]
  }
}

Focus on:
1. Grammar errors (subject-verb agreement, tense consistency, etc.)
2. Spelling mistakes
3. Punctuation errors
4. Style improvements (wordiness, passive voice, etc.)
5. Clarity issues (ambiguous pronouns, unclear references)
6. Engagement (boring phrases, clichés)
7. Delivery (tone consistency, formality level)

Be specific about the position of issues in the text.`

    const userPrompt = `Analyze this text and provide grammar, style, and writing suggestions:\n\n"${text}"`

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Fast model for sub-2s inference
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: "json_object" }
      }),
    })

    if (!groqResponse.ok) {
      const error = await groqResponse.text()
      console.error('Groq API error:', error)
      throw new Error('Failed to analyze text')
    }

    const groqData = await groqResponse.json()
    const analysisResult = JSON.parse(groqData.choices[0].message.content)

    // Process the Groq response to match our format
    const issues: GrammarIssue[] = analysisResult.issues.map((issue: any, index: number) => ({
      id: `issue_${Date.now()}_${index}`,
      type: issue.type,
      category: issue.category,
      severity: issue.severity,
      message: issue.message,
      explanation: issue.explanation,
      position: {
        start: issue.startIndex,
        end: issue.endIndex
      },
      originalText: issue.originalText,
      suggestedText: issue.suggestedText,
      confidence: issue.confidence
    }))

    // Calculate metadata
    const words = text.trim().split(/\s+/).filter(w => w.length > 0)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const analysisTime = Date.now() - startTime

    // Prepare response
    const response: AnalysisResponse = {
      issues,
      scores: {
        correctness: analysisResult.scores.correctness,
        clarity: analysisResult.scores.clarity,
        engagement: analysisResult.scores.engagement,
        delivery: analysisResult.scores.delivery,
        overall: Math.round(
          (analysisResult.scores.correctness +
           analysisResult.scores.clarity +
           analysisResult.scores.engagement +
           analysisResult.scores.delivery) / 4
        )
      },
      metadata: {
        wordCount: words.length,
        sentenceCount: sentences.length,
        readingTime: Math.ceil(words.length / 200), // 200 words per minute
        analysisTime
      }
    }

    // Log analysis for monitoring
    console.log(`Text analyzed in ${analysisTime}ms, found ${issues.length} issues`)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})