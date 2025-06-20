# Voice Agent Tech Stack Reference
## WordWise AI - Comprehensive Technical Documentation

**Document Version**: 1.0  
**Created**: June 20, 2025  
**Purpose**: Centralized technical reference to reduce implementation errors  
**Status**: Documentation Collection Phase  

---

## 📚 **Required Documentation Collection Checklist**

### **🔥 CRITICAL - API Documentation (Collect First)**

#### **ElevenLabs Text-to-Speech API**
**Priority**: CRITICAL - Voice synthesis is core feature
**Required Documentation**:
- [ ] Complete API reference: `https://docs.elevenlabs.io/api-reference`
- [ ] Error codes and response formats: `https://docs.elevenlabs.io/troubleshooting/common-errors`
- [ ] Rate limiting documentation: `https://docs.elevenlabs.io/usage/rate-limits`
- [ ] Voice selection and customization: `https://docs.elevenlabs.io/voices`
- [ ] Audio format specifications: `https://docs.elevenlabs.io/api-reference/text-to-speech`
- [ ] Pricing and token usage: `https://elevenlabs.io/pricing`

**Key Implementation Notes**:
```javascript
// Required for planning document implementation
- Character-based pricing model
- Audio format: MP3, WAV support
- Max text length per request
- Available voices and customization
- Error response structure
```

#### **Deepgram Speech-to-Text API**
**Priority**: CRITICAL - Real-time transcription core feature
**Required Documentation**:
- [ ] Real-time streaming guide: `https://developers.deepgram.com/docs/streaming`
- [ ] WebSocket protocol: `https://developers.deepgram.com/docs/websocket-api`
- [ ] Error handling: `https://developers.deepgram.com/docs/error-handling`
- [ ] Supported audio formats: `https://developers.deepgram.com/docs/audio-formats`
- [ ] Language models and accuracy: `https://developers.deepgram.com/docs/models`
- [ ] Pricing structure: `https://deepgram.com/pricing`

**Key Implementation Notes**:
```javascript
// Critical for real-time implementation
- WebSocket connection lifecycle
- Audio chunk size requirements
- Confidence scores and accuracy
- Language detection capabilities
- Reconnection strategies
```

#### **OpenAI ChatGPT API for Voice Conversations**
**Priority**: CRITICAL - AI conversation intelligence
**Required Documentation**:
- [ ] Chat completions API: `https://platform.openai.com/docs/api-reference/chat`
- [ ] Streaming responses: `https://platform.openai.com/docs/api-reference/chat/create#chat/create-stream`
- [ ] Token limits and pricing: `https://openai.com/pricing`
- [ ] Best practices for conversations: `https://platform.openai.com/docs/guides/text-generation/chat-completions-api`
- [ ] Error handling: `https://platform.openai.com/docs/guides/error-codes`
- [ ] Rate limiting: `https://platform.openai.com/docs/guides/rate-limits`

**Key Implementation Notes**:
```javascript
// Essential for conversation management
- Context window management (token limits)
- Streaming vs batch responses
- Conversation memory patterns
- Function calling for document context
- Cost optimization strategies
```

---

### **🌐 CRITICAL - Browser API Documentation**

#### **Web Audio API (MDN)**
**Priority**: CRITICAL - Audio processing foundation
**Required Documentation**:
- [ ] Web Audio API overview: `https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API`
- [ ] AudioContext: `https://developer.mozilla.org/en-US/docs/Web/API/AudioContext`
- [ ] MediaRecorder: `https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder`
- [ ] Browser compatibility: `https://caniuse.com/audio-api`
- [ ] Best practices: `https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices`

**Key Implementation Notes**:
```javascript
// Critical browser differences
- Safari AudioContext restrictions
- Chrome autoplay policies
- Mobile Safari limitations
- Memory management for long recordings
```

#### **MediaDevices API (MDN)**
**Priority**: CRITICAL - Microphone access
**Required Documentation**:
- [ ] getUserMedia(): `https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia`
- [ ] Permission handling: `https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API`
- [ ] Browser support: `https://caniuse.com/stream`
- [ ] Mobile considerations: `https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#mobile_considerations`

**Key Implementation Notes**:
```javascript
// Permission handling variations
- Chrome: Immediate permission request
- Safari: User gesture required
- Firefox: Different permission UI
- Mobile: App-specific permissions
```

---

### **⚡ HIGH PRIORITY - Integration Patterns**

#### **Next.js API Routes Best Practices**
**Priority**: HIGH - Server-side API orchestration
**Required Documentation**:
- [ ] API Routes: `https://nextjs.org/docs/api-routes/introduction`
- [ ] Error handling: `https://nextjs.org/docs/api-routes/api-middlewares#error-handling`
- [ ] Environment variables: `https://nextjs.org/docs/basic-features/environment-variables`
- [ ] Streaming responses: `https://nextjs.org/docs/api-routes/response-helpers#streaming`

#### **Zustand State Management for Real-time**
**Priority**: HIGH - Voice state management
**Required Documentation**:
- [ ] Zustand basics: `https://github.com/pmndrs/zustand`
- [ ] Persistence: `https://github.com/pmndrs/zustand#persist-middleware`
- [ ] TypeScript usage: `https://github.com/pmndrs/zustand#typescript-usage`
- [ ] DevTools integration: `https://github.com/pmndrs/zustand#redux-devtools`

#### **Supabase Real-time Integration**
**Priority**: HIGH - Live document synchronization
**Required Documentation**:
- [ ] Real-time subscriptions: `https://supabase.com/docs/guides/realtime`
- [ ] Row Level Security: `https://supabase.com/docs/guides/auth/row-level-security`
- [ ] Database functions: `https://supabase.com/docs/guides/database/functions`
- [ ] TypeScript types: `https://supabase.com/docs/guides/api/generating-types`

---

### **🔒 HIGH PRIORITY - Security & Privacy**

#### **GDPR and Audio Data Compliance**
**Priority**: HIGH - Legal requirements
**Required Documentation**:
- [ ] GDPR audio data requirements: `https://gdpr.eu/article-9-processing-special-categories-of-personal-data/`
- [ ] Browser audio privacy policies
- [ ] User consent best practices for voice recording
- [ ] Data retention and deletion requirements

#### **API Key Security Patterns**
**Priority**: HIGH - Prevent security breaches
**Required Documentation**:
- [ ] Environment variable security
- [ ] Server-side API key management
- [ ] Client-side security considerations
- [ ] Rotation and monitoring strategies

---

### **📱 MEDIUM PRIORITY - Browser Compatibility**

#### **Cross-Browser Audio Support Matrix**
**Priority**: MEDIUM - User experience consistency
**Required Documentation**:
- [ ] Chrome audio policies: `https://developer.chrome.com/blog/autoplay/`
- [ ] Safari audio restrictions: `https://webkit.org/blog/6784/new-video-policies-for-ios/`
- [ ] Firefox WebRTC: `https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API`
- [ ] Mobile Safari limitations
- [ ] Edge audio support

#### **WebSocket Real-time Communication**
**Priority**: MEDIUM - Real-time features
**Required Documentation**:
- [ ] WebSocket API: `https://developer.mozilla.org/en-US/docs/Web/API/WebSocket`
- [ ] Connection management best practices
- [ ] Reconnection strategies
- [ ] Error handling patterns

---

### **⚡ MEDIUM PRIORITY - Performance Optimization**

#### **Audio Processing Performance**
**Priority**: MEDIUM - Resource management
**Required Documentation**:
- [ ] Memory management for continuous audio processing
- [ ] Web Workers for audio processing: `https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API`
- [ ] AudioWorklet: `https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet`
- [ ] Performance monitoring techniques

#### **Network Optimization**
**Priority**: MEDIUM - Latency and bandwidth
**Required Documentation**:
- [ ] Audio compression techniques
- [ ] WebSocket vs HTTP/2 for streaming
- [ ] CDN considerations for audio
- [ ] Offline capabilities and caching

---

### **🛠️ MEDIUM PRIORITY - Current Codebase Integration**

#### **Existing Architecture Patterns**
**Priority**: MEDIUM - Consistency with current code
**Documentation from Current Codebase**:
- [ ] Document store patterns: `/stores/document-store.ts`
- [ ] Component architecture: `/components/layout/`
- [ ] Error handling: `/app/api/analyze/route.ts`
- [ ] TypeScript interfaces: `/types/index.ts`
- [ ] Testing patterns: Current test setup

#### **TipTap Editor Integration**
**Priority**: MEDIUM - Document context extraction
**Required Documentation**:
- [ ] TipTap extensions: `https://tiptap.dev/guide/custom-extensions`
- [ ] Content extraction: `https://tiptap.dev/guide/output`
- [ ] Change detection: `https://tiptap.dev/api/events`
- [ ] Performance considerations

---

### **📊 LOW PRIORITY - Monitoring & Analytics**

#### **Error Monitoring and Logging**
**Priority**: LOW - Production operations
**Required Documentation**:
- [ ] Browser error tracking
- [ ] API error aggregation
- [ ] Performance metrics collection
- [ ] User behavior analytics

#### **Cost Monitoring and Optimization**
**Priority**: LOW - Budget management
**Required Documentation**:
- [ ] API usage tracking patterns
- [ ] Cost estimation algorithms
- [ ] Budget alert implementations
- [ ] Usage optimization strategies

---

## 🏗️ **Implementation Architecture Reference**

### **Current WordWise AI Tech Stack**
```typescript
// Existing Foundation (DO NOT MODIFY)
Frontend:
├── Next.js 15.3.3 (React 19.1.0)
├── TypeScript 5
├── TailwindCSS 3.3.0
├── Zustand 5.0.5 (State Management)
├── TipTap 2.14.0 (Rich Text Editor)
└── Radix UI Components

Backend:
├── Next.js API Routes
├── Supabase 2.50.0 (Database, Auth, Real-time)
└── Server-side API integrations

// NEW Voice Assistant Stack (TO BE ADDED)
Voice Processing:
├── ElevenLabs API (Text-to-Speech)
├── Deepgram API (Speech-to-Text)
├── OpenAI API (Conversation AI)
├── Web Audio API (Browser audio)
├── MediaDevices API (Microphone)
└── WebSocket (Real-time communication)
```

### **Integration Points with Existing Code**
```typescript
// Files that will be modified (CAREFULLY)
/components/layout/sidebar.tsx          // Add voice panel
/stores/ [new] voice-assistant-store.ts // Voice state
/app/api/ [new] voice/                  // Voice API routes
/types/index.ts                         // Voice interfaces

// Files that must NOT be modified
/stores/document-store.ts               // Document state
/stores/grammar-store.ts                // Grammar analysis
/components/editor/text-editor.tsx      // Main editor
/app/api/analyze/route.ts              // Grammar API
```

---

## 📋 **Code Pattern Templates**

### **API Integration Error Handling Pattern**
```typescript
// Template for all external API calls
async function callExternalAPI<T>(
  apiCall: () => Promise<Response>,
  fallback: () => T,
  apiName: string
): Promise<T> {
  try {
    const response = await apiCall();
    
    if (!response.ok) {
      throw new Error(`${apiName} error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!validateResponseSchema(data)) {
      throw new Error(`Invalid ${apiName} response format`);
    }
    
    return data;
  } catch (error) {
    console.error(`${apiName} API failed:`, error);
    return fallback();
  }
}
```

### **State Management Pattern**
```typescript
// Template for voice assistant Zustand store
interface VoiceAssistantStore {
  // State
  isRecording: boolean;
  isProcessing: boolean;
  conversation: ConversationMessage[];
  error: string | null;
  
  // Actions
  startRecording: () => void;
  stopRecording: () => void;
  addMessage: (message: ConversationMessage) => void;
  clearConversation: () => void;
  setError: (error: string | null) => void;
}

export const useVoiceAssistantStore = create<VoiceAssistantStore>()(
  persist(
    (set, get) => ({
      // Implementation
    }),
    { name: 'voice-assistant-storage' }
  )
);
```

### **Component Integration Pattern**
```typescript
// Template for voice components
interface VoiceComponentProps {
  onError?: (error: string) => void;
  onSuccess?: (result: any) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceComponent({ 
  onError, 
  onSuccess, 
  disabled = false,
  className 
}: VoiceComponentProps) {
  // Component implementation with error boundaries
}
```

---

## 🔧 **Environment Configuration**

### **Required Environment Variables**
```bash
# Voice Assistant APIs (ADD TO .env.local)
ELEVENLABS_API_KEY=el_xxxxxxxxxxxxxxxxxxxxxxx
DEEPGRAM_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Voice Assistant Configuration
VOICE_COST_LIMIT_DAILY=50
VOICE_CONVERSATION_MAX_DURATION=900000  # 15 minutes
VOICE_ENABLE_REAL_TIME_CONTEXT=true
VOICE_FALLBACK_TO_BROWSER_APIS=true

# Feature Flags
VOICE_ASSISTANT_ENABLED=false  # Start disabled
VOICE_ASSISTANT_BETA_USERS=    # Comma-separated user IDs
```

### **Package.json Dependencies to Add**
```json
{
  "dependencies": {
    "@deepgram/sdk": "^3.0.0",
    "@elevenlabs/api": "^1.0.0", 
    "openai": "^4.0.0",
    "socket.io-client": "^4.0.0"
  },
  "devDependencies": {
    "@types/dom-speech-recognition": "^0.0.1"
  }
}
```

---

## 🚨 **Critical Implementation Reminders**

### **DO NOT MODIFY These Files Initially**
- `/stores/document-store.ts` - Document state management
- `/stores/grammar-store.ts` - Grammar analysis state
- `/components/editor/text-editor.tsx` - Main editor component
- `/app/api/analyze/route.ts` - Grammar analysis API
- `/components/layout/layout.tsx` - Main layout (until Phase 3)

### **Lessons from Grammar Analysis Development**
1. **API Response Parsing**: Always expect malformed JSON from AI APIs
2. **Position Mapping**: Don't trust AI-provided text positions, use indexOf
3. **State Isolation**: Keep voice state completely separate initially
4. **Error Handling**: Build fallbacks for every API call
5. **Cost Control**: Monitor API usage from the first call

### **Browser Testing Requirements**
- Chrome Desktop (Windows/Mac) - Primary target
- Safari Desktop (Mac) - Known audio restrictions
- Firefox Desktop - WebRTC differences
- Mobile Safari (iOS) - Strict audio policies
- Chrome Mobile (Android) - Permission variations

---

## 📚 **Documentation Collection Progress**

### **Phase 1: Critical Documentation (Week 1)**
- [ ] ElevenLabs API complete reference
- [ ] Deepgram real-time streaming guide
- [ ] OpenAI conversation API documentation
- [ ] Web Audio API MDN documentation
- [ ] MediaDevices API and permissions

### **Phase 2: Integration Documentation (Week 2)**
- [ ] Next.js API route patterns
- [ ] Zustand real-time state management
- [ ] Supabase real-time subscriptions
- [ ] Browser compatibility matrices
- [ ] Security and privacy guidelines

### **Phase 3: Optimization Documentation (Week 3)**
- [ ] Performance optimization guides
- [ ] Error monitoring setup
- [ ] Cost tracking implementations
- [ ] Mobile-specific considerations
- [ ] Deployment and monitoring

---

## 📝 **Next Steps**

1. **Immediate**: Collect Phase 1 critical documentation
2. **Day 1**: Set up API accounts and get documentation access
3. **Day 2**: Review browser compatibility requirements
4. **Day 3**: Analyze current codebase integration points
5. **Week 1**: Complete critical documentation collection
6. **Week 2**: Begin micro-step implementation with full documentation

---

**Document Status**: Ready for documentation collection phase  
**Next Action**: Gather critical API documentation before implementation begins

*This tech stack reference will be updated as documentation is collected and implementation progresses.*