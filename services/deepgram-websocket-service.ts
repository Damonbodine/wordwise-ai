/**
 * DEEPGRAM WEBSOCKET STREAMING SERVICE
 * 
 * Real-time audio transcription using Deepgram's WebSocket API
 * Eliminates chunk corruption issues by streaming raw audio data
 */

export interface DeepgramWebSocketConfig {
  apiKey: string;
  model?: string;
  language?: string;
  punctuate?: boolean;
  smartFormat?: boolean;
  interimResults?: boolean;
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
}

export class DeepgramWebSocketService {
  private websocket: WebSocket | null = null;
  private config: DeepgramWebSocketConfig;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  
  // Callbacks
  private onTranscript?: (result: TranscriptionResult) => void;
  private onError?: (error: Error) => void;
  private onConnectionChange?: (connected: boolean) => void;

  constructor(config: DeepgramWebSocketConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        model: this.config.model || 'nova-2',
        language: this.config.language || 'en',
        punctuate: this.config.punctuate ? 'true' : 'false',
        smart_format: this.config.smartFormat ? 'true' : 'false',
        interim_results: this.config.interimResults ? 'true' : 'false',
        encoding: 'linear16',
        sample_rate: '16000',
        channels: '1'
      });

      const wsUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
      
      console.log('[DEEPGRAM WS] Connecting to:', wsUrl);
      
      this.websocket = new WebSocket(wsUrl, ['token', this.config.apiKey]);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        this.websocket!.onopen = () => {
          clearTimeout(timeout);
          console.log('[DEEPGRAM WS] Connected to Deepgram WebSocket');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startKeepAlive();
          this.onConnectionChange?.(true);
          resolve(true);
        };

        this.websocket!.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.websocket!.onerror = (error) => {
          clearTimeout(timeout);
          console.error('[DEEPGRAM WS] WebSocket error:', error);
          this.onError?.(new Error('WebSocket connection error'));
          reject(error);
        };

        this.websocket!.onclose = (event) => {
          clearTimeout(timeout);
          console.log('[DEEPGRAM WS] Connection closed:', event.code, event.reason);
          this.isConnected = false;
          this.stopKeepAlive();
          this.onConnectionChange?.(false);
          
          // Attempt reconnection if not manually closed
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              console.log(`[DEEPGRAM WS] Reconnection attempt ${this.reconnectAttempts}`);
              this.connect();
            }, 1000 * this.reconnectAttempts);
          }
        };
      });

    } catch (error) {
      console.error('[DEEPGRAM WS] Failed to connect:', error);
      this.onError?.(error as Error);
      return false;
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Log all message data for debugging
      console.log('[DEEPGRAM WS] Raw message:', data);
      
      // Handle transcription results
      if (data.channel?.alternatives?.[0]) {
        const alternative = data.channel.alternatives[0];
        const result: TranscriptionResult = {
          transcript: alternative.transcript || '',
          confidence: alternative.confidence || 0,
          isFinal: data.is_final || false,
          timestamp: Date.now()
        };

        console.log('[DEEPGRAM WS] Parsed result:', result);

        if (result.transcript.trim()) {
          console.log('[DEEPGRAM WS] Transcription:', result.transcript, 'Final:', result.isFinal);
          this.onTranscript?.(result);
        } else {
          console.log('[DEEPGRAM WS] Empty transcript, skipping');
        }
      } else {
        console.log('[DEEPGRAM WS] No alternatives in message');
      }
      
      // Handle metadata and other message types
      if (data.type) {
        console.log('[DEEPGRAM WS] Message type:', data.type);
      }
      
    } catch (error) {
      console.error('[DEEPGRAM WS] Failed to parse message:', error);
    }
  }

  sendAudioData(audioData: ArrayBuffer): void {
    if (!this.isConnected || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.warn('[DEEPGRAM WS] Cannot send audio - not connected');
      return;
    }

    try {
      this.websocket.send(audioData);
    } catch (error) {
      console.error('[DEEPGRAM WS] Failed to send audio data:', error);
      this.onError?.(error as Error);
    }
  }

  private startKeepAlive(): void {
    // Send keepalive every 8 seconds to prevent timeout
    this.keepAliveInterval = setInterval(() => {
      if (this.isConnected && this.websocket) {
        try {
          this.websocket.send(JSON.stringify({ type: 'KeepAlive' }));
          console.log('[DEEPGRAM WS] Sent KeepAlive');
        } catch (error) {
          console.error('[DEEPGRAM WS] Failed to send KeepAlive:', error);
        }
      }
    }, 8000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  finalize(): void {
    if (!this.isConnected || !this.websocket) {
      return;
    }

    try {
      // Send close stream message to finalize transcription
      this.websocket.send(JSON.stringify({ type: 'CloseStream' }));
      console.log('[DEEPGRAM WS] Sent CloseStream');
    } catch (error) {
      console.error('[DEEPGRAM WS] Failed to send CloseStream:', error);
    }
  }

  disconnect(): void {
    this.stopKeepAlive();
    
    if (this.websocket) {
      this.websocket.close(1000, 'Manual disconnect');
      this.websocket = null;
    }
    this.isConnected = false;
    this.onConnectionChange?.(false);
  }

  setCallbacks(callbacks: {
    onTranscript?: (result: TranscriptionResult) => void;
    onError?: (error: Error) => void;
    onConnectionChange?: (connected: boolean) => void;
  }): void {
    this.onTranscript = callbacks.onTranscript;
    this.onError = callbacks.onError;
    this.onConnectionChange = callbacks.onConnectionChange;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}