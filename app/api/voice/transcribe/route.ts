import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Log audio file details for debugging
    console.log('[TRANSCRIBE API] Audio file details:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
    });
    
    // Skip empty or very small files
    if (audioFile.size < 500) {
      console.log('[TRANSCRIBE API] Skipping tiny audio file:', audioFile.size, 'bytes');
      return NextResponse.json({ 
        transcript: '',
        confidence: 0,
        metadata: { skipped: true, reason: 'File too small' }
      });
    }
    
    // Convert File to Buffer
    const audioBuffer = await audioFile.arrayBuffer();
    
    // Send to Deepgram for transcription using validated parameters
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&smart_format=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': audioFile.type || 'audio/wav',
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[TRANSCRIBE API] Deepgram error details:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
        audioFileSize: audioFile.size,
        audioFileType: audioFile.type
      });
      throw new Error(`Deepgram API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    // Extract transcript
    const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    const confidence = data.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;
    
    console.log('[TRANSCRIBE API] Transcription successful:', { 
      transcript: transcript.substring(0, 50) + '...', 
      confidence 
    });
    
    return NextResponse.json({ 
      transcript,
      confidence,
      metadata: data.metadata,
    });
    
  } catch (error) {
    console.error('[TRANSCRIBE API] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Transcription failed'
    }, { status: 500 });
  }
}