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
import { useGrammarStore } from "@/stores/grammar-store";
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
  
  // Grammar analysis context
  const { issues, scores, isAnalyzing } = useGrammarStore();

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

  // Document analysis helpers
  const getDocumentProgress = () => {
    if (!activeDocument) return null;
    
    const wordCount = activeDocument.stats.wordCount;
    const estimatedTarget = 500; // Default target, could be made configurable
    const progress = Math.min((wordCount / estimatedTarget) * 100, 100);
    
    return {
      current: wordCount,
      target: estimatedTarget,
      percentage: progress,
      isComplete: progress >= 100
    };
  };

  const getWritingVelocity = () => {
    if (!activeDocument?.updatedAt) return null;
    
    const hoursAgo = (Date.now() - new Date(activeDocument.updatedAt).getTime()) / (1000 * 60 * 60);
    if (hoursAgo > 24) return null; // Only show recent velocity
    
    const wordsPerHour = hoursAgo > 0 ? Math.round(activeDocument.stats.wordCount / hoursAgo) : 0;
    return wordsPerHour;
  };

  const getDocumentType = () => {
    if (!activeDocument) return 'document';
    
    // Simple heuristics for document type detection
    const title = activeDocument.title.toLowerCase();
    const wordCount = activeDocument.stats.wordCount;
    
    if (title.includes('email') || title.includes('letter')) return 'document';
    if (title.includes('essay') || title.includes('paper')) return 'essay';
    if (title.includes('report') || title.includes('analysis')) return 'report';
    if (title.includes('story') || title.includes('creative')) return 'creative';
    if (wordCount < 200) return 'notes';
    if (wordCount > 1000) return 'long-form';
    
    return 'document';
  };

  const getReadingTime = () => {
    if (!activeDocument) return 0;
    return Math.ceil(activeDocument.stats.wordCount / 200); // 200 WPM average
  };

  const getGrammarSummary = () => {
    const activeIssues = issues.length; // issues array already contains only visible (non-resolved) issues
    const overallScore = scores.overall;
    
    return {
      issueCount: activeIssues,
      overallScore,
      hasIssues: activeIssues > 0,
      scoreColor: overallScore >= 90 ? 'text-green-600' : 
                 overallScore >= 70 ? 'text-yellow-600' : 'text-red-600'
    };
  };

  const getConversationStarters = () => {
    if (!activeDocument) return [];
    
    const grammarSummary = getGrammarSummary();
    const progress = getDocumentProgress();
    const docType = getDocumentType();
    const starters = [];

    // Priority suggestions based on document state
    if (grammarSummary.hasIssues) {
      starters.push({
        icon: "✏️",
        title: "Review Grammar & Style",
        description: `Let's address ${grammarSummary.issueCount} suggestions to improve clarity`,
        priority: "high",
        context: "grammar_review"
      });
    }

    if (progress && progress.percentage < 50) {
      starters.push({
        icon: "📝",
        title: "Develop Your Ideas",
        description: `Let's expand on your ${docType} and build stronger arguments`,
        priority: "high", 
        context: "content_development"
      });
    }

    // Document-specific suggestions
    if (docType === 'essay' || docType === 'report') {
      starters.push({
        icon: "🏗️",
        title: "Strengthen Structure",
        description: "Let's discuss organization, transitions, and logical flow",
        priority: "medium",
        context: "structure"
      });
    }

    if (activeDocument?.title.toLowerCase().includes('email') || activeDocument?.title.toLowerCase().includes('letter')) {
      starters.push({
        icon: "🎯",
        title: "Perfect Your Tone",
        description: "Let's ensure your message matches your intended audience",
        priority: "medium",
        context: "tone_audience"
      });
    }

    // General coaching options
    starters.push(
      {
        icon: "💡",
        title: "Brainstorm Ideas",
        description: "Stuck? Let's explore new angles and perspectives",
        priority: "low",
        context: "brainstorming"
      },
      {
        icon: "🔍",
        title: "Final Review",
        description: "Ready to polish? Let's do a comprehensive review",
        priority: progress?.percentage > 80 ? "medium" : "low",
        context: "final_review"
      }
    );

    return starters.slice(0, 4); // Show top 4 suggestions
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
    const grammarSummary = getGrammarSummary();
    
    return (
      <div className={cn("flex flex-col items-center gap-2 p-3", className)}>
        {/* Enhanced Collapsed Coach Avatar */}
        <div className="relative">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
            currentSession?.status === 'active' ? "bg-green-100 animate-pulse" : "bg-blue-100",
            grammarSummary.hasIssues ? "ring-2 ring-orange-300" : ""
          )}>
            <span className="text-lg">
              {currentSession?.status === 'active' ? "🎯" : 
               connectionInfo.status === 'connected' ? "🤖" : 
               connectionInfo.status === 'error' ? "😕" : "💭"}
            </span>
          </div>
          
          {/* Multi-layered Status Indicators */}
          <div 
            className={cn(
              "absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-300",
              connectionInfo.color,
              currentSession?.status === 'active' && "animate-pulse"
            )}
            title={`Connection: ${connectionInfo.status}`}
          />
          
          {/* Grammar Issues Indicator */}
          {grammarSummary.hasIssues && !currentSession && (
            <div 
              className="absolute -bottom-1 -left-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white font-bold"
              title={`${grammarSummary.issueCount} grammar suggestions`}
            >
              {grammarSummary.issueCount}
            </div>
          )}
        </div>
        
        {/* Activity Indicators */}
        {recordingState.isRecording && (
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-1 bg-red-500 rounded-full animate-pulse" />
            <div className="text-xs text-red-600 font-medium">Live</div>
          </div>
        )}
        
        {/* Quick Stats */}
        {activeDocument && !currentSession && (
          <div className="text-center">
            <div className="text-xs font-medium text-blue-700">
              {grammarSummary.overallScore}%
            </div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
        )}
        
        {/* Pulsing "Ready" indicator when available */}
        {!currentSession && activeDocument && connectionInfo.status === 'connected' && (
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75" />
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Compact Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          {/* Compact Coach Avatar */}
          <div className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300",
            currentSession?.status === 'active' ? "bg-green-100" : "bg-blue-100"
          )}>
            <span className="text-sm">
              {currentSession?.status === 'active' ? "🎯" : 
               connectionInfo.status === 'connected' ? "🤖" : 
               connectionInfo.status === 'error' ? "😕" : "💭"}
            </span>
          </div>
          
          <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Writing Coach
          </h2>
          
          {/* Inline Status Indicator */}
          <div 
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              connectionInfo.color,
              currentSession?.status === 'active' && "animate-pulse"
            )}
            title={`Status: ${connectionInfo.status}`}
          />
        </div>
        
        {/* Quick Stats Badge */}
        {activeDocument && (
          <Badge variant="outline" className="text-xs bg-white/80">
            {(() => {
              const grammarSummary = getGrammarSummary();
              if (currentSession?.status === 'active') {
                return `Session Active`;
              } else if (grammarSummary.hasIssues) {
                return `${grammarSummary.issueCount} suggestions`;
              } else {
                return `${grammarSummary.overallScore}% score`;
              }
            })()}
          </Badge>
        )}
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
        {/* Coach Capabilities & Coaching Areas */}
        {activeDocument && !currentSession && (
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="text-sm font-medium text-blue-900 mb-3">Ready to help with:</div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(() => {
                const grammarSummary = getGrammarSummary();
                const progress = getDocumentProgress();
                const capabilities = [];

                // Prioritize based on document state
                if (grammarSummary.hasIssues) {
                  capabilities.push({ 
                    icon: "✏️", 
                    text: "Grammar & Style"
                  });
                }

                if (progress && !progress.isComplete) {
                  capabilities.push({ 
                    icon: "📝", 
                    text: "Structure & Flow"
                  });
                }

                // Always show these
                capabilities.push(
                  { icon: "🎯", text: "Clarity & Focus" },
                  { icon: "💡", text: "Ideas & Research" },
                  { icon: "🔍", text: "Audience & Tone" },
                  { icon: "✨", text: "Polish & Refine" }
                );

                return capabilities.slice(0, 6).map((capability, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 p-2 rounded-lg text-xs bg-white/60 text-blue-700"
                  >
                    <span className="text-sm">{capability.icon}</span>
                    <span className="font-medium">{capability.text}</span>
                  </div>
                ));
              })()}
            </div>
            
            {/* Single Action Button */}
            <Button
              onClick={handleStartConversation}
              className="w-full"
              disabled={!isInitialized || !recordingState.isSupported || isEnding}
            >
              Start a coaching call
            </Button>
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

        {/* Session Controls */}
        {recordingState.hasPermission && currentSession?.status === 'active' && !isEnding && (
          <div className="text-center">
            <Button
              onClick={handleEndConversation}
              variant="destructive"
              size="lg"
              className="w-full"
              disabled={isEnding}
            >
              {isEnding ? "Ending..." : "End Conversation"}
            </Button>
          </div>
        )}

        {/* Fallback for no document */}
        {recordingState.hasPermission && !activeDocument && !currentSession && (
          <div className="text-center">
            <Button
              onClick={handleStartConversation}
              size="lg"
              className="w-full"
              disabled={!isInitialized || !recordingState.isSupported || isEnding}
            >
              Start Voice Chat
            </Button>
          </div>
        )}

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



        {/* Enhanced Recent Insights Panel */}
        {conversationSuggestions && conversationSuggestions.length > 0 && (
          <Card className="p-4 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💡</span>
              <div className="text-sm font-semibold text-green-900">
                Recent Coaching Insights
              </div>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                {conversationSuggestions.length} suggestions
              </Badge>
            </div>
            
            <div className="space-y-3">
              {conversationSuggestions.map((suggestion, index) => (
                <div key={index} className="bg-white/70 rounded-lg p-3 border border-green-200/50">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full mt-1.5 flex-shrink-0",
                      suggestion.priority === 'high' ? 'bg-red-400' :
                      suggestion.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    )} />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">
                        {suggestion.title}
                      </div>
                      <div className="text-xs text-gray-700 mt-1 leading-relaxed">
                        {suggestion.description}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs bg-white/80 border-green-300"
                        >
                          {suggestion.type}
                        </Badge>
                        <span className={cn(
                          "text-xs font-medium",
                          suggestion.priority === 'high' ? 'text-red-600' :
                          suggestion.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        )}>
                          {suggestion.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Quick Action */}
            <div className="mt-3 pt-3 border-t border-green-200">
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-green-700 border-green-300 hover:bg-green-100"
                onClick={handleStartConversation}
              >
                Continue improving with a new session
              </Button>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}