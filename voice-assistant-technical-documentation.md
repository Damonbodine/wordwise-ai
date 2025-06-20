# Voice Assistant Technical Implementation Documentation
## Complete Technical Reference for Real-time Voice Writing Coach

**Document Version**: 3.0  
**Created**: June 20, 2025  
**Purpose**: Complete implementation guide for voice assistant feature  
**Status**: Implementation Ready  

---

## 🎯 **Core Requirements**

### **User Experience Goals**
1. **Real-time Voice Conversations** - Must feel instantaneous and natural
2. **Document Context Awareness** - Voice agent knows what user is writing about
3. **Writing Coach Functionality** - Provides intelligent writing suggestions and feedback
4. **Post-call Analysis** - Converts conversation to actionable writing edits
5. **Multi-session Context** - Remembers conversation history for better assistance

### **Technical Requirements**
- **Latency**: < 300ms end-to-end response time
- **APIs**: ElevenLabs (TTS) + Deepgram (STT) + OpenAI (AI)
- **Backend**: Supabase for persistence and real-time features
- **Integration**: Non-breaking integration with existing document editing workflow

---

## 📋 **1. Document Context Extraction**

### **Implementation Pattern (Simple & Effective)**
```typescript
// Voice assistant reads current document from existing store
import { useDocumentStore } from '@/stores/document-store';

function extractDocumentContext(): VoiceContext {
  const { activeDocument } = useDocumentStore();
  
  if (!activeDocument) {
    return {
      hasDocument: false,
      context: "User doesn't have any document open currently."
    };
  }

  return {
    hasDocument: true,
    documentId: activeDocument.id,
    title: activeDocument.title,
    wordCount: activeDocument.stats.wordCount,
    // Use plainText for AI context (HTML cleaned)
    content: activeDocument.plainText,
    // Summarize if content is too long for token limits
    summary: activeDocument.plainText.length > 2000 
      ? summarizeForContext(activeDocument.plainText)
      : activeDocument.plainText,
    documentType: inferDocumentType(activeDocument.title, activeDocument.plainText),
    lastUpdated: activeDocument.updatedAt
  };
}

interface VoiceContext {
  hasDocument: boolean;
  documentId?: string;
  title?: string;
  wordCount?: number;
  content?: string;
  summary?: string;
  documentType?: 'essay' | 'email' | 'report' | 'creative' | 'notes' | 'other';
  context: string; // Human-readable context for AI
  lastUpdated?: Date;
}
```

### **Smart Context Management**
```typescript
function formatContextForAI(context: VoiceContext): string {
  if (!context.hasDocument) {
    return "The user doesn't have any document open. Ask what they'd like to write about.";
  }

  return `Document Context:
Title: "${context.title}"
Type: ${context.documentType}
Word Count: ${context.wordCount}
Content Summary: ${context.summary}

As a writing coach, provide relevant suggestions based on this document content.`;
}

// Token management for large documents
function summarizeForContext(content: string): string {
  // Keep first 500 and last 500 characters + middle excerpt
  if (content.length <= 1000) return content;
  
  const start = content.substring(0, 500);
  const end = content.substring(content.length - 500);
  const middle = content.substring(content.length / 2 - 100, content.length / 2 + 100);
  
  return `${start}...\n[Middle excerpt: ${middle}]\n...${end}`;
}
```

---

## 🎤 **2. Audio Pipeline Documentation**

### **Real-time Audio Architecture**
```typescript
// Three-stage audio pipeline for real-time conversation
interface AudioPipeline {
  // Stage 1: Audio Capture
  recording: {
    mediaRecorder: MediaRecorder;
    audioContext: AudioContext;
    audioChunks: Blob[];
    isRecording: boolean;
  };
  
  // Stage 2: Real-time Processing  
  realtime: {
    deepgramWebSocket: WebSocket;
    audioStreamActive: boolean;
    transcriptionBuffer: string;
  };
  
  // Stage 3: Post-call Processing
  postCall: {
    fullConversationAudio: Blob;
    completeTranscript: string;
    analysisReady: boolean;
  };
}
```

### **Deepgram Integration Patterns**

#### **Real-time Transcription (During Conversation)**
```typescript
class DeepgramRealtimeService {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  
  async startRealTimeTranscription(): Promise<boolean> {
    try {
      // WebSocket connection with optimized parameters for conversation
      const wsUrl = `wss://api.deepgram.com/v1/listen?` + new URLSearchParams({
        model: 'nova-2',                    // Best for conversation
        language: 'en-US',
        punctuate: 'true',
        smart_format: 'true',
        interim_results: 'true',           // Get partial results
        endpointing: '300',                // 300ms silence detection
        vad_events: 'true',                // Voice activity detection
        encoding: 'linear16',
        sample_rate: '16000',
        channels: '1'
      });

      this.ws = new WebSocket(wsUrl, ['token', process.env.DEEPGRAM_API_KEY!]);
      
      this.ws.onmessage = (event) => {
        const result = JSON.parse(event.data);
        if (result.type === 'Results') {
          const transcript = result.channel.alternatives[0]?.transcript;
          const isFinal = result.is_final;
          
          if (transcript) {
            if (isFinal) {
              this.onFinalTranscript?.(transcript);
            } else {
              this.onInterimTranscript?.(transcript);
            }
          }
        }
      };

      return true;
    } catch (error) {
      console.error('Failed to start real-time transcription:', error);
      return false;
    }
  }

  sendAudioChunk(audioData: ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(audioData);
    }
  }
}
```

#### **Post-call Transcription (Full Conversation)**
```typescript
class DeepgramPostCallService {
  async transcribeFullConversation(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'conversation.wav');
      
      const response = await fetch('https://api.deepgram.com/v1/listen', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        },
        body: formData,
        // Optimized parameters for post-call analysis
        params: {
          model: 'nova-2',
          smart_format: true,
          punctuate: true,
          diarize: true,              // Separate user vs assistant speech
          paragraphs: true,           // Structure for analysis
          detect_topics: true,        // Topic detection for writing analysis
          summarize: true             // Built-in summarization
        }
      });

      const result = await response.json();
      return result.results.channels[0].alternatives[0].transcript;
    } catch (error) {
      console.error('Post-call transcription failed:', error);
      throw error;
    }
  }
}
```

### **Audio Recording Management**
```typescript
class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private fullConversationChunks: Blob[] = [];

  async startRecording(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000
      });

      // Dual recording: real-time chunks + full conversation
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.fullConversationChunks.push(event.data);
          
          // Send to Deepgram real-time
          this.sendToRealTimeSTT(event.data);
        }
      };

      // Record in small chunks for real-time processing
      this.mediaRecorder.start(250); // 250ms chunks
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  getFullConversationBlob(): Blob {
    return new Blob(this.fullConversationChunks, { type: 'audio/webm' });
  }
}
```

---

## 🗄️ **3. Supabase Real-time Integration**

### **Database Schema Design**
```sql
-- Voice Conversations Table
CREATE TABLE voice_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  document_id UUID REFERENCES documents(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'interrupted'
  document_context JSONB,        -- Snapshot of document at conversation start
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Messages (Real-time chat-like storage)
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES voice_conversations(id),
  speaker TEXT NOT NULL, -- 'user' or 'assistant'
  message_type TEXT DEFAULT 'speech', -- 'speech', 'suggestion', 'analysis'
  content TEXT NOT NULL,
  confidence_score DECIMAL,
  timestamp_offset_ms INTEGER, -- Offset from conversation start
  is_final BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice Settings (User Preferences)
CREATE TABLE voice_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  elevenlabs_voice_id TEXT DEFAULT 'pNInz6obpgDQGcFmaJgB', -- Default voice
  speech_rate DECIMAL DEFAULT 1.0,
  volume DECIMAL DEFAULT 1.0,
  auto_suggestions BOOLEAN DEFAULT true,
  real_time_feedback BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post-call Analysis Results
CREATE TABLE voice_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES voice_conversations(id),
  full_transcript TEXT NOT NULL,
  writing_suggestions JSONB,     -- Array of writing improvement suggestions
  document_edits JSONB,          -- Specific edits to apply to document
  analysis_summary TEXT,
  confidence_score DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Real-time Supabase Integration**
```typescript
class VoiceConversationService {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  private conversationId: string | null = null;

  // Start conversation with real-time tracking
  async startConversation(userId: string, documentId: string): Promise<string> {
    const documentContext = extractDocumentContext();
    
    const { data, error } = await this.supabase
      .from('voice_conversations')
      .insert({
        user_id: userId,
        document_id: documentId,
        document_context: documentContext,
        status: 'active'
      })
      .select('id')
      .single();

    if (error) throw error;
    
    this.conversationId = data.id;
    
    // Set up real-time subscription for this conversation
    this.subscribeToConversationUpdates(data.id);
    
    return data.id;
  }

  // Real-time message storage
  async addMessage(speaker: 'user' | 'assistant', content: string, isFinal: boolean = true): Promise<void> {
    if (!this.conversationId) return;

    await this.supabase
      .from('conversation_messages')
      .insert({
        conversation_id: this.conversationId,
        speaker,
        content,
        is_final: isFinal,
        timestamp_offset_ms: Date.now() - this.conversationStartTime
      });
  }

  // Real-time subscriptions for multi-device sync
  private subscribeToConversationUpdates(conversationId: string): void {
    this.supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`
        }, 
        (payload) => {
          this.onNewMessage?.(payload.new as ConversationMessage);
        }
      )
      .subscribe();
  }

  // Broadcast conversation events to other clients
  async broadcastVoiceEvent(event: VoiceEvent): Promise<void> {
    await this.supabase
      .channel('voice-events')
      .send({
        type: 'broadcast',
        event: 'voice_activity',
        payload: {
          conversationId: this.conversationId,
          userId: this.userId,
          ...event
        }
      });
  }
}

interface VoiceEvent {
  type: 'speaking_started' | 'speaking_stopped' | 'processing' | 'responding';
  timestamp: number;
  data?: any;
}
```

### **User Voice Settings Management**
```typescript
class VoiceSettingsService {
  async getUserVoiceSettings(userId: string): Promise<VoiceSettings> {
    const { data, error } = await this.supabase
      .from('voice_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Return defaults if no settings found
      return {
        elevenlabs_voice_id: 'pNInz6obpgDQGcFmaJgB',
        speech_rate: 1.0,
        volume: 1.0,
        auto_suggestions: true,
        real_time_feedback: true
      };
    }

    return data;
  }

  async updateVoiceSettings(userId: string, settings: Partial<VoiceSettings>): Promise<void> {
    await this.supabase
      .from('voice_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
      });
  }
}
```

---

## 🧠 **4. Post-call Analysis Pipeline**

### **Conversation to Writing Suggestions**
```typescript
class PostCallAnalysisService {
  async analyzeConversation(conversationId: string): Promise<WritingSuggestions> {
    // 1. Get full conversation transcript
    const fullTranscript = await this.getFullTranscript(conversationId);
    
    // 2. Get original document context
    const documentContext = await this.getDocumentContext(conversationId);
    
    // 3. Generate writing analysis using ChatGPT
    const analysis = await this.generateWritingAnalysis(fullTranscript, documentContext);
    
    // 4. Store results in Supabase
    await this.storeAnalysisResults(conversationId, analysis);
    
    return analysis;
  }

  private async generateWritingAnalysis(transcript: string, documentContext: VoiceContext): Promise<WritingSuggestions> {
    const prompt = `You are an expert writing coach. Analyze this voice conversation between a user and a writing assistant about their document.

DOCUMENT CONTEXT:
Title: "${documentContext.title}"
Content: ${documentContext.summary}
Word Count: ${documentContext.wordCount}

CONVERSATION TRANSCRIPT:
${transcript}

Based on this conversation, provide specific writing suggestions and edits. Focus on:
1. Specific improvements discussed during the conversation
2. Writing clarity and structure suggestions
3. Grammar and style improvements
4. Content development suggestions

Return your analysis in this JSON format:
{
  "writingSuggestions": [
    {
      "type": "grammar" | "style" | "clarity" | "content",
      "description": "Human readable description",
      "originalText": "text to be replaced",
      "suggestedText": "replacement text",
      "explanation": "why this improvement helps",
      "confidence": 0.0-1.0,
      "priority": "high" | "medium" | "low"
    }
  ],
  "overallFeedback": "General writing feedback based on conversation",
  "conversationSummary": "Key points discussed during the voice session"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert writing coach who provides specific, actionable feedback.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Lower temperature for consistent analysis
      max_tokens: 1500
    });

    return JSON.parse(response.choices[0].message.content!);
  }
}

interface WritingSuggestion {
  type: 'grammar' | 'style' | 'clarity' | 'content';
  description: string;
  originalText: string;
  suggestedText: string;
  explanation: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

interface WritingSuggestions {
  writingSuggestions: WritingSuggestion[];
  overallFeedback: string;
  conversationSummary: string;
}
```

### **Integration with Existing Grammar System**
```typescript
class VoiceGrammarIntegration {
  // Add voice suggestions to existing grammar store
  async addVoiceSuggestions(suggestions: WritingSuggestion[]): Promise<void> {
    const { addSuggestions } = useGrammarStore.getState();
    
    // Convert voice suggestions to grammar suggestion format
    const grammarSuggestions = suggestions.map(suggestion => ({
      id: generateId(),
      type: suggestion.type,
      message: suggestion.description,
      originalText: suggestion.originalText,
      suggestedText: suggestion.suggestedText,
      explanation: suggestion.explanation,
      confidence: suggestion.confidence,
      source: 'voice_assistant', // Mark as voice-generated
      priority: suggestion.priority,
      position: this.findTextPosition(suggestion.originalText),
      isAccepted: false,
      isRejected: false,
      createdAt: new Date()
    }));

    addSuggestions(grammarSuggestions);
  }

  private findTextPosition(originalText: string): { start: number; end: number } {
    const { activeDocument } = useDocumentStore.getState();
    if (!activeDocument) return { start: 0, end: 0 };

    const index = activeDocument.plainText.indexOf(originalText);
    return {
      start: index,
      end: index + originalText.length
    };
  }
}
```

---

## 🔄 **Complete Implementation Flow**

### **Voice Conversation Orchestration**
```typescript
class VoiceAssistantOrchestrator {
  private deepgramRT = new DeepgramRealtimeService();
  private elevenLabs = new ElevenLabsService();
  private openAI = new OpenAI();
  private supabase = new VoiceConversationService();
  
  async startVoiceConversation(userId: string): Promise<void> {
    // 1. Extract current document context
    const documentContext = extractDocumentContext();
    
    // 2. Start conversation tracking in Supabase
    const conversationId = await this.supabase.startConversation(
      userId, 
      documentContext.documentId || null
    );
    
    // 3. Initialize real-time audio pipeline
    await this.deepgramRT.startRealTimeTranscription();
    
    // 4. Set up conversation flow
    this.setupConversationFlow(documentContext, conversationId);
    
    // 5. Start audio recording
    await this.audioRecorder.startRecording();
  }

  private setupConversationFlow(context: VoiceContext, conversationId: string): void {
    // Real-time conversation loop
    this.deepgramRT.onFinalTranscript = async (userSpeech: string) => {
      // 1. Store user message
      await this.supabase.addMessage('user', userSpeech);
      
      // 2. Get AI response with document context
      const aiResponse = await this.getAIResponse(userSpeech, context);
      
      // 3. Convert to speech
      const audioBuffer = await this.elevenLabs.synthesize(aiResponse);
      
      // 4. Play audio to user
      await this.playAudio(audioBuffer);
      
      // 5. Store assistant message
      await this.supabase.addMessage('assistant', aiResponse);
    };
  }

  async endConversation(): Promise<WritingSuggestions> {
    // 1. Stop recording and get full audio
    const fullAudio = await this.audioRecorder.stopRecording();
    
    // 2. Mark conversation as complete
    await this.supabase.endConversation(this.conversationId);
    
    // 3. Generate post-call analysis
    const analysis = await this.postCallAnalysis.analyzeConversation(this.conversationId);
    
    // 4. Add suggestions to grammar system
    await this.voiceGrammarIntegration.addVoiceSuggestions(analysis.writingSuggestions);
    
    return analysis;
  }
}
```

### **Error Handling & Fallbacks**
```typescript
class VoiceErrorHandling {
  // Use existing error handlers from API testing
  async handleAPIFailure(apiName: string, error: any): Promise<boolean> {
    switch(apiName) {
      case 'deepgram':
        // Fall back to browser Speech Recognition API
        return this.fallbackToBrowserSTT();
      
      case 'elevenlabs':
        // Fall back to browser Speech Synthesis API
        return this.fallbackToBrowserTTS();
      
      case 'openai':
        // Use cached responses or simplified AI
        return this.useSimplifiedAI();
      
      default:
        return false;
    }
  }

  private async fallbackToBrowserSTT(): Promise<boolean> {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.browserRecognition = new SpeechRecognition();
    this.browserRecognition.continuous = true;
    this.browserRecognition.interimResults = true;
    
    // Set up similar event handling as Deepgram
    return true;
  }
}
```

---

## 📊 **Performance & Monitoring**

### **Real-time Performance Metrics**
```typescript
interface VoiceMetrics {
  latency: {
    speechToText: number;    // Deepgram response time
    aiProcessing: number;    // OpenAI response time  
    textToSpeech: number;    // ElevenLabs synthesis time
    totalRoundTrip: number;  // End-to-end conversation latency
  };
  quality: {
    transcriptionAccuracy: number;
    conversationRelevance: number;
    userSatisfaction: number;
  };
  usage: {
    apiCosts: {
      deepgram: number;
      elevenlabs: number;
      openai: number;
    };
    conversationDuration: number;
    messagesExchanged: number;
  };
}
```

---

## ✅ **Implementation Checklist**

### **Phase 1: Foundation (Day 1)**
- [ ] Create voice assistant Zustand store following document store patterns
- [ ] Implement audio recording service with Web Audio API
- [ ] Create isolated voice panel component for sidebar
- [ ] Set up basic conversation state management

### **Phase 2: Core Features (Day 2-3)**
- [ ] Integrate real-time Deepgram transcription
- [ ] Set up OpenAI conversation with document context
- [ ] Implement ElevenLabs speech synthesis
- [ ] Create conversation orchestration service

### **Phase 3: Persistence (Day 4)**
- [ ] Set up Supabase conversation tables
- [ ] Implement real-time conversation storage
- [ ] Add user voice settings management
- [ ] Create post-call analysis pipeline

### **Phase 4: Integration (Day 5)**
- [ ] Replace sidebar placeholder with working voice panel
- [ ] Integrate with existing grammar suggestion system
- [ ] Add error handling and fallbacks
- [ ] Performance optimization and testing

---

**Status**: 📚 **Documentation Complete - Ready for Implementation**  
**Next Step**: Begin Phase 1 foundation implementation  
**Estimated Timeline**: 5 days for complete feature  
**Risk Level**: Low - comprehensive API testing and error handling documented