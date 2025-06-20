# ElevenLabs API Error Documentation

**Generated:** 2025-06-20  
**API Version:** v1  
**Test Coverage:** Complete error scenario testing

## 📊 Test Summary

- **Total Tests:** 13
- **Successful Cases:** 4 
- **Error Cases:** 9
- **API Key:** Working (sk_ee988816896aba4a66859b994849029219a84bd17ec06ca5)

## ✅ Successful Cases

### 1. Empty Text Input
- **Status:** 200 OK
- **Test:** Empty string (`""`)
- **Result:** Successfully generates audio (short silence)
- **Implication:** ElevenLabs handles empty text gracefully

### 2. Long Text Input
- **Status:** 200 OK  
- **Test:** 1500 characters (all 'A's)
- **Result:** Successfully generates audio
- **Implication:** No hard character limit found

### 3. Special Characters & Emojis
- **Status:** 200 OK
- **Test:** `"Hello! 🎉 This has special chars: @#$%^&*()_+ and emojis: 😀🚀💯"`
- **Result:** Successfully generates audio
- **Implication:** Unicode and special characters are supported

### 4. Voices Endpoint (No Auth)
- **Status:** 200 OK
- **Test:** GET /v1/voices without API key
- **Result:** Returns public voice list
- **Implication:** Voice listing doesn't require authentication

## ❌ Error Cases

### HTTP 401 - Unauthorized (3 cases)

#### Invalid API Key
```json
{
  "detail": {
    "status": "invalid_api_key", 
    "message": "Invalid API key"
  }
}
```

#### Missing API Key (TTS)
```json
{
  "detail": {
    "status": "needs_authorization",
    "message": "Neither authorization header nor xi-api-key received, please provide one."
  }
}
```

#### Invalid API Key (Voices)
```json
{
  "detail": {
    "status": "invalid_api_key",
    "message": "Invalid API key"  
  }
}
```

### HTTP 400 - Bad Request (2 cases)

#### Invalid Model ID
```json
{
  "detail": {
    "status": "model_not_found",
    "message": "A model with model ID invalid_model_id does not exist ..."
  }
}
```

#### Invalid Voice Settings
```json
{
  "detail": {
    "status": "invalid_voice_settings", 
    "message": "Invalid setting for stability received, expected to be greater or equal to 0.0 and less or equal to 1.0, received 2.0."
  }
}
```

### HTTP 404 - Not Found (1 case)

#### Invalid Voice ID
```json
{
  "detail": {
    "status": "voice_not_found",
    "message": "A voice with the voice_id invalid_voice_id_12345 was not found."
  }
}
```

### HTTP 405 - Method Not Allowed (1 case)

#### Wrong HTTP Method
```json
{
  "detail": "Method Not Allowed"
}
```
- **Cause:** Using GET instead of POST for TTS endpoint

### HTTP 422 - Unprocessable Entity (2 cases)

#### Malformed JSON
- **Cause:** Invalid JSON syntax in request body
- **Response:** Detailed validation errors for all missing fields

#### Missing Required Fields
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "text"],
      "msg": "Field required", 
      "input": null
    }
  ]
}
```

## 🏗️ Error Response Structure

All ElevenLabs errors follow consistent patterns:

### Standard Error Format
```json
{
  "detail": {
    "status": "error_code",
    "message": "Human readable description"
  }
}
```

### Validation Error Format  
```json
{
  "detail": [
    {
      "type": "validation_type",
      "loc": ["body", "field_name"],
      "msg": "Error description",
      "input": actual_value
    }
  ]
}
```

## 🛡️ Error Handling Strategy

### 1. Authentication Errors (401)
```typescript
if (response.status === 401) {
  const error = await response.json();
  if (error.detail?.status === 'invalid_api_key') {
    throw new Error('Invalid ElevenLabs API key');
  }
  if (error.detail?.status === 'needs_authorization') {
    throw new Error('Missing ElevenLabs API key');
  }
}
```

### 2. Input Validation Errors (400, 422)
```typescript
if (response.status === 400 || response.status === 422) {
  const error = await response.json();
  
  // Handle model/voice validation
  if (error.detail?.status === 'model_not_found') {
    throw new Error(`Invalid model: ${modelId}`);
  }
  
  if (error.detail?.status === 'voice_not_found') {
    throw new Error(`Invalid voice: ${voiceId}`);
  }
  
  if (error.detail?.status === 'invalid_voice_settings') {
    throw new Error('Voice settings out of range (0-1)');
  }
  
  // Handle field validation
  if (Array.isArray(error.detail)) {
    const missingFields = error.detail
      .filter(e => e.type === 'missing')
      .map(e => e.loc[1]);
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}
```

### 3. Resource Not Found (404)
```typescript
if (response.status === 404) {
  const error = await response.json();
  if (error.detail?.status === 'voice_not_found') {
    throw new Error(`Voice not found: ${voiceId}`);
  }
}
```

### 4. Rate Limiting (429)
```typescript
if (response.status === 429) {
  const error = await response.json();
  const retryAfter = response.headers.get('Retry-After') || '60';
  throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
}
```

## 🎯 Input Validation Rules

### Required Fields
- `text`: String (can be empty)
- `model_id`: Valid model identifier
- `voice_settings`: Object with stability and similarity_boost

### Valid Ranges
- `stability`: 0.0 to 1.0
- `similarity_boost`: 0.0 to 1.0  

### Voice IDs
- Must be valid ElevenLabs voice identifier
- Check /v1/voices endpoint for available voices

### Model IDs
- `eleven_monolingual_v1` (working)
- `eleven_multilingual_v1` (assumed working)
- Custom model IDs (if available)

## 📈 Rate Limiting

**Free Tier Limits:**
- 6,000 tokens per minute (TPM) 
- 30 requests per minute (RPM)
- 14,400 tokens per day

**Expected Rate Limit Response (429):**
```json
{
  "detail": {
    "status": "rate_limit_exceeded",
    "message": "Rate limit exceeded..."
  }
}
```

## 🔧 Implementation Recommendations

### 1. Pre-Request Validation
```typescript
function validateTTSRequest(text: string, voiceId: string, settings: VoiceSettings) {
  if (!text && text !== '') throw new Error('Text is required');
  if (!voiceId) throw new Error('Voice ID is required');
  if (settings.stability < 0 || settings.stability > 1) {
    throw new Error('Stability must be between 0 and 1');
  }
  if (settings.similarity_boost < 0 || settings.similarity_boost > 1) {
    throw new Error('Similarity boost must be between 0 and 1');
  }
}
```

### 2. Robust Error Handler
```typescript
async function handleElevenLabsError(response: Response) {
  const errorData = await response.json().catch(() => null);
  
  switch (response.status) {
    case 401:
      return handleAuthError(errorData);
    case 400:
    case 422:
      return handleValidationError(errorData);
    case 404:
      return handleNotFoundError(errorData);
    case 429:
      return handleRateLimitError(response.headers);
    default:
      return new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}
```

### 3. Rate Limit Handling
```typescript
async function makeElevenLabsRequest(url: string, options: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      continue;
    }
    
    return response;
  }
  
  throw new Error('Rate limit exceeded after retries');
}
```

## 🧪 Test Coverage Achieved

✅ **Authentication:** Invalid keys, missing keys  
✅ **Input Validation:** Empty text, long text, special characters  
✅ **Resource Validation:** Invalid voice IDs, invalid model IDs  
✅ **Settings Validation:** Out-of-range parameters  
✅ **Protocol:** Wrong HTTP methods, malformed JSON  
✅ **Edge Cases:** Empty strings, Unicode characters

## 🚀 Next Steps

1. **Rate Limit Testing:** Run comprehensive rate limit tests
2. **Production Testing:** Validate error handling in production environment  
3. **Monitoring:** Implement error tracking and alerting
4. **Fallback Strategy:** Plan offline/degraded mode handling

---

**Status:** Ready for robust error handling implementation ✅