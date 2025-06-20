import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { transcript, documentContext } = await request.json();
    
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    // Build comprehensive prompt for conversation analysis
    const analysisPrompt = `You are an AI writing assistant analyzing a voice conversation between a user and AI about their writing. Based on the conversation, provide specific writing suggestions.

DOCUMENT CONTEXT:
Title: "${documentContext?.title || 'No document'}"
Type: ${documentContext?.documentType || 'general'}
Word Count: ${documentContext?.wordCount || 0}
Current Content: ${documentContext?.content?.substring(0, 1000) || 'No content'}...

CONVERSATION TRANSCRIPT:
${transcript}

ANALYSIS TASK:
Based on this conversation, provide:
1. A brief summary of what was discussed (2-3 sentences)
2. Specific, actionable writing suggestions that emerged from the conversation
3. Any follow-up actions the user should take

Format your response as JSON with this structure:
{
  "summary": "Brief summary of the conversation...",
  "suggestions": [
    {
      "type": "improvement", // "improvement", "structure", "clarity", "style"
      "title": "Specific suggestion title",
      "description": "Detailed explanation of what to improve",
      "priority": "high" // "high", "medium", "low"
    }
  ],
  "followUpActions": [
    "Action item 1",
    "Action item 2"
  ]
}

Provide practical, implementable suggestions that directly relate to the conversation content.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a writing analysis expert. Always respond with valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[ANALYZE CONVERSATION API] OpenAI error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisResult = data.choices[0]?.message?.content;
    
    if (!analysisResult) {
      throw new Error('No analysis result from OpenAI');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(analysisResult);
    } catch (parseError) {
      console.error('[ANALYZE CONVERSATION API] Failed to parse JSON:', analysisResult);
      // Fallback response
      parsedResult = {
        summary: "Conversation analysis completed, but formatting issue occurred.",
        suggestions: [{
          type: "improvement",
          title: "Review conversation notes",
          description: "Please review the conversation manually for writing insights.",
          priority: "medium"
        }],
        followUpActions: ["Review conversation transcript"]
      };
    }

    console.log('[ANALYZE CONVERSATION API] Analysis complete:', {
      suggestionsCount: parsedResult.suggestions?.length || 0,
      summary: parsedResult.summary?.substring(0, 100) + '...'
    });

    return NextResponse.json({
      summary: parsedResult.summary,
      suggestions: parsedResult.suggestions || [],
      followUpActions: parsedResult.followUpActions || [],
      metadata: {
        conversationLength: transcript.length,
        documentTitle: documentContext?.title,
        analysisTimestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[ANALYZE CONVERSATION API] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Analysis failed'
    }, { status: 500 });
  }
}