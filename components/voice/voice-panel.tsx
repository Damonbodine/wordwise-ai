"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useVoiceAssistantStore } from "@/stores/voice-assistant-store";
import { useVoiceRecording } from "@/hooks/use-voice-recording";
import { useDocumentStore } from "@/stores/document-store";
import { VoiceConversationService } from "@/services/voice-conversation-service";

interface VoicePanelProps {
  className?: string;
  isCollapsed?: boolean;
}

export function VoicePanel({ className, isCollapsed = false }: VoicePanelProps) {
  const [interimTranscript, setInterimTranscript] = useState("");
  
  // Voice assistant state
  const {
    isInitialized,
    isConnected,
    currentSession,
    messages,
    settings,
    connectionStatus,
    conversationSuggestions,
    error,
    initialize,
    startConversation,
    endConversation,
    setConversationSuggestions,
    clearError,
  } = useVoiceAssistantStore();

  // Document context
  const { activeDocument } = useDocumentStore();

  // Conversation service ref
  const conversationServiceRef = React.useRef<VoiceConversationService | null>(null);
  
  // Local state for button responsiveness
  const [isEnding, setIsEnding] = React.useState(false);

  // Audio recording
  const { state: recordingState, actions: recordingActions } = useVoiceRecording({
    onChunk: (chunk) => {
      // Send audio chunk to conversation service for real-time transcription
      if (conversationServiceRef.current) {
        conversationServiceRef.current.sendAudioChunk(chunk);
      }
      console.log('[VOICE PANEL] Audio chunk sent to conversation service:', chunk.data.byteLength, 'bytes');
    },
    onError: (error) => {
      console.error('[VOICE PANEL] Recording error:', error);
    },
  });

  // Initialize conversation service
  useEffect(() => {
    if (!conversationServiceRef.current) {
      // Note: API keys should be handled server-side for security
      // These are placeholder values - actual API calls go through server routes
      const conversationService = new VoiceConversationService({
        deepgramApiKey: '', // Handled server-side via /api/voice/* routes
        elevenLabsApiKey: '', // Handled server-side via /api/voice/* routes  
        openAiApiKey: '', // Handled server-side via /api/voice/* routes
        enableRealTimeFeedback: true,
      });

      // Set up conversation service callbacks
      conversationService.setEventCallbacks({
        onTranscript: (transcript, isFinal) => {
          console.log('[VOICE PANEL] Transcript:', transcript, 'Final:', isFinal);
          if (isFinal) {
            setInterimTranscript('');
          } else {
            setInterimTranscript(transcript);
          }
        },
        onError: (error) => {
          console.error('[VOICE PANEL] Conversation service error:', error);
        },
        onEvent: (event) => {
          console.log('[VOICE PANEL] Conversation event:', event);
        },
      });

      conversationServiceRef.current = conversationService;
    }

    // Cleanup on unmount
    return () => {
      if (conversationServiceRef.current) {
        conversationServiceRef.current.destroy();
      }
    };
  }, []);

  // Initialize voice assistant on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize('current-user'); // TODO: Get from auth store
    }
  }, [isInitialized, initialize]);

  // Handle conversation start
  const handleStartConversation = async () => {
    try {
      if (currentSession?.status === 'active') {
        await endConversation();
      }
      
      // Clear previous suggestions when starting new conversation
      setConversationSuggestions(null);
      
      const conversationId = await startConversation(activeDocument?.id);
      console.log('[VOICE PANEL] Conversation started:', conversationId);
      
      // Initialize and start conversation service
      if (conversationServiceRef.current) {
        const initialized = await conversationServiceRef.current.initialize();
        if (initialized) {
          await conversationServiceRef.current.startConversation();
        }
      }
      
      // Start recording
      const recordingStarted = await recordingActions.startRecording();
      if (!recordingStarted) {
        throw new Error('Failed to start recording');
      }
    } catch (error) {
      console.error('[VOICE PANEL] Failed to start conversation:', error);
    }
  };

  // Handle conversation end
  const handleEndConversation = async () => {
    if (isEnding) return; // Prevent double-clicks
    
    try {
      setIsEnding(true); // Immediately update button state
      
      await recordingActions.stopRecording();
      
      // End conversation service
      if (conversationServiceRef.current) {
        await conversationServiceRef.current.endConversation();
      }
      
      await endConversation();
      console.log('[VOICE PANEL] Conversation ended');
    } catch (error) {
      console.error('[VOICE PANEL] Failed to end conversation:', error);
    } finally {
      setIsEnding(false); // Reset local state
    }
  };

  // Handle recording toggle
  const handleToggleRecording = async () => {
    await recordingActions.toggleRecording();
  };

  // Request microphone permission
  const handleRequestPermission = async () => {
    const granted = await recordingActions.requestPermission();
    if (!granted) {
      console.warn('[VOICE PANEL] Microphone permission denied');
    }
  };

  // Format duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Connection status indicator
  const getConnectionStatus = () => {
    const allServices = Object.values(connectionStatus);
    const connectedCount = allServices.filter(status => status === 'connected').length;
    const errorCount = allServices.filter(status => status === 'error').length;
    
    if (errorCount > 0) return { status: 'error', color: 'bg-red-500' };
    if (connectedCount === allServices.length) return { status: 'connected', color: 'bg-green-500' };
    if (connectedCount > 0) return { status: 'partial', color: 'bg-yellow-500' };
    return { status: 'disconnected', color: 'bg-gray-500' };
  };

  const connectionInfo = getConnectionStatus();

  if (isCollapsed) {
    return (
      <div className={cn("flex flex-col items-center gap-2 p-2", className)}>
        {/* Collapsed view - just icon and status */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            🎤
          </div>
          {/* Connection status dot */}
          <div 
            className={cn(
              "absolute -top-1 -right-1 w-3 h-3 rounded-full",
              connectionInfo.color
            )}
          />
        </div>
        
        {recordingState.isRecording && (
          <div className="w-6 h-1 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary">
            🎤
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold leading-none">Voice Assistant</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">Writing Coach</span>
              <div 
                className={cn(
                  "w-2 h-2 rounded-full",
                  connectionInfo.color
                )}
                title={`Status: ${connectionInfo.status}`}
              />
            </div>
          </div>
        </div>
        
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-2">
          <Card className="p-3 bg-red-50 border-red-200">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm text-red-700">{error}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
              >
                ×
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 gap-4">
        {/* Document Context */}
        {activeDocument && (
          <Card className="p-3">
            <div className="text-sm text-muted-foreground mb-1">Current Document</div>
            <div className="font-medium text-sm">{activeDocument.title}</div>
            <div className="text-xs text-muted-foreground">
              {activeDocument.stats.wordCount} words
            </div>
          </Card>
        )}

        {/* Permission Check */}
        {!recordingState.hasPermission && (
          <Card className="p-4 text-center">
            <div className="text-sm text-muted-foreground mb-3">
              Microphone access is required for voice conversations
            </div>
            <Button 
              onClick={handleRequestPermission}
              size="sm"
              variant="secondary"
            >
              Grant Permission
            </Button>
          </Card>
        )}

        {/* Recording Controls */}
        {recordingState.hasPermission && (
          <div className="space-y-3">
            {/* Main Recording Button */}
            <div className="text-center">
              {(currentSession?.status === 'active' && !isEnding) ? (
                <Button
                  onClick={handleEndConversation}
                  variant="destructive"
                  size="lg"
                  className="w-full"
                  disabled={isEnding}
                >
                  {isEnding ? "Ending..." : "End Conversation"}
                </Button>
              ) : (
                <Button
                  onClick={handleStartConversation}
                  size="lg"
                  className="w-full"
                  disabled={!isInitialized || !recordingState.isSupported || isEnding}
                >
                  Start Voice Chat
                </Button>
              )}
            </div>

            {/* Recording Controls */}
            {currentSession?.status === 'active' && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={handleToggleRecording}
                  variant={recordingState.isRecording ? "secondary" : "primary"}
                  size="sm"
                >
                  {recordingState.isRecording ? "Pause" : "Resume"}
                </Button>
                
                {recordingState.isPaused && (
                  <Badge variant="secondary">Paused</Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Audio Level Indicator */}
        {recordingState.isRecording && (
          <Card className="p-3">
            <div className="text-sm text-muted-foreground mb-2">Audio Level</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all duration-100",
                  recordingState.audioLevel.isActive ? "bg-green-500" : "bg-gray-400"
                )}
                style={{ width: `${recordingState.audioLevel.volume}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {recordingState.audioLevel.isActive ? "Speaking" : "Quiet"}
            </div>
          </Card>
        )}

        {/* Conversation Duration */}
        {currentSession?.status === 'active' && (
          <div className="text-center">
            <div className="text-lg font-mono">
              {formatDuration(recordingState.duration)}
            </div>
            <div className="text-xs text-muted-foreground">
              Conversation time
            </div>
          </div>
        )}

        {/* Messages Preview */}
        {messages.length > 0 && (
          <div className="flex-1 min-h-0">
            <div className="text-sm text-muted-foreground mb-2">Conversation</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {messages.slice(-3).map((message) => (
                <Card key={message.id} className="p-2">
                  <div className="flex items-start gap-2">
                    <Badge 
                      variant={message.speaker === 'user' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {message.speaker === 'user' ? 'You' : 'AI'}
                    </Badge>
                    <div className="text-sm flex-1">
                      {message.content}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}


        {/* Help Text */}
        {!currentSession && !error && (
          <div className="text-center text-sm text-muted-foreground">
            {!activeDocument ? (
              "Open a document to start a writing conversation"
            ) : (
              "Click 'Start Voice Chat' to begin talking with your AI writing coach"
            )}
          </div>
        )}

        {/* Conversation Suggestions */}
        {conversationSuggestions && conversationSuggestions.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="text-sm font-medium text-foreground">
              Writing Suggestions from Last Conversation
            </div>
            <div className="space-y-3">
              {conversationSuggestions.map((suggestion, index) => (
                <Card key={index} className="p-3 bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                      suggestion.priority === 'high' ? 'bg-red-500' :
                      suggestion.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    )} />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-blue-900">
                        {suggestion.title}
                      </div>
                      <div className="text-xs text-blue-700 mt-1">
                        {suggestion.description}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-blue-100 text-blue-800"
                        >
                          {suggestion.type}
                        </Badge>
                        <Badge 
                          variant={
                            suggestion.priority === 'high' ? 'destructive' :
                            suggestion.priority === 'medium' ? 'default' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {suggestion.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}