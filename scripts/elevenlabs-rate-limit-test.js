#!/usr/bin/env node

/**
 * ElevenLabs Rate Limit Testing Script
 * Tests rate limiting behavior to understand exact limits and responses
 */

const https = require('https');

const API_KEY = 'sk_ee988816896aba4a66859b994849029219a84bd17ec06ca5';
const BASE_URL = 'api.elevenlabs.io';

/**
 * Make HTTP request and return response with timing
 */
function makeTimedRequest(options, data = null) {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const endTime = Date.now();
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed || body,
            responseTime: endTime - startTime,
            timestamp: new Date().toISOString()
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            responseTime: endTime - startTime,
            timestamp: new Date().toISOString()
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
 * Test rate limiting with rapid requests
 */
async function testRateLimit() {
  console.log('🚀 Testing ElevenLabs Rate Limiting');
  console.log('Free Tier Limits: 6,000 TPM, 30 RPM, 14,400 tokens/day');
  console.log('=' * 60);

  const results = [];
  const testText = 'Test rate limiting with this short text.'; // ~8 tokens
  
  console.log('\n📊 Making 35 rapid requests to test 30 RPM limit...');
  
  // Make rapid requests to hit rate limit
  const promises = [];
  for (let i = 0; i < 35; i++) {
    const requestOptions = {
      hostname: BASE_URL,
      port: 443,
      path: '/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', // Rachel voice
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY
      }
    };

    const requestData = {
      text: testText,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    };

    promises.push(
      makeTimedRequest(requestOptions, requestData)
        .then(response => ({ requestIndex: i + 1, ...response }))
        .catch(error => ({ requestIndex: i + 1, error: error.message }))
    );
  }

  // Execute all requests
  const responses = await Promise.all(promises);
  
  // Analyze results
  let successCount = 0;
  let rateLimitCount = 0;
  let errorCount = 0;
  let rateLimitResponses = [];

  responses.forEach(response => {
    console.log(`Request ${response.requestIndex}: Status ${response.statusCode} (${response.responseTime}ms)`);
    
    if (response.statusCode === 200) {
      successCount++;
    } else if (response.statusCode === 429) {
      rateLimitCount++;
      rateLimitResponses.push(response);
      console.log(`   📛 RATE LIMITED: ${JSON.stringify(response.body)}`);
    } else if (response.error) {
      errorCount++;
      console.log(`   ❌ ERROR: ${response.error}`);
    } else {
      errorCount++;
      console.log(`   ❌ HTTP ${response.statusCode}: ${JSON.stringify(response.body)}`);
    }
  });

  console.log('\n📈 Rate Limit Test Results:');
  console.log(`✅ Successful requests: ${successCount}`);
  console.log(`📛 Rate limited requests: ${rateLimitCount}`);
  console.log(`❌ Other errors: ${errorCount}`);

  // Analyze rate limit responses
  if (rateLimitResponses.length > 0) {
    console.log('\n🔍 Rate Limit Response Analysis:');
    rateLimitResponses.forEach((response, index) => {
      console.log(`Rate Limit ${index + 1}:`);
      console.log(`  Headers:`, JSON.stringify(response.headers, null, 2));
      console.log(`  Body:`, JSON.stringify(response.body, null, 2));
    });
  }

  return {
    totalRequests: 35,
    successCount,
    rateLimitCount,
    errorCount,
    rateLimitResponses,
    testCompleted: new Date().toISOString()
  };
}

/**
 * Test token-based rate limiting
 */
async function testTokenLimit() {
  console.log('\n🎯 Testing Token-Based Rate Limiting');
  console.log('Attempting to exceed 6,000 TPM with large texts...');
  
  // Create text that's approximately 1000 tokens
  const largeText = 'This is a test sentence that will be repeated many times to create a large text block that approaches the token limit for ElevenLabs API. '.repeat(50); // ~1000 tokens
  
  const results = [];
  
  for (let i = 0; i < 8; i++) {
    console.log(`\nToken test ${i + 1}/8 - Sending ~1000 tokens...`);
    
    const requestOptions = {
      hostname: BASE_URL,
      port: 443,
      path: '/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY
      }
    };

    const requestData = {
      text: largeText,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    };

    try {
      const response = await makeTimedRequest(requestOptions, requestData);
      console.log(`  Status: ${response.statusCode} (${response.responseTime}ms)`);
      
      if (response.statusCode === 429) {
        console.log(`  📛 TOKEN RATE LIMITED:`, JSON.stringify(response.body));
        results.push({ test: i + 1, result: 'rate_limited', response });
        break; // Stop testing once we hit rate limit
      } else if (response.statusCode === 200) {
        console.log(`  ✅ Success - Audio generated`);
        results.push({ test: i + 1, result: 'success', response });
      } else {
        console.log(`  ❌ Error:`, JSON.stringify(response.body));
        results.push({ test: i + 1, result: 'error', response });
      }
      
      // Wait 1 second between requests to avoid RPM limit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`  ❌ Request failed:`, error.message);
      results.push({ test: i + 1, result: 'error', error: error.message });
    }
  }

  return results;
}

/**
 * Main test execution
 */
async function runRateLimitTests() {
  try {
    console.log('🧪 ElevenLabs Rate Limit Testing Suite');
    console.log('====================================');
    
    // Test 1: RPM Rate Limiting
    const rpmResults = await testRateLimit();
    
    // Wait 60 seconds to reset rate limit
    console.log('\n⏳ Waiting 60 seconds for rate limit reset...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Test 2: Token Rate Limiting
    const tokenResults = await testTokenLimit();
    
    // Save results
    const finalResults = {
      timestamp: new Date().toISOString(),
      rpmTest: rpmResults,
      tokenTest: tokenResults,
      conclusions: []
    };
    
    // Generate conclusions
    if (rpmResults.rateLimitCount > 0) {
      finalResults.conclusions.push(`RPM limit hit after ${rpmResults.successCount} successful requests`);
    }
    
    if (tokenResults.some(r => r.result === 'rate_limited')) {
      const tokenLimitHit = tokenResults.findIndex(r => r.result === 'rate_limited') + 1;
      finalResults.conclusions.push(`Token limit hit after ${tokenLimitHit} large requests (~${tokenLimitHit * 1000} tokens)`);
    }
    
    const fs = require('fs');
    fs.writeFileSync('/Users/damonbodine/wordwise-ai/scripts/rate-limit-test-results.json', 
      JSON.stringify(finalResults, null, 2));
    
    console.log('\n💾 Rate limit test results saved to: scripts/rate-limit-test-results.json');
    console.log('\n🎯 Key Findings:');
    finalResults.conclusions.forEach(conclusion => {
      console.log(`  • ${conclusion}`);
    });
    
  } catch (error) {
    console.error('❌ Rate limit test failed:', error);
  }
}

// Run the rate limit tests
runRateLimitTests();