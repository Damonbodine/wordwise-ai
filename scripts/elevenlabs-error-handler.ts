/**
 * ElevenLabs API Error Handler
 * 
 * Comprehensive error handling based on testing all failure modes.
 * Generated from Step 1b: ElevenLabs Error Testing results.
 */

// Error Types based on testing
export interface ElevenLabsError {
  status: number;
  code: string;
  message: string;
  details?: any;
  retryAfter?: number;
}

export interface ElevenLabsDetailError {
  detail: {
    status: string;
    message: string;
  };
}

export interface ElevenLabsValidationError {
  detail: Array<{
    type: string;
    loc: string[];
    msg: string;
    input: any;
  }>;
}

// Voice Settings Validation
export interface VoiceSettings {
  stability: number;      // 0.0 to 1.0
  similarity_boost: number;  // 0.0 to 1.0
}

// TTS Request Interface
export interface TTSRequest {
  text: string;
  model_id: string;
  voice_settings: VoiceSettings;
}

/**
 * Validates TTS request parameters before sending
 */
export function validateTTSRequest(request: TTSRequest): void {
  // Text validation (empty string is allowed per testing)
  if (request.text === null || request.text === undefined) {
    throw new Error('Text field is required (empty string is allowed)');
  }

  // Model ID validation
  if (!request.model_id || typeof request.model_id !== 'string') {
    throw new Error('model_id is required and must be a string');
  }

  // Voice settings validation
  if (!request.voice_settings) {
    throw new Error('voice_settings is required');
  }

  const { stability, similarity_boost } = request.voice_settings;

  if (typeof stability !== 'number' || stability < 0 || stability > 1) {
    throw new Error('stability must be a number between 0.0 and 1.0');
  }

  if (typeof similarity_boost !== 'number' || similarity_boost < 0 || similarity_boost > 1) {
    throw new Error('similarity_boost must be a number between 0.0 and 1.0');
  }
}

/**
 * Validates voice ID format
 */
export function validateVoiceId(voiceId: string): void {
  if (!voiceId || typeof voiceId !== 'string') {
    throw new Error('Voice ID is required and must be a string');
  }
  
  // Basic format validation (alphanumeric + underscore)
  if (!/^[a-zA-Z0-9_]+$/.test(voiceId)) {
    throw new Error('Voice ID contains invalid characters');
  }
}

/**
 * Validates API key format
 */
export function validateApiKey(apiKey: string): void {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('API key is required');
  }
  
  if (!apiKey.startsWith('sk_')) {
    throw new Error('Invalid API key format (should start with sk_)');
  }
}

/**
 * Parses ElevenLabs error response into structured error
 */
export async function parseElevenLabsError(response: Response): Promise<ElevenLabsError> {
  let errorData: any;
  
  try {
    errorData = await response.json();
  } catch {
    // Handle non-JSON error responses
    return {
      status: response.status,
      code: 'UNKNOWN_ERROR',
      message: `HTTP ${response.status}: ${response.statusText}`,
    };
  }

  // Handle standard detail error format
  if (errorData.detail && typeof errorData.detail === 'object' && errorData.detail.status) {
    const detail = errorData.detail as ElevenLabsDetailError['detail'];
    return {
      status: response.status,
      code: detail.status.toUpperCase(),
      message: detail.message,
      details: errorData
    };
  }

  // Handle validation error format
  if (Array.isArray(errorData.detail)) {
    const validationErrors = errorData.detail as ElevenLabsValidationError['detail'];
    const missingFields = validationErrors
      .filter(error => error.type === 'missing')
      .map(error => error.loc[error.loc.length - 1])
      .join(', ');
    
    return {
      status: response.status,
      code: 'VALIDATION_ERROR',
      message: missingFields ? `Missing required fields: ${missingFields}` : 'Validation failed',
      details: validationErrors
    };
  }

  // Handle simple detail string
  if (typeof errorData.detail === 'string') {
    return {
      status: response.status,
      code: 'HTTP_ERROR',
      message: errorData.detail,
      details: errorData
    };
  }

  // Fallback for unknown error format
  return {
    status: response.status,
    code: 'UNKNOWN_ERROR',
    message: `HTTP ${response.status}: ${response.statusText}`,
    details: errorData
  };
}

/**
 * Enhanced error handler with specific error type handling
 */
export function handleElevenLabsError(error: ElevenLabsError): Error {
  switch (error.status) {
    case 401:
      switch (error.code) {
        case 'INVALID_API_KEY':
          return new Error('Invalid ElevenLabs API key. Please check your API key.');
        case 'NEEDS_AUTHORIZATION':
          return new Error('Missing ElevenLabs API key. Please provide xi-api-key header.');
        default:
          return new Error(`Authentication failed: ${error.message}`);
      }

    case 400:
      switch (error.code) {
        case 'MODEL_NOT_FOUND':
          return new Error('Invalid model ID. Please use a valid ElevenLabs model.');
        case 'INVALID_VOICE_SETTINGS':
          return new Error('Invalid voice settings. Stability and similarity_boost must be between 0.0 and 1.0.');
        default:
          return new Error(`Invalid request: ${error.message}`);
      }

    case 404:
      if (error.code === 'VOICE_NOT_FOUND') {
        return new Error('Voice not found. Please use a valid voice ID.');
      }
      return new Error(`Resource not found: ${error.message}`);

    case 405:
      return new Error('Method not allowed. Check the HTTP method for this endpoint.');

    case 422:
      if (error.code === 'VALIDATION_ERROR') {
        return new Error(`Request validation failed: ${error.message}`);
      }
      return new Error(`Unprocessable request: ${error.message}`);

    case 429:
      const retryAfter = error.retryAfter || 60;
      return new Error(`Rate limit exceeded. Please retry after ${retryAfter} seconds.`);

    case 500:
    case 502:
    case 503:
    case 504:
      return new Error(`ElevenLabs server error (${error.status}). Please try again later.`);

    default:
      return new Error(`ElevenLabs API error (${error.status}): ${error.message}`);
  }
}

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  FREE_TIER: {
    TOKENS_PER_MINUTE: 6000,
    REQUESTS_PER_MINUTE: 30,
    TOKENS_PER_DAY: 14400
  }
};

/**
 * Estimates token count for text (rough approximation)
 */
export function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Checks if request would exceed rate limits
 */
export function checkRateLimit(text: string, requestsInMinute: number): {
  allowed: boolean;
  reason?: string;
} {
  const tokens = estimateTokenCount(text);
  
  if (tokens > RATE_LIMITS.FREE_TIER.TOKENS_PER_MINUTE) {
    return {
      allowed: false,
      reason: `Text too long: ${tokens} tokens exceeds ${RATE_LIMITS.FREE_TIER.TOKENS_PER_MINUTE} TPM limit`
    };
  }
  
  if (requestsInMinute >= RATE_LIMITS.FREE_TIER.REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      reason: `Too many requests: ${requestsInMinute} exceeds ${RATE_LIMITS.FREE_TIER.REQUESTS_PER_MINUTE} RPM limit`
    };
  }
  
  return { allowed: true };
}

/**
 * Complete ElevenLabs API client with error handling
 */
export class ElevenLabsClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.elevenlabs.io/v1';
  private requestsInMinute: number = 0;
  private lastReset: number = Date.now();

  constructor(apiKey: string) {
    validateApiKey(apiKey);
    this.apiKey = apiKey;
  }

  private resetRateLimit(): void {
    const now = Date.now();
    if (now - this.lastReset >= 60000) {
      this.requestsInMinute = 0;
      this.lastReset = now;
    }
  }

  async textToSpeech(
    text: string,
    voiceId: string,
    options: {
      model_id?: string;
      voice_settings?: VoiceSettings;
    } = {}
  ): Promise<ArrayBuffer> {
    // Validate inputs
    validateVoiceId(voiceId);
    
    const request: TTSRequest = {
      text,
      model_id: options.model_id || 'eleven_monolingual_v1',
      voice_settings: options.voice_settings || {
        stability: 0.5,
        similarity_boost: 0.5
      }
    };
    
    validateTTSRequest(request);

    // Check rate limits
    this.resetRateLimit();
    const rateLimitCheck = checkRateLimit(text, this.requestsInMinute);
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.reason);
    }

    // Make request
    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey
      },
      body: JSON.stringify(request)
    });

    this.requestsInMinute++;

    // Handle errors
    if (!response.ok) {
      const error = await parseElevenLabsError(response);
      throw handleElevenLabsError(error);
    }

    // Return audio data
    return response.arrayBuffer();
  }

  async getVoices(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        'xi-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      const error = await parseElevenLabsError(response);
      throw handleElevenLabsError(error);
    }

    const data = await response.json();
    return data.voices || [];
  }
}

// Export for testing
export const testingUtils = {
  parseElevenLabsError,
  handleElevenLabsError,
  validateTTSRequest,
  validateVoiceId,
  validateApiKey,
  estimateTokenCount,
  checkRateLimit
};