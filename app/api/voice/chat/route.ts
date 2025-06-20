import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, documentContext } = await request.json();
    
    const systemPrompt = `You are a helpful AI writing assistant integrated into WordWise AI. You're having a voice conversation with a user about their writing.

CONVERSATION GUIDELINES:
- Keep responses conversational and concise (2-3 sentences max)
- Focus on writing improvement suggestions
- Ask clarifying questions about their writing goals
- Provide specific, actionable advice
- Maintain a friendly, supportive tone
- This is a voice conversation, so respond naturally

USER'S DOCUMENT CONTEXT:
${documentContext}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[VOICE CHAT API] OpenAI error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    return NextResponse.json({ response: aiResponse });
    
  } catch (error) {
    console.error('[VOICE CHAT API] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Chat request failed'
    }, { status: 500 });
  }
}