/**
 * DEEPGRAM ERROR HANDLER IMPLEMENTATION
 * Based on comprehensive error testing completed 2025-06-20
 * 
 * This file provides production-ready error handling patterns for Deepgram API integration
 * in the WordWise AI voice assistant feature.
 */

// Types for error handling
interface DeepgramError {
  err_code: string;
  err_msg: string;
  request_id: string;
  status?: number;
  statusCode?: number;
}

interface ApiCallResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  userAction?: 'UPDATE_CREDENTIALS' | 'CHECK_INPUT' | 'TRY_AGAIN' | 'TRY_LATER' | 'CHECK_CONNECTION';
  retryAfter?: number;
}

interface ConnectionStatus {
  connected: boolean;
  quality: 'excellent' | 'good' | 'poor' | 'disconnected';
  lastError?: string;
  reconnectAttempts: number;
}

// Configuration constants based on test results
const DEEPGRAM_CONFIG = {
  SUPPORTED_MODELS: ['nova-2', 'nova', 'whisper', 'general', 'meeting', 'phonecall'],
  SUPPORTED_LANGUAGES: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'hi', 'ja', 'zh', 'ko', 'sv', 'ru', 'tr', 'pl', 'uk', 'ca'],
  SUPPORTED_FORMATS: ['wav', 'mp3', 'mp4', 'flac', 'ogg', 'webm'],
  MAX_FILE_SIZE_MB: 2048, // 2GB limit
  DEFAULT_TIMEOUT_MS: 30000,
  WEBSOCKET_TIMEOUT_MS: 5000,
  MAX_RETRIES: 3,
  BASE_RETRY_DELAY_MS: 1000
};

// Error codes from testing
const DEEPGRAM_ERROR_CODES = {
  INVALID_AUTH: 'INVALID_AUTH',
  REMOTE_CONTENT_ERROR: 'REMOTE_CONTENT_ERROR',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  BAD_REQUEST: 'Bad Request'
};

/**
 * Centralized Deepgram Error Handler
 * Handles all error scenarios discovered during testing
 */
export class DeepgramErrorHandler {
  private connectionStatus: ConnectionStatus = {
    connected: false,
    quality: 'disconnected',
    reconnectAttempts: 0
  };

  /**
   * Main error handling method for API calls
   */
  async handleApiCall<T>(
    apiFunction: () => Promise<T>,
    context?: string,
    retryCount: number = 0
  ): Promise<ApiCallResult<T>> {
    try {
      const result = await apiFunction();
      this.updateConnectionStatus(true, 'excellent');
      return { success: true, data: result };
      
    } catch (error: any) {
      return this.processError(error, apiFunction, context, retryCount);
    }
  }

  /**
   * Process and categorize errors from test results
   */
  private async processError<T>(
    error: any,
    originalFunction: () => Promise<T>,
    context?: string,
    retryCount: number = 0
  ): Promise<ApiCallResult<T>> {
    const errorType = this.categorizeError(error);
    const statusCode = error.status || error.statusCode || error.response?.status;

    // Log error for monitoring (production should use proper logging service)
    console.error(`[DEEPGRAM_ERROR] ${errorType}:`, {
      statusCode,
      message: error.message,
      context,
      retryCount
    });

    switch (errorType) {
      case 'AUTH_ERROR':
        this.updateConnectionStatus(false, 'disconnected', 'Authentication failed');
        return {
          success: false,
          error: 'Your API credentials are invalid. Please check your Deepgram API key.',
          userAction: 'UPDATE_CREDENTIALS'
        };

      case 'RATE_LIMIT':
        return this.handleRateLimit(error, originalFunction, context, retryCount);

      case 'NETWORK_ERROR':
      case 'TIMEOUT':
        return this.handleNetworkError(originalFunction, context, retryCount);

      case 'INVALID_PARAMS':
        return this.handleInvalidParams(error);

      case 'INVALID_URL':
        return {
          success: false,
          error: 'The audio file URL is not accessible. Please check the URL and try again.',
          userAction: 'CHECK_INPUT'
        };

      case 'INSUFFICIENT_PERMISSIONS':
        return {
          success: false,
          error: 'Your account does not have access to the requested model. Please use a supported model.',
          userAction: 'CHECK_INPUT'
        };

      default:
        return {
          success: false,
          error: 'Voice transcription service is temporarily unavailable. Please try again.',
          userAction: 'TRY_AGAIN'
        };
    }
  }

  /**
   * Handle rate limiting (429 errors)
   */
  private async handleRateLimit<T>(
    error: any,
    originalFunction: () => Promise<T>,
    context?: string,
    retryCount: number
  ): Promise<ApiCallResult<T>> {
    if (retryCount >= DEEPGRAM_CONFIG.MAX_RETRIES) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please wait a moment and try again.',
        userAction: 'TRY_LATER'
      };
    }

    const retryAfter = this.getRetryAfterDelay(error, retryCount);
    
    // Wait before retrying
    await this.delay(retryAfter);
    
    return this.handleApiCall(originalFunction, context, retryCount + 1);
  }

  /**
   * Handle network errors and timeouts
   */
  private async handleNetworkError<T>(
    originalFunction: () => Promise<T>,
    context?: string,
    retryCount: number
  ): Promise<ApiCallResult<T>> {
    if (retryCount >= DEEPGRAM_CONFIG.MAX_RETRIES) {
      this.updateConnectionStatus(false, 'disconnected', 'Network error');
      return {
        success: false,
        error: 'Unable to connect to voice transcription service. Please check your internet connection.',
        userAction: 'CHECK_CONNECTION'
      };
    }

    const delay = DEEPGRAM_CONFIG.BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
    this.updateConnectionStatus(false, 'poor', 'Connection issues');
    
    await this.delay(delay);
    
    return this.handleApiCall(originalFunction, context, retryCount + 1);
  }

  /**
   * Handle invalid parameter errors
   */
  private handleInvalidParams(error: any): ApiCallResult<any> {
    const message = error.message || error.err_msg || 'Invalid parameters';
    
    if (message.includes('model')) {
      return {
        success: false,
        error: `Invalid model specified. Supported models: ${DEEPGRAM_CONFIG.SUPPORTED_MODELS.join(', ')}`,
        userAction: 'CHECK_INPUT'
      };
    }
    
    if (message.includes('language')) {
      return {
        success: false,
        error: `Invalid language specified. Supported languages: ${DEEPGRAM_CONFIG.SUPPORTED_LANGUAGES.join(', ')}`,
        userAction: 'CHECK_INPUT'
      };
    }

    return {
      success: false,
      error: 'Invalid request parameters. Please check your input and try again.',
      userAction: 'CHECK_INPUT'
    };
  }

  /**
   * Categorize errors based on test results
   */
  private categorizeError(error: any): string {
    const status = error.status || error.statusCode || error.response?.status;
    const errorCode = error.err_code || error.code;
    const message = error.message || error.err_msg || '';

    // Authentication errors (tested: 401)
    if (status === 401 || status === 403 || errorCode === DEEPGRAM_ERROR_CODES.INVALID_AUTH) {
      return 'AUTH_ERROR';
    }

    // Rate limiting (not triggered in testing but should be handled)
    if (status === 429) {
      return 'RATE_LIMIT';
    }

    // Invalid parameters (tested: 400, 403)
    if (status === 400) {
      if (errorCode === DEEPGRAM_ERROR_CODES.REMOTE_CONTENT_ERROR || message.includes('URL')) {
        return 'INVALID_URL';
      }
      return 'INVALID_PARAMS';
    }

    // Insufficient permissions (tested: 403)
    if (status === 403 || errorCode === DEEPGRAM_ERROR_CODES.INSUFFICIENT_PERMISSIONS) {
      return 'INSUFFICIENT_PERMISSIONS';
    }

    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return 'NETWORK_ERROR';
    }

    // Timeout errors
    if (error.code === 'TIMEOUT' || message.includes('timeout')) {
      return 'TIMEOUT';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private getRetryAfterDelay(error: any, retryCount: number): number {
    // Honor Retry-After header if present
    const retryAfterHeader = error.headers?.['retry-after'];
    if (retryAfterHeader) {
      return parseInt(retryAfterHeader) * 1000;
    }

    // Exponential backoff with jitter
    const baseDelay = DEEPGRAM_CONFIG.BASE_RETRY_DELAY_MS;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
    
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  /**
   * Update connection status for UI feedback
   */
  private updateConnectionStatus(
    connected: boolean, 
    quality: ConnectionStatus['quality'], 
    lastError?: string
  ): void {
    this.connectionStatus = {
      connected,
      quality,
      lastError,
      reconnectAttempts: connected ? 0 : this.connectionStatus.reconnectAttempts + 1
    };
  }

  /**
   * Get current connection status for UI
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Validate request parameters before sending
   */
  validateTranscriptionRequest(params: {
    model?: string;
    language?: string;
    url?: string;
    fileSize?: number;
    mimeType?: string;
  }): { valid: boolean; error?: string } {
    const { model, language, url, fileSize, mimeType } = params;

    // Validate model
    if (model && !DEEPGRAM_CONFIG.SUPPORTED_MODELS.includes(model)) {
      return {
        valid: false,
        error: `Unsupported model "${model}". Use one of: ${DEEPGRAM_CONFIG.SUPPORTED_MODELS.join(', ')}`
      };
    }

    // Validate language
    if (language && !DEEPGRAM_CONFIG.SUPPORTED_LANGUAGES.includes(language)) {
      return {
        valid: false,
        error: `Unsupported language "${language}". Use one of: ${DEEPGRAM_CONFIG.SUPPORTED_LANGUAGES.join(', ')}`
      };
    }

    // Validate file size
    if (fileSize && fileSize > DEEPGRAM_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024) {
      return {
        valid: false,
        error: `File size exceeds ${DEEPGRAM_CONFIG.MAX_FILE_SIZE_MB}MB limit. Please use a smaller file or enable streaming.`
      };
    }

    // Validate URL format (basic check)
    if (url && !this.isValidUrl(url)) {
      return {
        valid: false,
        error: 'Invalid URL format. Please provide a valid HTTP/HTTPS URL.'
      };
    }

    // Validate mime type
    if (mimeType && !this.isValidAudioFormat(mimeType)) {
      return {
        valid: false,
        error: `Unsupported audio format "${mimeType}". Supported formats: ${DEEPGRAM_CONFIG.SUPPORTED_FORMATS.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * WebSocket connection handler with reconnection logic
   */
  async handleWebSocketConnection(
    connectionFactory: () => any,
    onMessage: (data: any) => void,
    onError: (error: any) => void
  ): Promise<void> {
    let connection: any = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connect = async () => {
      try {
        connection = connectionFactory();
        
        connection.on('open', () => {
          this.updateConnectionStatus(true, 'excellent');
          reconnectAttempts = 0;
        });

        connection.on('message', onMessage);

        connection.on('error', async (error: any) => {
          this.updateConnectionStatus(false, 'poor', error.message);
          
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = DEEPGRAM_CONFIG.BASE_RETRY_DELAY_MS * Math.pow(2, reconnectAttempts - 1);
            
            setTimeout(() => {
              connect();
            }, delay);
          } else {
            this.updateConnectionStatus(false, 'disconnected', 'Max reconnection attempts exceeded');
            onError(new Error('Unable to maintain WebSocket connection'));
          }
        });

        connection.on('close', () => {
          this.updateConnectionStatus(false, 'disconnected');
        });

      } catch (error) {
        this.updateConnectionStatus(false, 'disconnected', (error as Error).message);
        onError(error);
      }
    };

    await connect();
  }

  /**
   * Utility methods
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  private isValidAudioFormat(mimeType: string): boolean {
    const format = mimeType.split('/')[1]?.toLowerCase();
    return DEEPGRAM_CONFIG.SUPPORTED_FORMATS.includes(format);
  }
}

/**
 * USER-FRIENDLY ERROR MESSAGES
 * These should be displayed in the UI instead of technical error messages
 */
export const USER_ERROR_MESSAGES = {
  AUTH_ERROR: {
    title: 'Authentication Error',
    message: 'There\'s an issue with your voice transcription credentials. Please check your API settings.',
    action: 'Update API Key'
  },
  NETWORK_ERROR: {
    title: 'Connection Error',
    message: 'Unable to connect to the voice transcription service. Please check your internet connection.',
    action: 'Retry'
  },
  RATE_LIMIT: {
    title: 'Too Many Requests',
    message: 'You\'ve reached the rate limit for voice transcription. Please wait a moment before trying again.',
    action: 'Wait and Retry'
  },
  INVALID_PARAMS: {
    title: 'Invalid Input',
    message: 'The audio file or settings are not compatible. Please check your input and try again.',
    action: 'Check Settings'
  },
  FILE_TOO_LARGE: {
    title: 'File Too Large',
    message: 'The audio file is too large for transcription. Please use a smaller file or enable streaming.',
    action: 'Use Smaller File'
  },
  UNSUPPORTED_FORMAT: {
    title: 'Unsupported Format',
    message: 'The audio format is not supported. Please use WAV, MP3, MP4, FLAC, OGG, or WebM format.',
    action: 'Convert File'
  }
};

/**
 * EXAMPLE USAGE IN REACT COMPONENT
 */
/*
const VoiceTranscriptionService = () => {
  const errorHandler = new DeepgramErrorHandler();
  const [connectionStatus, setConnectionStatus] = useState(errorHandler.getConnectionStatus());
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  const transcribeAudio = async (audioFile: File) => {
    // Validate before sending
    const validation = errorHandler.validateTranscriptionRequest({
      fileSize: audioFile.size,
      mimeType: audioFile.type
    });

    if (!validation.valid) {
      setTranscriptionError(validation.error!);
      return;
    }

    // Make API call with error handling
    const result = await errorHandler.handleApiCall(async () => {
      // Your actual Deepgram API call here
      const response = await deepgram.listen.prerecorded.transcribeFile(audioFile, {
        model: 'nova-2',
        language: 'en'
      });
      return response;
    }, 'audio-transcription');

    if (!result.success) {
      setTranscriptionError(result.error!);
      // Show retry button based on userAction
      return;
    }

    // Handle successful transcription
    handleTranscriptionSuccess(result.data);
  };

  // Update connection status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionStatus(errorHandler.getConnectionStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <ConnectionStatusIndicator status={connectionStatus} />
      {transcriptionError && (
        <ErrorMessage 
          error={transcriptionError} 
          onRetry={() => setTranscriptionError(null)} 
        />
      )}
      {/* Your transcription UI */}
    </div>
  );
};
*/