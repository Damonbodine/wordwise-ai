/**
 * VOICE CONVERSATION ORCHESTRATION SERVICE
 * 
 * Coordinates all voice assistant APIs (Deepgram, OpenAI, ElevenLabs)
 * for real-time conversation flow with document context awareness.
 */

import { useVoiceAssistantStore } from '@/stores/voice-assistant-store';
import { useDocumentStore } from '@/stores/document-store';
import type { VoiceContext, VoiceMessage } from '@/stores/voice-assistant-store';
import type { AudioChunk } from '@/services/audio-recording-service';
// Removed unused Deepgram WebSocket import - now using Web Speech API

export interface ConversationConfig {
  deepgramApiKey: string;
  elevenLabsApiKey: string;
  openAiApiKey: string;
  elevenLabsVoiceId?: string;
  maxConversationLength?: number;
  enableRealTimeFeedback?: boolean;
}

export interface ConversationEvent {
  type: 'user_speech_start' | 'user_speech_end' | 'ai_response_start' | 'ai_response_end' | 'error';
  timestamp: number;
  data?: any;
}

export class VoiceConversationService {
  private config: ConversationConfig;
  private isConnected = false;
  private conversationStartTime = 0;
  private currentTranscript = '';
  private audioContext: AudioContext | null = null;
  
  // Event callbacks
  private onEvent?: (event: ConversationEvent) => void;
  private onTranscript?: (transcript: string, isFinal: boolean) => void;
  private onAudioResponse?: (audioBuffer: ArrayBuffer) => void;
  private onError?: (error: Error) => void;

  constructor(config: ConversationConfig) {
    this.config = config;
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  async initialize(): Promise<boolean> {
    try {
      console.log('[CONVERSATION SERVICE] Initializing...');
      
      // Test API connections
      await this.testAPIConnections();
      
      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.isConnected = true;
      console.log('[CONVERSATION SERVICE] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[CONVERSATION SERVICE] Initialization failed:', error);
      this.onError?.(error as Error);
      return false;
    }
  }

  async startConversation(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }
      
      // Reset all conversation flags for new session
      this.conversationEnded = false;
      this.isEnding = false;
      
      // Clear any leftover audio sources
      this.activeAudioSources = [];
      
      // Conversation session started
      
      // Send greeting message
      await this.sendGreeting();
      
      this.conversationStartTime = Date.now();
      
      this.onEvent?.({
        type: 'ai_response_start',
        timestamp: Date.now(),
        data: { message: 'Conversation started' }
      });

      console.log('[CONVERSATION SERVICE] Conversation started');
      return true;
    } catch (error) {
      console.error('[CONVERSATION SERVICE] Failed to start conversation:', error);
      this.onError?.(error as Error);
      return false;
    }
  }

  async endConversation(): Promise<void> {
    // Prevent multiple simultaneous end calls
    if (this.isEnding) {
      console.log('[CONVERSATION SERVICE] Already ending conversation, ignoring duplicate call');
      return;
    }
    
    try {
      this.isEnding = true;
      
      // Mark conversation as ended to prevent audio chunk processing
      this.conversationEnded = true;
      
      // Stop all active audio sources
      this.activeAudioSources.forEach(source => {
        try {
          source.stop();
          source.disconnect();
        } catch (error) {
          // Source might already be stopped
        }
      });
      this.activeAudioSources = [];
      
      // Stop Web Speech API without auto-restart
      if (this.speechRecognition) {
        // Remove the onend handler to prevent auto-restart
        this.speechRecognition.onend = null;
        this.speechRecognition.stop();
        this.speechRecognition = null;
      }

      // Clean up Web Speech API

      // Process conversation for writing suggestions
      await this.finalizeConversation();

      this.onEvent?.({
        type: 'ai_response_end',
        timestamp: Date.now(),
        data: { message: 'Conversation ended' }
      });

      console.log('[CONVERSATION SERVICE] Conversation ended');
    } catch (error) {
      console.error('[CONVERSATION SERVICE] Failed to end conversation:', error);
      this.onError?.(error as Error);
    } finally {
      // Reset ending flag so new conversations can start
      this.isEnding = false;
    }
  }

  // Use Web Speech API for transcription (much simpler and reliable)
  private speechRecognition: any = null;
  private conversationEnded = false;
  private activeAudioSources: AudioBufferSourceNode[] = [];
  private isEnding = false;
  
  sendAudioChunk(chunk: AudioChunk): void {
    // Don't process audio chunks if conversation has ended
    if (this.conversationEnded) {
      console.log('[CONVERSATION SERVICE] Ignoring audio chunk - conversation ended');
      return;
    }
    
    // Start Web Speech API recognition if not already running
    if (!this.speechRecognition) {
      this.startWebSpeechRecognition();
    }
    
    console.log('[CONVERSATION SERVICE] Audio chunk received:', chunk.data.byteLength, 'bytes');
  }

  private startWebSpeechRecognition(): void {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Web Speech API not supported');
      }

      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = 'en-US';

      this.speechRecognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal && transcript.trim()) {
            console.log('[CONVERSATION SERVICE] Final transcript:', transcript);
            this.handleUserSpeech(transcript);
          } else if (transcript.trim()) {
            console.log('[CONVERSATION SERVICE] Interim transcript:', transcript);
            this.onTranscript?.(transcript, false);
          }
        }
      };

      this.speechRecognition.onerror = (event: any) => {
        console.error('[CONVERSATION SERVICE] Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Restart recognition after a brief pause
          setTimeout(() => {
            if (this.speechRecognition) {
              this.speechRecognition.start();
            }
          }, 1000);
        }
      };

      this.speechRecognition.onend = () => {
        console.log('[CONVERSATION SERVICE] Speech recognition ended, restarting...');
        // Restart recognition to keep it continuous
        setTimeout(() => {
          if (this.speechRecognition && !this.speechRecognition.recognition) {
            try {
              this.speechRecognition.start();
            } catch (error) {
              console.warn('[CONVERSATION SERVICE] Speech recognition already running, skipping restart');
            }
          }
        }, 500);
      };

      this.speechRecognition.start();
      console.log('[CONVERSATION SERVICE] Web Speech API started');
      
    } catch (error) {
      console.error('[CONVERSATION SERVICE] Failed to start Web Speech API:', error);
      this.onError?.(error as Error);
    }
  }

  // Convert WebM audio chunk to PCM format for Deepgram
  private async convertWebMToPCM(webmData: ArrayBuffer): Promise<ArrayBuffer | null> {
    try {
      if (!this.audioContext) {
        throw new Error('Audio context not available');
      }

      // Decode WebM audio data
      const audioBuffer = await this.audioContext.decodeAudioData(webmData.slice(0));
      
      // Convert to mono 16-bit PCM at 16kHz
      const sampleRate = 16000;
      const channels = 1;
      
      // Resample if needed
      let resampledBuffer = audioBuffer;
      if (audioBuffer.sampleRate !== sampleRate) {
        resampledBuffer = this.resampleAudio(audioBuffer, sampleRate);
      }
      
      // Convert to 16-bit PCM
      const pcmData = this.audioBufferToPCM16(resampledBuffer, channels);
      return pcmData;
      
    } catch (error) {
      console.error('[CONVERSATION SERVICE] Audio conversion failed:', error);
      return null;
    }
  }

  // Resample audio to target sample rate
  private resampleAudio(audioBuffer: AudioBuffer, targetSampleRate: number): AudioBuffer {
    const ratio = audioBuffer.sampleRate / targetSampleRate;
    const newLength = Math.round(audioBuffer.length / ratio);
    
    const newBuffer = this.audioContext!.createBuffer(
      audioBuffer.numberOfChannels,
      newLength,
      targetSampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = newBuffer.getChannelData(channel);
      
      for (let i = 0; i < newLength; i++) {
        const inputIndex = i * ratio;
        const inputIndexFloor = Math.floor(inputIndex);
        const inputIndexCeil = Math.min(inputIndexFloor + 1, inputData.length - 1);
        const fraction = inputIndex - inputIndexFloor;
        
        outputData[i] = inputData[inputIndexFloor] * (1 - fraction) + 
                       inputData[inputIndexCeil] * fraction;
      }
    }
    
    return newBuffer;
  }

  // Convert AudioBuffer to 16-bit PCM
  private audioBufferToPCM16(audioBuffer: AudioBuffer, channels: number): ArrayBuffer {
    const length = audioBuffer.length;
    const pcmData = new Int16Array(length * channels);
    
    if (channels === 1) {
      // Convert to mono by averaging all channels
      for (let i = 0; i < length; i++) {
        let sample = 0;
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          sample += audioBuffer.getChannelData(channel)[i];
        }
        sample /= audioBuffer.numberOfChannels;
        
        // Convert to 16-bit
        pcmData[i] = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
      }
    }
    
    return pcmData.buffer;
  }
  
  // Removed unused WebSocket transcript handling - now using Web Speech API

  // =============================================================================
  // CONVERSATION FLOW
  // =============================================================================

  private async finalizeConversation(): Promise<void> {
    try {
      const { messages } = useVoiceAssistantStore.getState();
      
      if (messages.length === 0) {
        console.log('[CONVERSATION SERVICE] No messages to process');
        return;
      }

      // Build full conversation transcript
      const transcript = messages
        .map(msg => `${msg.speaker === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');

      console.log('[CONVERSATION SERVICE] Processing conversation for writing suggestions...');
      
      // Get document context for analysis
      const documentContext = this.extractDocumentContext();
      
      // Call post-conversation analysis endpoint
      const response = await fetch('/api/voice/analyze-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          documentContext: {
            title: documentContext.title,
            content: documentContext.content,
            documentType: documentContext.documentType,
            wordCount: documentContext.wordCount
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const { suggestions, summary } = await response.json();
      
      // Store conversation summary and suggestions
      const { setConversationSummary, setConversationSuggestions } = useVoiceAssistantStore.getState();
      setConversationSummary(summary);
      setConversationSuggestions(suggestions);
      
      console.log('[CONVERSATION SERVICE] Conversation analysis complete:', {
        suggestionsCount: suggestions?.length || 0,
        summary: summary?.substring(0, 100) + '...'
      });
      
    } catch (error) {
      console.error('[CONVERSATION SERVICE] Failed to finalize conversation:', error);
      this.onError?.(error as Error);
    }
  }

  // =============================================================================
  // OPENAI INTEGRATION
  // =============================================================================

  private async handleUserSpeech(transcript: string): Promise<void> {
    try {
      this.onEvent?.({
        type: 'user_speech_end',
        timestamp: Date.now(),
        data: { transcript }
      });

      // Get document context
      const documentContext = this.extractDocumentContext();
      
      // Generate AI response
      const aiResponse = await this.generateAIResponse(transcript, documentContext);
      
      // Convert to speech
      await this.synthesizeSpeech(aiResponse);
      
      // Store message in voice store
      this.addMessageToStore('user', transcript);
      this.addMessageToStore('assistant', aiResponse);

    } catch (error) {
      console.error('[CONVERSATION SERVICE] Failed to handle user speech:', error);
      this.onError?.(error as Error);
    }
  }

  private async generateAIResponse(userMessage: string, context: VoiceContext): Promise<string> {
    try {
      this.updateConnectionStatus('openai', 'connecting');

      const documentContext = `
Title: "${context.title || 'No document'}"
Type: ${context.documentType || 'general'}
Word Count: ${context.wordCount || 0}
Content Summary: ${context.summary || 'No content'}`;
      
      const response = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          documentContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      this.updateConnectionStatus('openai', 'connected');
      return data.response;

    } catch (error) {
      console.error('[CONVERSATION SERVICE] Chat request failed:', error);
      this.updateConnectionStatus('openai', 'error');
      
      // Fallback response
      return "I'm having trouble processing that right now. Could you try rephrasing your question?";
    }
  }

  private buildSystemPrompt(context: VoiceContext): string {
    const basePrompt = `You are a helpful AI writing assistant integrated into WordWise AI. You're having a voice conversation with a user about their writing.

CONVERSATION GUIDELINES:
- Keep responses conversational and concise (2-3 sentences max)
- Focus on writing improvement suggestions
- Ask clarifying questions about their writing goals
- Provide specific, actionable advice
- Maintain a friendly, supportive tone
- This is a voice conversation, so respond naturally

USER'S DOCUMENT CONTEXT:`;

    if (!context.hasDocument) {
      return basePrompt + `
- No document is currently open
- Ask what they'd like to write about or help them get started`;
    }

    return basePrompt + `
- Title: "${context.title}"
- Type: ${context.documentType}
- Word Count: ${context.wordCount}
- Content Summary: ${context.summary}

Provide relevant writing suggestions based on this document content.`;
  }

  // =============================================================================
  // ELEVENLABS INTEGRATION
  // =============================================================================

  private async synthesizeSpeech(text: string): Promise<void> {
    try {
      this.updateConnectionStatus('elevenlabs', 'connecting');

      const voiceId = this.config.elevenLabsVoiceId || 'pNInz6obpgDQGcFmaJgB';
      
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Synthesis API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      this.updateConnectionStatus('elevenlabs', 'connected');
      
      // Play the audio
      await this.playAudio(audioBuffer);
      
      this.onAudioResponse?.(audioBuffer);

    } catch (error) {
      console.error('[CONVERSATION SERVICE] Speech synthesis failed:', error);
      this.updateConnectionStatus('elevenlabs', 'error');
      this.onError?.(error as Error);
    }
  }

  private async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    try {
      if (!this.audioContext) {
        throw new Error('Audio context not initialized');
      }

      const audioData = await this.audioContext.decodeAudioData(audioBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioData;
      source.connect(this.audioContext.destination);
      
      // Track this audio source so we can stop it if needed
      this.activeAudioSources.push(source);
      
      // Remove from tracking when it ends naturally
      source.onended = () => {
        const index = this.activeAudioSources.indexOf(source);
        if (index > -1) {
          this.activeAudioSources.splice(index, 1);
        }
      };
      
      this.onEvent?.({
        type: 'ai_response_start',
        timestamp: Date.now(),
        data: { duration: audioData.duration }
      });

      source.start(0);
      
      // Wait for audio to finish
      setTimeout(() => {
        this.onEvent?.({
          type: 'ai_response_end',
          timestamp: Date.now(),
        });
      }, audioData.duration * 1000);

    } catch (error) {
      console.error('[CONVERSATION SERVICE] Failed to play audio:', error);
      this.onError?.(error as Error);
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private async sendGreeting(): Promise<void> {
    const documentContext = this.extractDocumentContext();
    
    let greeting = "Hi! I'm your AI writing assistant. ";
    
    if (documentContext.hasDocument) {
      greeting += `I can see you're working on "${documentContext.title}". How can I help improve your writing today?`;
    } else {
      greeting += "I'm here to help with your writing. What would you like to work on?";
    }

    await this.synthesizeSpeech(greeting);
    this.addMessageToStore('assistant', greeting);
  }

  private extractDocumentContext(): VoiceContext {
    const { activeDocument } = useDocumentStore.getState();
    
    if (!activeDocument) {
      return {
        hasDocument: false,
        context: "User doesn't have any document open currently."
      };
    }

    // Summarize content if too long
    const content = activeDocument.plainText;
    const summary = content.length > 2000 
      ? content.substring(0, 500) + '...\n[Middle content omitted]\n...' + content.substring(content.length - 500)
      : content;

    // Infer document type from title and content
    const title = activeDocument.title.toLowerCase();
    let documentType: VoiceContext['documentType'] = 'other';
    
    if (title.includes('email') || title.includes('message')) documentType = 'email';
    else if (title.includes('essay') || title.includes('paper')) documentType = 'essay';
    else if (title.includes('report') || title.includes('analysis')) documentType = 'report';
    else if (title.includes('story') || title.includes('creative')) documentType = 'creative';
    else if (title.includes('notes') || title.includes('draft')) documentType = 'notes';

    return {
      hasDocument: true,
      documentId: activeDocument.id,
      title: activeDocument.title,
      wordCount: activeDocument.stats.wordCount,
      content: content,
      summary: summary,
      documentType,
      context: `Document "${activeDocument.title}" with ${activeDocument.stats.wordCount} words`,
      lastUpdated: activeDocument.updatedAt
    };
  }

  private addMessageToStore(speaker: 'user' | 'assistant', content: string): void {
    const { addMessage } = useVoiceAssistantStore.getState();
    addMessage({ speaker, content });
  }

  private updateConnectionStatus(service: 'deepgram' | 'elevenlabs' | 'openai', status: string): void {
    const { updateConnectionStatus } = useVoiceAssistantStore.getState();
    updateConnectionStatus(service, status);
  }

  private async testAPIConnections(): Promise<void> {
    try {
      const response = await fetch('/api/test-voice');
      if (!response.ok) {
        throw new Error('API test endpoint failed');
      }
      
      const data = await response.json();
      console.log('[CONVERSATION SERVICE] API test results:', data);
      
      // Update connection status based on results
      if (data.results) {
        this.updateConnectionStatus('openai', data.results.openai ? 'connected' : 'error');
        this.updateConnectionStatus('elevenlabs', data.results.elevenlabs ? 'connected' : 'error');
        this.updateConnectionStatus('deepgram', data.results.deepgram ? 'connected' : 'error');
      }
      
      if (!data.allConnected) {
        console.warn('[CONVERSATION SERVICE] Some APIs are not connected:', data.results);
      }
    } catch (error) {
      console.error('[CONVERSATION SERVICE] API test failed:', error);
      this.updateConnectionStatus('openai', 'error');
      this.updateConnectionStatus('elevenlabs', 'error');
      this.updateConnectionStatus('deepgram', 'error');
      throw error;
    }
  }

  // =============================================================================
  // EVENT MANAGEMENT
  // =============================================================================

  setEventCallbacks(callbacks: {
    onEvent?: (event: ConversationEvent) => void;
    onTranscript?: (transcript: string, isFinal: boolean) => void;
    onAudioResponse?: (audioBuffer: ArrayBuffer) => void;
    onError?: (error: Error) => void;
  }): void {
    this.onEvent = callbacks.onEvent;
    this.onTranscript = callbacks.onTranscript;
    this.onAudioResponse = callbacks.onAudioResponse;
    this.onError = callbacks.onError;
  }

  destroy(): void {
    // Stop Web Speech API
    if (this.speechRecognition) {
      this.speechRecognition.stop();
      this.speechRecognition = null;
    }
    
    // Cleanup complete
    
    if (this.audioContext) {
      this.audioContext.close();
    }

    console.log('[CONVERSATION SERVICE] Service destroyed');
  }
}