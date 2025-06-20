import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { service } = await request.json();
    
    if (service === 'deepgram') {
      // Test Deepgram connection
      const response = await fetch('https://api.deepgram.com/v1/projects', {
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Deepgram test failed: ${response.status}`);
      }
      
      return NextResponse.json({ success: true, service: 'deepgram', message: 'Connection successful' });
    }
    
    if (service === 'elevenlabs') {
      // Test ElevenLabs connection
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        },
      });
      
      if (!response.ok) {
        throw new Error(`ElevenLabs test failed: ${response.status}`);
      }
      
      const data = await response.json();
      return NextResponse.json({ success: true, service: 'elevenlabs', voices: data.voices?.length || 0 });
    }
    
    if (service === 'openai') {
      // Test OpenAI connection
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI test failed: ${response.status}`);
      }
      
      return NextResponse.json({ success: true, service: 'openai', message: 'Connection successful' });
    }
    
    return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
    
  } catch (error) {
    console.error('[API TEST] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Test failed',
      service: request.nextUrl.searchParams.get('service')
    }, { status: 500 });
  }
}

export async function GET() {
  // Test all services
  const results = {
    deepgram: false,
    elevenlabs: false,
    openai: false,
  };
  
  try {
    // Test Deepgram
    const deepgramResponse = await fetch('https://api.deepgram.com/v1/projects', {
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
      },
    });
    results.deepgram = deepgramResponse.ok;
  } catch (error) {
    console.error('[API TEST] Deepgram error:', error);
  }
  
  try {
    // Test ElevenLabs
    const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
    });
    results.elevenlabs = elevenLabsResponse.ok;
  } catch (error) {
    console.error('[API TEST] ElevenLabs error:', error);
  }
  
  try {
    // Test OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });
    results.openai = openaiResponse.ok;
  } catch (error) {
    console.error('[API TEST] OpenAI error:', error);
  }
  
  return NextResponse.json({ 
    results,
    allConnected: Object.values(results).every(v => v === true)
  });
}