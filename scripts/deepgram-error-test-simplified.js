const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Test configuration
const VALID_API_KEY = process.env.DEEPGRAM_API_KEY || 'f1e3407038fcc4663b4aa6e74339f416994f37af';
const INVALID_API_KEY = 'invalid_api_key_12345';

// Test results collection
const testResults = [];

// Helper function to make HTTP requests to Deepgram API
function makeDeepgramRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

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

// Test 1: Invalid API Key
async function testInvalidApiKey() {
  const testName = 'Invalid API Key';
  try {
    const options = {
      hostname: 'api.deepgram.com',
      port: 443,
      path: '/v1/listen',
      method: 'POST',
      headers: {
        'Authorization': `Token ${INVALID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    const requestData = JSON.stringify({
      url: 'https://static.deepgram.com/examples/nasa-spacewalk-interview.wav'
    });
    
    const response = await makeDeepgramRequest(options, requestData);
    
    const result = {
      success: false,
      errorType: 'Authentication Error',
      statusCode: response.statusCode,
      errorMessage: response.data.err_msg || 'Invalid API key',
      errorDetails: response.data,
      recommendation: 'Validate API key before initializing client. Show clear error message to user about invalid credentials.'
    };
    
    logResult(testName, result);
    testResults.push({ testName, ...result });
    
  } catch (error) {
    const result = {
      success: false,
      errorType: 'Network Error',
      statusCode: 'NETWORK_ERROR',
      errorMessage: error.message,
      errorDetails: error,
      recommendation: 'Handle network errors with retry logic and user-friendly messages.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Test 2: Valid Request (Baseline)
async function testValidRequest() {
  const testName = 'Valid Request (Baseline)';
  try {
    const options = {
      hostname: 'api.deepgram.com',
      port: 443,
      path: '/v1/listen?model=nova-2&language=en',
      method: 'POST',
      headers: {
        'Authorization': `Token ${VALID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    const requestData = JSON.stringify({
      url: 'https://static.deepgram.com/examples/nasa-spacewalk-interview.wav'
    });
    
    const response = await makeDeepgramRequest(options, requestData);
    
    if (response.statusCode === 200) {
      logResult(testName, {
        success: true,
        message: 'API key and request format working correctly',
        data: response.data
      });
    } else {
      const result = {
        success: false,
        errorType: 'Unexpected Error',
        statusCode: response.statusCode,
        errorMessage: response.data.err_msg || 'Unexpected response',
        errorDetails: response.data,
        recommendation: 'Investigate API changes or check request format.'
      };
      logResult(testName, result);
      testResults.push({ testName, ...result });
    }
    
  } catch (error) {
    const result = {
      success: false,
      errorType: 'Network Error',
      statusCode: 'NETWORK_ERROR',
      errorMessage: error.message,
      errorDetails: error,
      recommendation: 'Handle network errors with retry logic.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Test 3: Invalid URL
async function testInvalidUrl() {
  const testName = 'Invalid Audio URL';
  try {
    const options = {
      hostname: 'api.deepgram.com',
      port: 443,
      path: '/v1/listen?model=nova-2&language=en',
      method: 'POST',
      headers: {
        'Authorization': `Token ${VALID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    const requestData = JSON.stringify({
      url: 'https://invalid-domain-12345.com/nonexistent.wav'
    });
    
    const response = await makeDeepgramRequest(options, requestData);
    
    const result = {
      success: false,
      errorType: 'Invalid URL',
      statusCode: response.statusCode,
      errorMessage: response.data.err_msg || 'Invalid URL provided',
      errorDetails: response.data,
      recommendation: 'Validate URL accessibility before sending to Deepgram. Implement URL pre-flight checks.'
    };
    
    logResult(testName, result);
    testResults.push({ testName, ...result });
    
  } catch (error) {
    const result = {
      success: false,
      errorType: 'Network Error',
      statusCode: 'NETWORK_ERROR',
      errorMessage: error.message,
      errorDetails: error,
      recommendation: 'Handle network errors gracefully.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Test 4: Invalid Model
async function testInvalidModel() {
  const testName = 'Invalid Model Parameter';
  try {
    const options = {
      hostname: 'api.deepgram.com',
      port: 443,
      path: '/v1/listen?model=invalid-model&language=en',
      method: 'POST',
      headers: {
        'Authorization': `Token ${VALID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    const requestData = JSON.stringify({
      url: 'https://static.deepgram.com/examples/nasa-spacewalk-interview.wav'
    });
    
    const response = await makeDeepgramRequest(options, requestData);
    
    const result = {
      success: false,
      errorType: 'Invalid Parameters',
      statusCode: response.statusCode,
      errorMessage: response.data.err_msg || 'Invalid model specified',
      errorDetails: {
        ...response.data,
        validModels: ['nova-2', 'nova', 'whisper', 'general', 'meeting', 'phonecall']
      },
      recommendation: 'Validate all parameters before sending request. Provide dropdown/selection for valid options in UI.'
    };
    
    logResult(testName, result);
    testResults.push({ testName, ...result });
    
  } catch (error) {
    const result = {
      success: false,
      errorType: 'Network Error',
      statusCode: 'NETWORK_ERROR',
      errorMessage: error.message,
      errorDetails: error,
      recommendation: 'Handle network errors gracefully.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Test 5: Invalid Language
async function testInvalidLanguage() {
  const testName = 'Invalid Language Parameter';
  try {
    const options = {
      hostname: 'api.deepgram.com',
      port: 443,
      path: '/v1/listen?model=nova-2&language=klingon',
      method: 'POST',
      headers: {
        'Authorization': `Token ${VALID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    const requestData = JSON.stringify({
      url: 'https://static.deepgram.com/examples/nasa-spacewalk-interview.wav'
    });
    
    const response = await makeDeepgramRequest(options, requestData);
    
    const result = {
      success: false,
      errorType: 'Invalid Language',
      statusCode: response.statusCode,
      errorMessage: response.data.err_msg || 'Invalid language specified',
      errorDetails: {
        ...response.data,
        requestedLanguage: 'klingon',
        supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'hi', 'ja', 'zh', 'ko', 'sv', 'ru', 'tr', 'pl', 'uk', 'ca']
      },
      recommendation: 'Provide language selection dropdown with only supported languages. Default to auto-detect or English if unsupported language requested.'
    };
    
    logResult(testName, result);
    testResults.push({ testName, ...result });
    
  } catch (error) {
    const result = {
      success: false,
      errorType: 'Network Error',
      statusCode: 'NETWORK_ERROR',
      errorMessage: error.message,
      errorDetails: error,
      recommendation: 'Handle network errors gracefully.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Test 6: Rate Limiting (Multiple Requests)
async function testRateLimit() {
  const testName = 'Rate Limit Testing';
  try {
    console.log('\n⏱️  Making multiple rapid requests to test rate limiting...');
    
    const promises = [];
    for (let i = 0; i < 20; i++) {
      const options = {
        hostname: 'api.deepgram.com',
        port: 443,
        path: '/v1/listen?model=nova-2&language=en',
        method: 'POST',
        headers: {
          'Authorization': `Token ${VALID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      };
      
      const requestData = JSON.stringify({
        url: 'https://static.deepgram.com/examples/nasa-spacewalk-interview.wav'
      });
      
      promises.push(makeDeepgramRequest(options, requestData));
    }
    
    const responses = await Promise.allSettled(promises);
    
    // Check for rate limit responses
    const rateLimitedResponses = responses.filter(r => 
      r.status === 'fulfilled' && r.value.statusCode === 429
    );
    
    if (rateLimitedResponses.length > 0) {
      const result = {
        success: false,
        errorType: 'Rate Limit Error',
        statusCode: 429,
        errorMessage: 'Rate limit exceeded',
        errorDetails: {
          totalRequests: 20,
          rateLimitedRequests: rateLimitedResponses.length,
          firstRateLimitResponse: rateLimitedResponses[0].value.data,
          retryAfter: rateLimitedResponses[0].value.headers['retry-after']
        },
        recommendation: 'Implement request queuing and throttling. Honor Retry-After headers. Show user-friendly message about temporary limit.'
      };
      logResult(testName, result);
      testResults.push({ testName, ...result });
    } else {
      logResult(testName, {
        success: true,
        message: `No rate limit hit with 20 concurrent requests. All responses: ${responses.map(r => r.status === 'fulfilled' ? r.value.statusCode : 'error').join(', ')}`,
        recommendation: 'Current rate limits appear generous for this API key tier.'
      });
    }
    
  } catch (error) {
    const result = {
      success: false,
      errorType: 'Network Error',
      statusCode: 'NETWORK_ERROR',
      errorMessage: error.message,
      errorDetails: error,
      recommendation: 'Handle network errors during bulk operations.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Test 7: WebSocket Connection Test
async function testWebSocketConnection() {
  const testName = 'WebSocket Connection Test';
  try {
    // Test WebSocket connection using the SDK
    const { createClient } = require('@deepgram/sdk');
    const deepgram = createClient(INVALID_API_KEY);
    
    return new Promise((resolve) => {
      try {
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
            errorType: 'WebSocket Authentication Error',
            statusCode: error.code || 'WS_AUTH_ERROR',
            errorMessage: error.message || 'WebSocket authentication failed',
            errorDetails: error,
            recommendation: 'Validate API key before establishing WebSocket connections. Show connection status to user.'
          };
          logResult(testName, result);
          testResults.push({ testName, ...result });
          resolve();
        });
        
        connection.on('open', () => {
          if (!errorOccurred) {
            logResult(testName, {
              success: false,
              errorMessage: 'Expected authentication error but connection opened',
              recommendation: 'Check WebSocket authentication'
            });
          }
          connection.requestClose();
          resolve();
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (!errorOccurred) {
            const result = {
              success: false,
              errorType: 'WebSocket Timeout',
              statusCode: 'TIMEOUT',
              errorMessage: 'WebSocket connection timed out',
              errorDetails: { timeout: 5000 },
              recommendation: 'Implement connection timeouts and retry logic for WebSocket connections.'
            };
            logResult(testName, result);
            testResults.push({ testName, ...result });
          }
          resolve();
        }, 5000);
        
      } catch (error) {
        const result = {
          success: false,
          errorType: 'WebSocket Setup Error',
          statusCode: 'WS_SETUP_ERROR',
          errorMessage: error.message,
          errorDetails: error,
          recommendation: 'Handle WebSocket setup failures gracefully.'
        };
        logResult(testName, result);
        testResults.push({ testName, ...result });
        resolve();
      }
    });
    
  } catch (error) {
    const result = {
      success: false,
      errorType: 'WebSocket Import Error',
      statusCode: 'IMPORT_ERROR',
      errorMessage: error.message,
      errorDetails: error,
      recommendation: 'Ensure Deepgram SDK is properly installed for WebSocket functionality.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Test 8: Network Timeout Simulation
async function testNetworkTimeout() {
  const testName = 'Network Timeout';
  try {
    const options = {
      hostname: 'api.deepgram.com',
      port: 443,
      path: '/v1/listen?model=nova-2&language=en',
      method: 'POST',
      headers: {
        'Authorization': `Token ${VALID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 1 // 1ms timeout to force timeout
    };
    
    const requestData = JSON.stringify({
      url: 'https://static.deepgram.com/examples/nasa-spacewalk-interview.wav'
    });
    
    const response = await makeDeepgramRequest(options, requestData);
    
    logResult(testName, {
      success: false,
      errorMessage: 'Expected timeout but request succeeded',
      recommendation: 'Test with more aggressive timeout settings'
    });
    
  } catch (error) {
    const result = {
      success: false,
      errorType: 'Network Timeout',
      statusCode: 'TIMEOUT',
      errorMessage: error.message,
      errorDetails: {
        error: error,
        timeout: true
      },
      recommendation: 'Implement retry logic with exponential backoff. Show user-friendly message about network issues. Consider implementing a queue system for failed requests.'
    };
    logResult(testName, result);
    testResults.push({ testName, ...result });
  }
}

// Generate comprehensive report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('DEEPGRAM ERROR TESTING COMPREHENSIVE REPORT');
  console.log('='.repeat(80));
  console.log(`Total Tests Run: ${testResults.length}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`API Key Used: ${VALID_API_KEY.substring(0, 10)}...`);
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
  console.log('-'.repeat(50));
  Object.keys(errorTypes).forEach(type => {
    console.log(`\n📊 ${type}: ${errorTypes[type].length} occurrences`);
    errorTypes[type].forEach(result => {
      console.log(`   └─ ${result.testName}: Status ${result.statusCode || 'N/A'}`);
    });
  });

  console.log('\n\n🛠️  PRODUCTION ERROR HANDLING RECOMMENDATIONS:');
  console.log('-'.repeat(60));
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                          ERROR HANDLING STRATEGY                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

1. 🔐 AUTHENTICATION ERRORS (401/403)
   ├─ Validate API key on app initialization
   ├─ Show clear error message: "Invalid API credentials"
   ├─ Provide settings UI to update API key
   └─ Don't expose actual API key in error messages

2. 📝 INVALID REQUEST ERRORS (400)
   ├─ Validate all parameters before sending
   ├─ Use TypeScript interfaces for request validation
   ├─ Provide helpful error messages with valid options
   └─ Implement client-side validation to prevent bad requests

3. 🌐 NETWORK/TIMEOUT ERRORS
   ├─ Implement exponential backoff retry logic
   ├─ Set reasonable timeouts (30s for transcription, 5s for real-time)
   ├─ Show connection status indicator in UI
   ├─ Queue failed requests for automatic retry
   └─ Provide offline mode with local fallback when possible

4. 🔌 WEBSOCKET ERRORS (Real-time streaming)
   ├─ Implement automatic reconnection with backoff
   ├─ Buffer audio during temporary disconnections
   ├─ Show real-time connection status (🟢 Connected, 🟡 Reconnecting, 🔴 Disconnected)
   ├─ Fallback to REST API for critical transcriptions
   └─ Handle different WebSocket close codes appropriately

5. ⏰ RATE LIMITING (429)
   ├─ Implement request queuing system
   ├─ Honor Retry-After headers from API
   ├─ Show user-friendly waiting message with countdown
   ├─ Consider plan upgrade notifications
   └─ Implement local caching to reduce API calls

6. 📁 LARGE FILE HANDLING
   ├─ Check file size before upload (limit: 2GB for Deepgram)
   ├─ Implement chunking for files > 100MB
   ├─ Show upload progress with cancel option
   ├─ Use streaming API for real-time processing
   └─ Compress audio files when possible

7. 🎵 AUDIO FORMAT VALIDATION
   ├─ Validate format before sending: wav, mp3, mp4, flac, ogg, webm
   ├─ Provide format conversion tools
   ├─ Show supported formats in file picker
   └─ Detect and handle corrupted audio files

8. 🌍 LANGUAGE SUPPORT
   ├─ Provide dropdown with supported languages only
   ├─ Default to auto-detect when unsupported language requested
   ├─ Show confidence scores for language detection
   └─ Handle multi-language content gracefully

╔══════════════════════════════════════════════════════════════════════════════╗
║                        IMPLEMENTATION PATTERN                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

class DeepgramErrorHandler {
  async handleApiCall(apiFunction, context, retryCount = 0) {
    const maxRetries = 3;
    const baseDelay = 1000;
    
    try {
      const result = await apiFunction();
      return { success: true, data: result };
      
    } catch (error) {
      const errorType = this.categorizeError(error);
      
      switch (errorType) {
        case 'RATE_LIMIT':
          if (retryCount < maxRetries) {
            const retryAfter = error.headers?.['retry-after'] * 1000 || baseDelay * Math.pow(2, retryCount);
            await this.delay(retryAfter);
            return this.handleApiCall(apiFunction, context, retryCount + 1);
          }
          break;
          
        case 'NETWORK_ERROR':
          if (retryCount < maxRetries) {
            await this.delay(baseDelay * Math.pow(2, retryCount));
            return this.handleApiCall(apiFunction, context, retryCount + 1);
          }
          break;
          
        case 'AUTH_ERROR':
          return { success: false, error: 'Please check your API credentials', userAction: 'UPDATE_CREDENTIALS' };
          
        case 'INVALID_PARAMS':
          return { success: false, error: 'Invalid request parameters', userAction: 'CHECK_INPUT' };
          
        default:
          return { success: false, error: 'Transcription service temporarily unavailable', userAction: 'TRY_AGAIN' };
      }
      
      return { success: false, error: 'Maximum retries exceeded', userAction: 'TRY_LATER' };
    }
  }
  
  categorizeError(error) {
    const status = error.status || error.statusCode;
    
    if (status === 401 || status === 403) return 'AUTH_ERROR';
    if (status === 429) return 'RATE_LIMIT';
    if (status === 400) return 'INVALID_PARAMS';
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') return 'NETWORK_ERROR';
    
    return 'UNKNOWN_ERROR';
  }
}

╔══════════════════════════════════════════════════════════════════════════════╗
║                           USER EXPERIENCE GUIDELINES                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

• Always show what went wrong in user-friendly language
• Provide actionable next steps ("Try again", "Check internet connection")
• Maintain partial functionality when possible
• Show progress indicators for long operations
• Log errors for debugging but never expose internal details to users
• Implement graceful degradation (fallback to basic features when API fails)
• Use toast notifications for temporary errors, modal dialogs for critical ones
• Provide retry buttons with intelligent enabling/disabling
  `);

  // Save detailed report to file
  const reportPath = path.join(__dirname, 'deepgram-error-report-detailed.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      totalTests: testResults.length,
      timestamp: new Date().toISOString(),
      apiKeyUsed: VALID_API_KEY.substring(0, 10) + '...',
      testEnvironment: 'Node.js Direct HTTP Requests'
    },
    errorTypes: errorTypes,
    fullResults: testResults,
    implementationRecommendations: {
      errorHandler: 'Implement centralized error handling class',
      userExperience: 'Focus on user-friendly error messages',
      retryLogic: 'Use exponential backoff with jitter',
      monitoring: 'Log all errors for analysis',
      fallbacks: 'Provide offline/degraded functionality'
    }
  }, null, 2));

  console.log(`\n\n📄 Detailed JSON report saved to: ${reportPath}`);
  console.log('\n🎯 Next Steps:');
  console.log('   1. Implement the DeepgramErrorHandler class in your voice assistant');
  console.log('   2. Add user-friendly error messages to your UI components');
  console.log('   3. Set up error monitoring and logging');
  console.log('   4. Test error scenarios in your actual application');
  console.log('   5. Create fallback options for when Deepgram is unavailable');
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting Deepgram Error Testing Suite (Direct HTTP)...\n');
  console.log(`Using API Key: ${VALID_API_KEY.substring(0, 10)}...`);
  console.log(`Testing against: https://api.deepgram.com/v1/listen`);
  console.log('\n');

  const tests = [
    { name: 'Valid Request (Baseline)', fn: testValidRequest },
    { name: 'Invalid API Key', fn: testInvalidApiKey },
    { name: 'Invalid URL', fn: testInvalidUrl },
    { name: 'Invalid Model', fn: testInvalidModel },
    { name: 'Invalid Language', fn: testInvalidLanguage },
    { name: 'Rate Limit Testing', fn: testRateLimit },
    { name: 'WebSocket Connection', fn: testWebSocketConnection },
    { name: 'Network Timeout', fn: testNetworkTimeout }
  ];
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n⏳ Running test ${i + 1}/${tests.length}: ${test.name}...`);
    
    try {
      await test.fn();
    } catch (error) {
      console.log(`❌ Test "${test.name}" failed with error:`, error.message);
    }
    
    // Small delay between tests to be respectful to the API
    if (i < tests.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Generate final report
  generateReport();
}

// Run the tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});