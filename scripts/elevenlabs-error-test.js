#!/usr/bin/env node

/**
 * ElevenLabs API Error Testing Script
 * Tests all failure modes and documents exact error responses
 */

const https = require('https');

// Configuration
const VALID_API_KEY = 'sk_ee988816896aba4a66859b994849029219a84bd17ec06ca5';
const INVALID_API_KEY = 'sk_invalid_key_for_testing_12345';
const BASE_URL = 'api.elevenlabs.io';

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  tests: []
};

/**
 * Make HTTP request and return response
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed || body,
            rawBody: body
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            rawBody: body
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Test helper function
 */
async function runTest(testName, description, requestOptions, requestData = null) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log(`Description: ${description}`);
  
  try {
    const response = await makeRequest(requestOptions, requestData);
    
    const result = {
      testName,
      description,
      success: response.statusCode >= 200 && response.statusCode < 300,
      statusCode: response.statusCode,
      headers: response.headers,
      response: response.body,
      rawResponse: response.rawBody,
      timestamp: new Date().toISOString()
    };
    
    testResults.tests.push(result);
    
    console.log(`Status: ${response.statusCode}`);
    console.log(`Response:`, JSON.stringify(response.body, null, 2));
    
    return result;
  } catch (error) {
    console.error(`❌ Test failed:`, error.message);
    
    const result = {
      testName,
      description,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    testResults.tests.push(result);
    return result;
  }
}

/**
 * Main test execution
 */
async function runAllTests() {
  console.log('🎯 Starting ElevenLabs API Error Testing');
  console.log('=' * 50);

  // Test 1: Empty text input
  await runTest(
    'Empty Text Input',
    'Test TTS with empty string',
    {
      hostname: BASE_URL,
      port: 443,
      path: '/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', // Rachel voice
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': VALID_API_KEY
      }
    },
    {
      text: '',
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    }
  );

  // Test 2: Very long text (>1000 chars)
  const longText = 'A'.repeat(1500);
  await runTest(
    'Long Text Input',
    'Test TTS with text longer than 1000 characters',
    {
      hostname: BASE_URL,
      port: 443,
      path: '/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': VALID_API_KEY
      }
    },
    {
      text: longText,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    }
  );

  // Test 3: Invalid API key
  await runTest(
    'Invalid API Key',
    'Test TTS with invalid API key',
    {
      hostname: BASE_URL,
      port: 443,
      path: '/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': INVALID_API_KEY
      }
    },
    {
      text: 'Hello world',
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    }
  );

  // Test 4: Missing API key
  await runTest(
    'Missing API Key',
    'Test TTS without API key header',
    {
      hostname: BASE_URL,
      port: 443,
      path: '/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json'
        // No xi-api-key header
      }
    },
    {
      text: 'Hello world',
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    }
  );

  // Test 5: Special characters and emojis
  await runTest(
    'Special Characters',
    'Test TTS with special characters and emojis',
    {
      hostname: BASE_URL,
      port: 443,
      path: '/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': VALID_API_KEY
      }
    },
    {
      text: 'Hello! 🎉 This has special chars: @#$%^&*()_+ and emojis: 😀🚀💯',
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    }
  );

  // Test 6: Invalid voice ID
  await runTest(
    'Invalid Voice ID',
    'Test TTS with non-existent voice ID',
    {
      hostname: BASE_URL,
      port: 443,
      path: '/v1/text-to-speech/invalid_voice_id_12345',
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': VALID_API_KEY
      }
    },
    {
      text: 'Hello world',
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    }
  );

  // Test 7: Invalid model ID
  await runTest(
    'Invalid Model ID',
    'Test TTS with non-existent model ID',
    {
      hostname: BASE_URL,
      port: 443,
      path: '/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': VALID_API_KEY
      }
    },
    {
      text: 'Hello world',
      model_id: 'invalid_model_id',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    }
  );

  // Test 8: Invalid voice settings
  await runTest(
    'Invalid Voice Settings',
    'Test TTS with out-of-range voice settings',
    {
      hostname: BASE_URL,
      port: 443,
      path: '/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': VALID_API_KEY
      }
    },
    {
      text: 'Hello world',
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 2.0, // Should be 0-1
        similarity_boost: -0.5 // Should be 0-1
      }
    }
  );

  // Test 9: Malformed JSON
  await runTest(
    'Malformed JSON',
    'Test TTS with invalid JSON payload',
    {
      hostname: BASE_URL,
      port: 443,
      path: '/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': VALID_API_KEY
      }
    },
    '{"text": "Hello world", "model_id": }' // Invalid JSON
  );

  // Test 10: Missing required fields
  await runTest(
    'Missing Required Fields',
    'Test TTS without required text field',
    {
      hostname: BASE_URL,
      port: 443,
      path: '/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': VALID_API_KEY
      }
    },
    {
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
      // Missing text field
    }
  );

  // Test 11: Test /voices endpoint with invalid API key
  await runTest(
    'Voices Invalid API Key',
    'Test voices endpoint with invalid API key',
    {
      hostname: BASE_URL,
      port: 443,
      path: '/v1/voices',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': INVALID_API_KEY
      }
    }
  );

  // Test 12: Test /voices endpoint without API key
  await runTest(
    'Voices Missing API Key',
    'Test voices endpoint without API key',
    {
      hostname: BASE_URL,
      port: 443,
      path: '/v1/voices',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
        // No xi-api-key header
      }
    }
  );

  // Test 13: Wrong HTTP method
  await runTest(
    'Wrong HTTP Method',
    'Test TTS endpoint with GET instead of POST',
    {
      hostname: BASE_URL,
      port: 443,
      path: '/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      method: 'GET',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': VALID_API_KEY
      }
    }
  );

  // Generate summary
  console.log('\n📊 Test Summary');
  console.log('=' * 50);
  const totalTests = testResults.tests.length;
  const passedTests = testResults.tests.filter(t => t.success).length;
  const failedTests = totalTests - passedTests;

  console.log(`Total tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);

  // Save results to file
  const fs = require('fs');
  fs.writeFileSync('/Users/damonbodine/wordwise-ai/scripts/elevenlabs-error-test-results.json', 
    JSON.stringify(testResults, null, 2));
  
  console.log('\n💾 Results saved to: scripts/elevenlabs-error-test-results.json');
}

// Run all tests
runAllTests().catch(console.error);