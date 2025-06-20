/**
 * AUDIO RECORDING SERVICE
 * 
 * Handles Web Audio API recording with real-time processing
 * and post-call analysis capabilities for voice assistant.
 * 
 * Features:
 * - Real-time audio chunks for Deepgram streaming
 * - Full conversation recording for post-call analysis
 * - Cross-browser compatibility with fallbacks
 * - Memory management for long recordings
 * - Audio level monitoring for UI feedback
 */

export interface AudioRecordingConfig {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  chunkSize: number; // milliseconds
}

export interface AudioChunk {
  data: ArrayBuffer;
  timestamp: number;
  duration: number;
}

export interface AudioLevel {
  volume: number;      // 0-100
  isActive: boolean;   // voice activity detection
}

export interface RecordingSession {
  id: string;
  startTime: number;
  chunks: AudioChunk[];
  duration: number;
  totalSize: number;
}

export class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  
  // Recording state
  private isRecording = false;
  private isPaused = false;
  private currentSession: RecordingSession | null = null;
  
  // Real-time processing
  private realtimeChunks: Blob[] = [];
  private fullConversationChunks: Blob[] = [];
  
  // Callbacks
  private onRealtimeChunk?: (chunk: AudioChunk) => void;
  private onAudioLevel?: (level: AudioLevel) => void;
  private onError?: (error: Error) => void;
  private onRecordingStateChange?: (isRecording: boolean, isPaused: boolean) => void;
  
  // Audio level monitoring
  private levelMonitoringInterval: NodeJS.Timeout | null = null;
  
  // Configuration
  private config: AudioRecordingConfig = {
    sampleRate: 16000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    chunkSize: 250, // 250ms chunks for real-time processing
  };

  constructor(config?: Partial<AudioRecordingConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.initializeAudioContext();
  }

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  private initializeAudioContext(): void {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        throw new Error('Web Audio API not supported');
      }
      
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
      });
      
      console.log('[AUDIO SERVICE] Audio context initialized');
    } catch (error) {
      console.error('[AUDIO SERVICE] Failed to initialize audio context:', error);
      this.onError?.(error as Error);
    }
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: this.config.channelCount,
          sampleRate: this.config.sampleRate,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          autoGainControl: this.config.autoGainControl,
        }
      });

      // Test successful, stop the stream
      stream.getTracks().forEach(track => track.stop());
      
      console.log('[AUDIO SERVICE] Microphone permission granted');
      return true;
    } catch (error) {
      console.error('[AUDIO SERVICE] Microphone permission denied:', error);
      this.onError?.(error as Error);
      return false;
    }
  }

  // =============================================================================
  // RECORDING CONTROL
  // =============================================================================

  async startRecording(): Promise<boolean> {
    try {
      if (this.isRecording) {
        console.warn('[AUDIO SERVICE] Already recording');
        return true;
      }

      // Initialize audio context if needed
      if (!this.audioContext) {
        this.initializeAudioContext();
      }

      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Get microphone stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: this.config.channelCount,
          sampleRate: this.config.sampleRate,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          autoGainControl: this.config.autoGainControl,
        }
      });

      // Set up audio analysis
      this.setupAudioAnalysis();

      // Set up MediaRecorder
      this.setupMediaRecorder();

      // Start recording session
      this.currentSession = {
        id: this.generateSessionId(),
        startTime: Date.now(),
        chunks: [],
        duration: 0,
        totalSize: 0,
      };

      // Clear previous recordings
      this.realtimeChunks = [];
      this.fullConversationChunks = [];

      // Start recording
      this.mediaRecorder!.start(this.config.chunkSize);
      this.isRecording = true;
      this.isPaused = false;

      // Start audio level monitoring
      this.startAudioLevelMonitoring();

      this.onRecordingStateChange?.(this.isRecording, this.isPaused);
      console.log('[AUDIO SERVICE] Recording started');
      
      return true;
    } catch (error) {
      console.error('[AUDIO SERVICE] Failed to start recording:', error);
      this.cleanup();
      this.onError?.(error as Error);
      return false;
    }
  }

  async stopRecording(): Promise<RecordingSession | null> {
    try {
      if (!this.isRecording) {
        console.warn('[AUDIO SERVICE] Not recording');
        return null;
      }

      return new Promise((resolve) => {
        if (!this.mediaRecorder) {
          resolve(null);
          return;
        }

        this.mediaRecorder.onstop = () => {
          this.isRecording = false;
          this.isPaused = false;
          
          // Update session duration
          if (this.currentSession) {
            this.currentSession.duration = Date.now() - this.currentSession.startTime;
          }

          this.stopAudioLevelMonitoring();
          this.cleanup();
          
          this.onRecordingStateChange?.(this.isRecording, this.isPaused);
          console.log('[AUDIO SERVICE] Recording stopped');
          
          resolve(this.currentSession);
        };

        this.mediaRecorder.stop();
      });
    } catch (error) {
      console.error('[AUDIO SERVICE] Failed to stop recording:', error);
      this.onError?.(error as Error);
      return null;
    }
  }

  pauseRecording(): void {
    if (!this.isRecording || this.isPaused) return;

    this.mediaRecorder?.pause();
    this.isPaused = true;
    this.stopAudioLevelMonitoring();
    
    this.onRecordingStateChange?.(this.isRecording, this.isPaused);
    console.log('[AUDIO SERVICE] Recording paused');
  }

  resumeRecording(): void {
    if (!this.isRecording || !this.isPaused) return;

    this.mediaRecorder?.resume();
    this.isPaused = false;
    this.startAudioLevelMonitoring();
    
    this.onRecordingStateChange?.(this.isRecording, this.isPaused);
    console.log('[AUDIO SERVICE] Recording resumed');
  }

  // =============================================================================
  // AUDIO ANALYSIS SETUP
  // =============================================================================

  private setupAudioAnalysis(): void {
    if (!this.audioContext || !this.stream) return;

    try {
      // Create audio analysis nodes
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      
      // Configure analyser
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Connect audio graph
      this.microphone.connect(this.analyser);
      
      console.log('[AUDIO SERVICE] Audio analysis setup complete');
    } catch (error) {
      console.error('[AUDIO SERVICE] Failed to setup audio analysis:', error);
    }
  }

  private setupMediaRecorder(): void {
    if (!this.stream) return;

    try {
      // Prioritize WAV for valid standalone chunks, fall back to others
      const mimeTypes = [
        'audio/wav',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error('No supported audio format found');
      }

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 16000, // 16kbps for voice
      });

      // Handle data chunks
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.handleAudioChunk(event.data);
        }
      };

      // Handle errors
      this.mediaRecorder.onerror = (event) => {
        console.error('[AUDIO SERVICE] MediaRecorder error:', event);
        this.onError?.(new Error('MediaRecorder error'));
      };

      console.log('[AUDIO SERVICE] MediaRecorder setup complete with:', selectedMimeType);
    } catch (error) {
      console.error('[AUDIO SERVICE] Failed to setup MediaRecorder:', error);
      throw error;
    }
  }

  private handleAudioChunk(blob: Blob): void {
    const timestamp = Date.now();
    
    // Store for real-time processing
    this.realtimeChunks.push(blob);
    
    // Store for full conversation
    this.fullConversationChunks.push(blob);

    // Update session
    if (this.currentSession) {
      this.currentSession.totalSize += blob.size;
      this.currentSession.chunks.push({
        data: new ArrayBuffer(0), // We'll convert when needed
        timestamp,
        duration: this.config.chunkSize,
      });
    }

    // Convert to ArrayBuffer for real-time processing
    this.convertBlobToArrayBuffer(blob).then((arrayBuffer) => {
      const audioChunk: AudioChunk = {
        data: arrayBuffer,
        timestamp,
        duration: this.config.chunkSize,
      };

      this.onRealtimeChunk?.(audioChunk);
    });
  }

  // =============================================================================
  // AUDIO LEVEL MONITORING
  // =============================================================================

  private startAudioLevelMonitoring(): void {
    if (!this.analyser) return;

    this.levelMonitoringInterval = setInterval(() => {
      this.updateAudioLevel();
    }, 100); // Update every 100ms
  }

  private stopAudioLevelMonitoring(): void {
    if (this.levelMonitoringInterval) {
      clearInterval(this.levelMonitoringInterval);
      this.levelMonitoringInterval = null;
    }
  }

  private updateAudioLevel(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate RMS (Root Mean Square) for volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength);
    const volume = Math.min(100, (rms / 255) * 100);

    // Simple voice activity detection
    const isActive = volume > 5; // Threshold for voice activity

    this.onAudioLevel?.({
      volume,
      isActive,
    });
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  async getFullConversationBlob(): Promise<Blob | null> {
    if (this.fullConversationChunks.length === 0) return null;

    return new Blob(this.fullConversationChunks, { 
      type: this.mediaRecorder?.mimeType || 'audio/webm' 
    });
  }

  async getRealtimeBlob(): Promise<Blob | null> {
    if (this.realtimeChunks.length === 0) return null;

    const blob = new Blob(this.realtimeChunks, { 
      type: this.mediaRecorder?.mimeType || 'audio/webm' 
    });
    
    // Clear realtime chunks after getting them
    this.realtimeChunks = [];
    
    return blob;
  }

  private async convertBlobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private cleanup(): void {
    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Disconnect audio nodes
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    // Stop monitoring
    this.stopAudioLevelMonitoring();

    console.log('[AUDIO SERVICE] Cleanup complete');
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  setCallbacks(callbacks: {
    onRealtimeChunk?: (chunk: AudioChunk) => void;
    onAudioLevel?: (level: AudioLevel) => void;
    onError?: (error: Error) => void;
    onRecordingStateChange?: (isRecording: boolean, isPaused: boolean) => void;
  }): void {
    this.onRealtimeChunk = callbacks.onRealtimeChunk;
    this.onAudioLevel = callbacks.onAudioLevel;
    this.onError = callbacks.onError;
    this.onRecordingStateChange = callbacks.onRecordingStateChange;
  }

  getRecordingState(): { isRecording: boolean; isPaused: boolean; duration: number } {
    const duration = this.currentSession 
      ? Date.now() - this.currentSession.startTime 
      : 0;
    
    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      duration,
    };
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  async destroy(): Promise<void> {
    if (this.isRecording) {
      await this.stopRecording();
    }
    
    this.cleanup();
    
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    console.log('[AUDIO SERVICE] Service destroyed');
  }

  // =============================================================================
  // BROWSER COMPATIBILITY CHECKS
  // =============================================================================

  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder &&
      (window.AudioContext || (window as any).webkitAudioContext)
    );
  }

  static getSupportedMimeTypes(): string[] {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];

    return types.filter(type => MediaRecorder.isTypeSupported(type));
  }
}