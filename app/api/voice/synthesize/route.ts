import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId = 'pNInz6obpgDQGcFmaJgB' } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        output_format: 'mp3_44100_64',
        voice_settings: {
          stability: 0.8,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[VOICE SYNTHESIZE API] ElevenLabs error:', error);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    
    // Return as audio response
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
    
  } catch (error) {
    console.error('[VOICE SYNTHESIZE API] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Synthesis request failed'
    }, { status: 500 });
  }
}