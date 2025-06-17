import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `You are a grammar and writing assistant. Analyze the provided text and return ONLY a valid JSON array of grammar issues. Each issue should have exactly these fields:
- "type": one of "grammar", "spelling", "style", "punctuation"
- "message": brief description of the issue
- "originalText": the exact text that needs correction
- "suggestedText": your suggested replacement
- "startIndex": character position where the issue starts
- "endIndex": character position where the issue ends

Return ONLY the JSON array, no other text or formatting.`
          },
          {
            role: 'user',
            content: `Please analyze this text: "${text}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, await response.text());
      return NextResponse.json(
        { error: 'Analysis service unavailable' },
        { status: 503 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No analysis result' },
        { status: 500 }
      );
    }

    // Parse the JSON response from Groq
    let issues;
    try {
      issues = JSON.parse(content);
      if (!Array.isArray(issues)) {
        issues = [];
      }
    } catch (parseError) {
      console.error('Failed to parse Groq response:', parseError);
      issues = [];
    }

    return NextResponse.json({ issues });
  } catch (error) {
    console.error('Grammar analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}