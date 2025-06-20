import { useRef, useEffect, useCallback, useState } from 'react';
import { AudioRecordingService, type AudioChunk, type AudioLevel, type RecordingSession } from '@/services/audio-recording-service';
import { useVoiceAssistantStore } from '@/stores/voice-assistant-store';

export interface UseVoiceRecordingConfig {
  autoStart?: boolean;
  onChunk?: (chunk: AudioChunk) => void;
  onError?: (error: Error) => void;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: AudioLevel;
  hasPermission: boolean;
  isSupported: boolean;
  error: string | null;
}

export interface VoiceRecordingActions {
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<RecordingSession | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  toggleRecording: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  getFullConversationBlob: () => Promise<Blob | null>;
}

/**
 * React hook for voice recording functionality
 * Integrates with VoiceAssistantStore and provides React-friendly API
 */
export function useVoiceRecording(config?: UseVoiceRecordingConfig): {
  state: VoiceRecordingState;
  actions: VoiceRecordingActions;
} {
  // Store integration
  const {
    isRecording: storeIsRecording,
    audioPermission,
    microphoneLevel,
    setRecording,
    setAudioPermission,
    setMicrophoneLevel,
    setError: setStoreError,
    error: storeError,
  } = useVoiceAssistantStore();

  // Local state
  const [localState, setLocalState] = useState({
    isPaused: false,
    duration: 0,
    audioLevel: { volume: 0, isActive: false } as AudioLevel,
    error: null as string | null,
  });

  // Refs for persistent objects
  const audioServiceRef = useRef<AudioRecordingService | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio service
  useEffect(() => {
    if (!AudioRecordingService.isSupported()) {
      setLocalState(prev => ({ 
        ...prev, 
        error: 'Audio recording not supported in this browser' 
      }));
      return;
    }

    const audioService = new AudioRecordingService({
      sampleRate: 16000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      chunkSize: 250, // 250ms chunks for real-time processing
    });

    // Set up callbacks
    audioService.setCallbacks({
      onRealtimeChunk: (chunk: AudioChunk) => {
        config?.onChunk?.(chunk);
      },
      
      onAudioLevel: (level: AudioLevel) => {
        setLocalState(prev => ({ ...prev, audioLevel: level }));
        setMicrophoneLevel(level.volume);
      },
      
      onError: (error: Error) => {
        const errorMessage = error.message;
        setLocalState(prev => ({ ...prev, error: errorMessage }));
        setStoreError(errorMessage);
        config?.onError?.(error);
      },
      
      onRecordingStateChange: (isRecording: boolean, isPaused: boolean) => {
        setRecording(isRecording);
        setLocalState(prev => ({ ...prev, isPaused }));
        
        if (isRecording && !isPaused) {
          startDurationCounter();
        } else {
          stopDurationCounter();
        }
      },
    });

    audioServiceRef.current = audioService;

    // Cleanup on unmount
    return () => {
      stopDurationCounter();
      audioService.destroy();
    };
  }, []);

  // Duration counter
  const startDurationCounter = useCallback(() => {
    if (durationIntervalRef.current) return;
    
    const startTime = Date.now();
    durationIntervalRef.current = setInterval(() => {
      const duration = Date.now() - startTime;
      setLocalState(prev => ({ ...prev, duration }));
    }, 100);
  }, []);

  const stopDurationCounter = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Actions
  const startRecording = useCallback(async (): Promise<boolean> => {
    if (!audioServiceRef.current) return false;

    try {
      setLocalState(prev => ({ ...prev, error: null }));
      setStoreError(null);
      
      const success = await audioServiceRef.current.startRecording();
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setLocalState(prev => ({ ...prev, error: errorMessage }));
      setStoreError(errorMessage);
      return false;
    }
  }, [setStoreError]);

  const stopRecording = useCallback(async (): Promise<RecordingSession | null> => {
    if (!audioServiceRef.current) return null;

    try {
      const session = await audioServiceRef.current.stopRecording();
      setLocalState(prev => ({ ...prev, duration: 0 }));
      return session;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop recording';
      setLocalState(prev => ({ ...prev, error: errorMessage }));
      setStoreError(errorMessage);
      return null;
    }
  }, [setStoreError]);

  const pauseRecording = useCallback(() => {
    if (!audioServiceRef.current) return;
    audioServiceRef.current.pauseRecording();
  }, []);

  const resumeRecording = useCallback(() => {
    if (!audioServiceRef.current) return;
    audioServiceRef.current.resumeRecording();
  }, []);

  const toggleRecording = useCallback(async () => {
    if (storeIsRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [storeIsRecording, startRecording, stopRecording]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!audioServiceRef.current) return false;

    try {
      const granted = await audioServiceRef.current.requestMicrophonePermission();
      setAudioPermission(granted ? 'granted' : 'denied');
      return granted;
    } catch (error) {
      setAudioPermission('denied');
      const errorMessage = error instanceof Error ? error.message : 'Permission denied';
      setLocalState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, [setAudioPermission]);

  const getFullConversationBlob = useCallback(async (): Promise<Blob | null> => {
    if (!audioServiceRef.current) return null;
    return audioServiceRef.current.getFullConversationBlob();
  }, []);

  // Auto-request permission on mount if needed
  useEffect(() => {
    if (audioPermission === 'unknown') {
      requestPermission();
    }
  }, [audioPermission, requestPermission]);

  // Auto-start if configured
  useEffect(() => {
    if (config?.autoStart && audioPermission === 'granted' && !storeIsRecording) {
      startRecording();
    }
  }, [config?.autoStart, audioPermission, storeIsRecording, startRecording]);

  // State object
  const state: VoiceRecordingState = {
    isRecording: storeIsRecording,
    isPaused: localState.isPaused,
    duration: localState.duration,
    audioLevel: localState.audioLevel,
    hasPermission: audioPermission === 'granted',
    isSupported: AudioRecordingService.isSupported(),
    error: localState.error || storeError,
  };

  // Actions object
  const actions: VoiceRecordingActions = {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    toggleRecording,
    requestPermission,
    getFullConversationBlob,
  };

  return { state, actions };
}

/**
 * Hook for monitoring audio levels without recording
 * Useful for microphone testing and setup
 */
export function useAudioLevelMonitor(): {
  audioLevel: AudioLevel;
  isSupported: boolean;
  startMonitoring: () => Promise<boolean>;
  stopMonitoring: () => void;
} {
  const [audioLevel, setAudioLevel] = useState<AudioLevel>({ volume: 0, isActive: false });
  const audioServiceRef = useRef<AudioRecordingService | null>(null);

  const startMonitoring = useCallback(async (): Promise<boolean> => {
    if (!AudioRecordingService.isSupported()) return false;

    try {
      const audioService = new AudioRecordingService();
      await audioService.requestMicrophonePermission();
      
      audioService.setCallbacks({
        onAudioLevel: setAudioLevel,
      });

      audioServiceRef.current = audioService;
      return true;
    } catch (error) {
      console.error('Failed to start audio monitoring:', error);
      return false;
    }
  }, []);

  const stopMonitoring = useCallback(() => {
    if (audioServiceRef.current) {
      audioServiceRef.current.destroy();
      audioServiceRef.current = null;
    }
    setAudioLevel({ volume: 0, isActive: false });
  }, []);

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    audioLevel,
    isSupported: AudioRecordingService.isSupported(),
    startMonitoring,
    stopMonitoring,
  };
}

/**
 * Hook for audio permission management
 */
export function useAudioPermission(): {
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  requestPermission: () => Promise<boolean>;
  isSupported: boolean;
} {
  const { audioPermission, setAudioPermission } = useVoiceAssistantStore();

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setAudioPermission('denied');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setAudioPermission('granted');
      return true;
    } catch (error) {
      setAudioPermission('denied');
      return false;
    }
  }, [setAudioPermission]);

  return {
    permission: audioPermission,
    requestPermission,
    isSupported: !!navigator.mediaDevices?.getUserMedia,
  };
}