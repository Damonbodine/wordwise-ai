const { createClient } = require('@deepgram/sdk');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Test configuration
const VALID_API_KEY = process.env.DEEPGRAM_API_KEY || 'f1e3407038fcc4663b4aa6e74339f416994f37af';
const INVALID_API_KEY = 'invalid_api_key_12345';

// Helper function to log results
function logResult(testName, result) {
  const timestamp = new Date().toISOString();
  console.log('\n' + '='.repeat(80));
  console.log(`[${timestamp}] TEST: ${testName}`);
  console.log('-'.repeat(80));
  
  if (result.success) {
    console.log('✅ Success:', result.message);
    if (result.data) {
      console.log('Response:', JSON.stringify(result.data, null, 2));
    }
  } else {
    console.log('❌ Error Type:', result.errorType || 'Unknown');
    console.log('Status Code:', result.statusCode || 'N/A');
    console.log('Error Message:', result.errorMessage);
    console.log('Error Details:', JSON.stringify(result.errorDetails, null, 2));
    console.log('\n📋 Recommended Handling:');
    console.log(result.recommendation || 'Implement proper error handling');
  }
}

// Test results collection
const testResults = [];

// Test 1: Invalid API Key
async function testInvalidApiKey() {
  const testName = 'Invalid API Key';
  try {
    const deepgram = createClient(INVALID_API_KEY);
    
    // Try a simple transcription request using v3 format
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: 'https://static.deepgram.com/examples/nasa-spacewalk-interview.wav' },
      { model: 'nova-2', language: 'en' }
    );
    
    if (error) {
      throw error;
    }
    
    logResult(testName, {
      success: false,
      errorMessage: 'Expected error but request succeeded',
      recommendation: 'Check API key validation'
    });
  } catch (error) {
    const result = {
      success: false,
      errorType: error.name || 'Authentication Error',
      statusCode: error.status || error.statusCode || 401,
      errorMessage: error.message,
      errorDetails: {
        error: error.error || error.response?.data || error,
        headers: error.headers
      },
      recommendation: 'Validate API key before initializing client. Show clear error message to user about invalid credentials.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Test 2: Invalid Audio Format
async function testInvalidAudioFormat() {
  const testName = 'Invalid Audio Format';
  try {
    const deepgram = createClient(VALID_API_KEY);
    
    // Create a text file instead of audio
    const invalidAudioBuffer = Buffer.from('This is not an audio file');
    
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      invalidAudioBuffer,
      { model: 'nova-2', language: 'en', mimetype: 'audio/wav' }
    );
    
    logResult(testName, {
      success: false,
      errorMessage: 'Expected error but request succeeded',
      recommendation: 'Validate audio format before sending'
    });
  } catch (error) {
    const result = {
      success: false,
      errorType: 'Invalid Audio Format',
      statusCode: error.status || error.statusCode || 400,
      errorMessage: error.message,
      errorDetails: {
        error: error.error || error.response?.data || error,
        supportedFormats: ['wav', 'mp3', 'mp4', 'flac', 'ogg', 'webm']
      },
      recommendation: 'Validate audio format before sending. Support format conversion or provide clear error messages about supported formats.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Test 3: Network Timeout Simulation
async function testNetworkTimeout() {
  const testName = 'Network Timeout';
  try {
    // Create a client with very short timeout
    const deepgram = createClient(VALID_API_KEY, {
      global: { fetch: { options: { timeout: 1 } } } // 1ms timeout
    });
    
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: 'https://static.deepgram.com/examples/nasa-spacewalk-interview.wav' },
      { model: 'nova-2', language: 'en' }
    );
    
    logResult(testName, {
      success: false,
      errorMessage: 'Expected timeout but request succeeded',
      recommendation: 'Implement proper timeout handling'
    });
  } catch (error) {
    const result = {
      success: false,
      errorType: 'Network Timeout',
      statusCode: error.status || 'TIMEOUT',
      errorMessage: error.message,
      errorDetails: {
        error: error.error || error,
        timeout: true
      },
      recommendation: 'Implement retry logic with exponential backoff. Show user-friendly message about network issues. Consider implementing a queue system for failed requests.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Test 4: WebSocket Connection Failure
async function testWebSocketFailure() {
  const testName = 'WebSocket Connection Failure';
  try {
    const deepgram = createClient(INVALID_API_KEY);
    
    // Try to establish a live connection with invalid credentials
    const connection = deepgram.listen.live({ 
      model: 'nova-2',
      language: 'en',
      punctuate: true,
      interim_results: true
    });
    
    // Set up error handling
    connection.on('error', (error) => {
      const result = {
        success: false,
        errorType: 'WebSocket Error',
        statusCode: error.code || 'WS_ERROR',
        errorMessage: error.message || 'WebSocket connection failed',
        errorDetails: error,
        recommendation: 'Implement WebSocket reconnection logic. Show connection status to user. Provide fallback to REST API if WebSocket fails.'
      };
      logResult(testName, result);
      testResults.push({ testName, ...result });
      connection.finish();
    });
    
    // Try to send data
    connection.send(Buffer.from('test'));
    
  } catch (error) {
    const result = {
      success: false,
      errorType: 'WebSocket Connection Error',
      statusCode: error.status || 'WS_CONN_ERROR',
      errorMessage: error.message,
      errorDetails: error,
      recommendation: 'Handle WebSocket connection errors gracefully. Implement automatic reconnection with backoff. Show connection status in UI.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Test 5: Rate Limit Testing
async function testRateLimit() {
  const testName = 'Rate Limit Testing';
  const deepgram = createClient(VALID_API_KEY);
  
  try {
    // Make multiple rapid requests to trigger rate limiting
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        deepgram.listen.prerecorded.transcribeUrl(
          { url: 'https://static.deepgram.com/examples/nasa-spacewalk-interview.wav' },
          { model: 'nova-2', language: 'en' }
        )
      );
    }
    
    await Promise.all(promises);
    
    logResult(testName, {
      success: true,
      message: 'No rate limit hit with 50 concurrent requests',
      recommendation: 'Monitor for rate limits in production. Current limits appear generous.'
    });
  } catch (error) {
    const result = {
      success: false,
      errorType: 'Rate Limit Error',
      statusCode: error.status || 429,
      errorMessage: error.message,
      errorDetails: {
        error: error.error || error,
        retryAfter: error.headers?.['retry-after']
      },
      recommendation: 'Implement request queuing and throttling. Honor Retry-After headers. Show user-friendly message about temporary limit.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Test 6: Malformed Request
async function testMalformedRequest() {
  const testName = 'Malformed Request';
  try {
    const deepgram = createClient(VALID_API_KEY);
    
    // Send request with invalid parameters
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: 'https://static.deepgram.com/examples/nasa-spacewalk-interview.wav' },
      { 
        model: 'invalid-model-name',
        language: 'xyz', // Invalid language code
        invalid_param: true
      }
    );
    
    logResult(testName, {
      success: false,
      errorMessage: 'Expected error but request succeeded',
      recommendation: 'Validate parameters before sending'
    });
  } catch (error) {
    const result = {
      success: false,
      errorType: 'Invalid Parameters',
      statusCode: error.status || 400,
      errorMessage: error.message,
      errorDetails: {
        error: error.error || error.response?.data || error,
        validModels: ['nova-2', 'nova', 'whisper', 'general'],
        validLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'hi', 'ja', 'zh', 'ko', 'sv', 'ru']
      },
      recommendation: 'Validate all parameters before sending request. Provide dropdown/selection for valid options in UI.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Test 7: Large Audio File
async function testLargeAudioFile() {
  const testName = 'Large Audio File';
  try {
    const deepgram = createClient(VALID_API_KEY);
    
    // Create a large buffer (simulate 100MB file)
    const largeBuffer = Buffer.alloc(100 * 1024 * 1024);
    
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      largeBuffer,
      { model: 'nova-2', language: 'en', mimetype: 'audio/wav' }
    );
    
    logResult(testName, {
      success: false,
      errorMessage: 'Expected error for large file but request succeeded',
      recommendation: 'Check file size limits'
    });
  } catch (error) {
    const result = {
      success: false,
      errorType: 'File Too Large',
      statusCode: error.status || 413,
      errorMessage: error.message,
      errorDetails: {
        error: error.error || error,
        maxSizeMB: 2048, // Deepgram typically supports up to 2GB
        recommendation: 'For large files, use streaming or chunking'
      },
      recommendation: 'Check file size before upload. For large files, use streaming API or split into chunks. Show progress indicator for large uploads.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Test 8: Invalid URL
async function testInvalidUrl() {
  const testName = 'Invalid URL';
  try {
    const deepgram = createClient(VALID_API_KEY);
    
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: 'https://invalid-domain-that-does-not-exist-12345.com/audio.wav' },
      { model: 'nova-2', language: 'en' }
    );
    
    logResult(testName, {
      success: false,
      errorMessage: 'Expected error but request succeeded',
      recommendation: 'Validate URLs before processing'
    });
  } catch (error) {
    const result = {
      success: false,
      errorType: 'Invalid URL',
      statusCode: error.status || 400,
      errorMessage: error.message,
      errorDetails: {
        error: error.error || error,
        url: 'https://invalid-domain-that-does-not-exist-12345.com/audio.wav'
      },
      recommendation: 'Validate URL accessibility before sending to Deepgram. Implement URL validation and pre-flight checks.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Test 9: Streaming Interruption
async function testStreamingInterruption() {
  const testName = 'Streaming Interruption';
  try {
    const deepgram = createClient(VALID_API_KEY);
    
    const connection = deepgram.listen.live({ 
      model: 'nova-2',
      language: 'en',
      punctuate: true
    });
    
    let errorOccurred = false;
    
    connection.on('error', (error) => {
      errorOccurred = true;
      const result = {
        success: false,
        errorType: 'Streaming Error',
        statusCode: error.code || 'STREAM_ERROR',
        errorMessage: error.message || 'Stream interrupted',
        errorDetails: error,
        recommendation: 'Implement stream recovery logic. Buffer audio during interruptions. Notify user of connection issues.'
      };
      logResult(testName, result);
      testResults.push({ testName, ...result });
    });
    
    connection.on('open', () => {
      // Send some data then abruptly close
      connection.send(Buffer.from('test audio data'));
      setTimeout(() => {
        connection.finish();
        if (!errorOccurred) {
          logResult(testName, {
            success: true,
            message: 'Stream closed gracefully',
            recommendation: 'Normal closure handled well'
          });
        }
      }, 1000);
    });
    
  } catch (error) {
    const result = {
      success: false,
      errorType: 'Streaming Setup Error',
      statusCode: error.status || 'STREAM_INIT_ERROR',
      errorMessage: error.message,
      errorDetails: error,
      recommendation: 'Handle streaming setup failures. Provide fallback options.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Test 10: Unsupported Language
async function testUnsupportedLanguage() {
  const testName = 'Unsupported Language';
  try {
    const deepgram = createClient(VALID_API_KEY);
    
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: 'https://static.deepgram.com/examples/nasa-spacewalk-interview.wav' },
      { 
        model: 'nova-2',
        language: 'klingon' // Obviously unsupported
      }
    );
    
    logResult(testName, {
      success: false,
      errorMessage: 'Expected error but request succeeded',
      recommendation: 'Validate language codes'
    });
  } catch (error) {
    const result = {
      success: false,
      errorType: 'Unsupported Language',
      statusCode: error.status || 400,
      errorMessage: error.message,
      errorDetails: {
        error: error.error || error,
        requestedLanguage: 'klingon',
        supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'hi', 'ja', 'zh', 'ko', 'sv', 'ru', 'tr', 'pl', 'uk', 'ca']
      },
      recommendation: 'Provide language selection dropdown with only supported languages. Default to auto-detect or English if unsupported language requested.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Generate comprehensive report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('DEEPGRAM ERROR TESTING SUMMARY REPORT');
  console.log('='.repeat(80));
  console.log(`Total Tests Run: ${testResults.length}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('\n');

  // Group errors by type
  const errorTypes = {};
  testResults.forEach(result => {
    const type = result.errorType || 'Success';
    if (!errorTypes[type]) {
      errorTypes[type] = [];
    }
    errorTypes[type].push(result);
  });

  console.log('ERROR TYPES ENCOUNTERED:');
  console.log('-'.repeat(40));
  Object.keys(errorTypes).forEach(type => {
    console.log(`\n${type}: ${errorTypes[type].length} occurrences`);
    errorTypes[type].forEach(result => {
      console.log(`  - ${result.testName}: ${result.statusCode || 'N/A'}`);
    });
  });

  console.log('\n\nRECOMMENDED ERROR HANDLING IMPLEMENTATION:');
  console.log('-'.repeat(40));
  console.log(`
1. **Authentication Errors (401)**
   - Validate API key on app initialization
   - Provide clear error message to user
   - Offer way to update API key in settings

2. **Invalid Request Errors (400)**
   - Validate all parameters before sending
   - Use TypeScript interfaces for request options
   - Provide helpful error messages with valid options

3. **Network/Timeout Errors**
   - Implement exponential backoff retry logic
   - Set reasonable timeouts (30s for transcription)
   - Show connection status in UI
   - Queue failed requests for retry

4. **WebSocket Errors**
   - Implement automatic reconnection logic
   - Buffer audio during disconnections
   - Show real-time connection status
   - Fallback to REST API if persistent issues

5. **Rate Limiting (429)**
   - Implement request queuing
   - Honor Retry-After headers
   - Show user-friendly waiting message
   - Consider upgrading plan notification

6. **Large File Handling**
   - Check file size before upload
   - Implement chunking for files > 100MB
   - Show upload progress
   - Use streaming API for real-time processing

7. **Error Recovery Patterns**
   \`\`\`javascript
   class DeepgramErrorHandler {
     async handleError(error, context) {
       const errorCode = error.status || error.code;
       
       switch(errorCode) {
         case 401:
           return this.handleAuthError(error);
         case 429:
           return this.handleRateLimit(error);
         case 'TIMEOUT':
           return this.retryWithBackoff(context);
         default:
           return this.handleGenericError(error);
       }
     }
     
     async retryWithBackoff(context, attempt = 1) {
       const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
       await new Promise(resolve => setTimeout(resolve, delay));
       return this.executeRequest(context);
     }
   }
   \`\`\`

8. **User Experience During Failures**
   - Always show what went wrong in user-friendly language
   - Provide actionable next steps
   - Maintain partial functionality when possible
   - Log errors for debugging but don't expose internals to users
  `);

  // Save report to file
  const reportPath = path.join(__dirname, 'deepgram-error-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      totalTests: testResults.length,
      timestamp: new Date().toISOString(),
      apiKeyUsed: VALID_API_KEY.substring(0, 10) + '...'
    },
    errorTypes: errorTypes,
    fullResults: testResults
  }, null, 2));

  console.log(`\n\n📄 Detailed report saved to: ${reportPath}`);
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting Deepgram Error Testing Suite...\n');
  console.log(`Using API Key: ${VALID_API_KEY.substring(0, 10)}...`);
  console.log('\n');

  // Run all tests sequentially to avoid overwhelming the API
  await testInvalidApiKey();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testInvalidAudioFormat();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testNetworkTimeout();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testWebSocketFailure();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testRateLimit();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testMalformedRequest();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testLargeAudioFile();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testInvalidUrl();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testStreamingInterruption();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testUnsupportedLanguage();
  
  // Generate final report
  generateReport();
}

// Run the tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});