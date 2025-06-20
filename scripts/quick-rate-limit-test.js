#!/usr/bin/env node

/**
 * Quick Rate Limit Test - Lighter version
 */

const https = require('https');

const API_KEY = 'sk_ee988816896aba4a66859b994849029219a84bd17ec06ca5';
const BASE_URL = 'api.elevenlabs.io';

function makeRequest(data) {
  return new Promise((resolve) => {
    const options = {
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

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, body: parsed || 'Binary data' });
        } catch (e) {
          resolve({ status: res.statusCode, body: 'Binary data' });
        }
      });
    });

    req.on('error', (e) => resolve({ error: e.message }));
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function quickRateLimitTest() {
  console.log('🚀 Quick Rate Limit Test (10 rapid requests)');
  
  const testData = {
    text: 'Rate limit test',
    model_id: 'eleven_monolingual_v1',
    voice_settings: { stability: 0.5, similarity_boost: 0.5 }
  };

  let successCount = 0;
  let rateLimitCount = 0;
  
  for (let i = 1; i <= 10; i++) {
    const result = await makeRequest(testData);
    console.log(`Request ${i}: Status ${result.status}`);
    
    if (result.status === 200) {
      successCount++;
    } else if (result.status === 429) {
      rateLimitCount++;
      console.log(`  📛 Rate limited: ${JSON.stringify(result.body)}`);
    } else {
      console.log(`  ❌ Error: ${JSON.stringify(result.body)}`);
    }
  }
  
  console.log(`\n📊 Results: ${successCount} success, ${rateLimitCount} rate limited`);
}

quickRateLimitTest().catch(console.error);