#!/usr/bin/env node

/**
 * Parse and summarize ElevenLabs error test results
 */

const fs = require('fs');
const path = require('path');

// Read results
const resultsPath = '/Users/damonbodine/wordwise-ai/scripts/elevenlabs-error-test-results.json';
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

console.log('📊 ElevenLabs API Error Testing Summary');
console.log('=' * 60);
console.log(`Test Run: ${results.timestamp}`);
console.log(`Total Tests: ${results.tests.length}`);

// Categorize results
const errorDocumentation = {
  timestamp: results.timestamp,
  summary: {
    totalTests: results.tests.length,
    successfulTests: 0,
    errorTests: 0
  },
  errorTypes: {},
  successfulCases: [],
  recommendations: []
};

results.tests.forEach(test => {
  const statusCode = test.statusCode;
  const testName = test.testName;
  
  console.log(`\n🧪 ${testName}`);
  console.log(`   Status: ${statusCode}`);
  
  if (statusCode >= 200 && statusCode < 300) {
    errorDocumentation.summary.successfulTests++;
    errorDocumentation.successfulCases.push({
      testName,
      statusCode,
      description: test.description,
      note: statusCode === 200 ? 'Successfully generated audio' : 'Success response'
    });
    console.log(`   ✅ SUCCESS: ${test.description}`);
  } else {
    errorDocumentation.summary.errorTests++;
    
    // Categorize error
    const errorKey = `HTTP_${statusCode}`;
    if (!errorDocumentation.errorTypes[errorKey]) {
      errorDocumentation.errorTypes[errorKey] = {
        statusCode,
        description: getErrorDescription(statusCode),
        examples: []
      };
    }
    
    errorDocumentation.errorTypes[errorKey].examples.push({
      testName,
      description: test.description,
      response: typeof test.response === 'object' ? test.response : 'Binary/Text response',
      rawResponseLength: test.rawResponse ? test.rawResponse.length : 0
    });
    
    console.log(`   ❌ ERROR: ${getErrorDescription(statusCode)}`);
    if (typeof test.response === 'object') {
      console.log(`   Response:`, JSON.stringify(test.response, null, 2));
    } else {
      console.log(`   Response Type: ${typeof test.response} (Length: ${test.rawResponse?.length || 0})`);
    }
  }
});

function getErrorDescription(statusCode) {
  const descriptions = {
    400: 'Bad Request - Invalid input parameters',
    401: 'Unauthorized - Invalid or missing API key',
    404: 'Not Found - Resource does not exist',
    422: 'Unprocessable Entity - Request validation failed',
    429: 'Too Many Requests - Rate limit exceeded',
    500: 'Internal Server Error - Server-side issue'
  };
  return descriptions[statusCode] || `HTTP ${statusCode} Error`;
}

// Generate recommendations
if (errorDocumentation.errorTypes.HTTP_401) {
  errorDocumentation.recommendations.push(
    'Always validate API key before making requests'
  );
}

if (errorDocumentation.errorTypes.HTTP_400) {
  errorDocumentation.recommendations.push(
    'Implement input validation for text length, voice IDs, and request format'
  );
}

if (errorDocumentation.errorTypes.HTTP_422) {
  errorDocumentation.recommendations.push(
    'Validate voice settings ranges (stability: 0-1, similarity_boost: 0-1)'
  );
}

if (errorDocumentation.summary.successfulTests > 0) {
  errorDocumentation.recommendations.push(
    'Some edge cases (empty text, special characters) may still work - test in production context'
  );
}

// Write clean documentation
const docPath = '/Users/damonbodine/wordwise-ai/scripts/elevenlabs-error-documentation.json';
fs.writeFileSync(docPath, JSON.stringify(errorDocumentation, null, 2));

console.log('\n📋 Summary');
console.log('=' * 30);
console.log(`✅ Successful Tests: ${errorDocumentation.summary.successfulTests}`);
console.log(`❌ Error Tests: ${errorDocumentation.summary.errorTests}`);
console.log(`\n🔍 Error Types Found:`);
Object.values(errorDocumentation.errorTypes).forEach(error => {
  console.log(`   ${error.statusCode}: ${error.description} (${error.examples.length} cases)`);
});

console.log(`\n💡 Recommendations:`);
errorDocumentation.recommendations.forEach((rec, i) => {
  console.log(`   ${i + 1}. ${rec}`);
});

console.log(`\n💾 Clean documentation saved to: ${docPath}`);