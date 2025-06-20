const OpenAI = require('openai');

/**
 * Step 1f: OpenAI Error Testing (30 minutes)
 * Goal: Document all OpenAI API failure modes for robust error handling
 */

console.log('🔬 Starting OpenAI Error Testing...\n');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAIErrors() {
  const tests = [
    {
      name: '1. Invalid API Key',
      description: 'Test with malformed API key',
      test: async () => {
        const badClient = new OpenAI({ apiKey: 'sk-invalid-key-12345' });
        return await badClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 10
        });
      }
    },
    {
      name: '2. Invalid Model',
      description: 'Test with non-existent model',
      test: async () => {
        return await openai.chat.completions.create({
          model: 'gpt-nonexistent-model',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 10
        });
      }
    },
    {
      name: '3. Excessive Token Request',
      description: 'Test token limit exceeded',
      test: async () => {
        return await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 999999 // Way over limit
        });
      }
    },
    {
      name: '4. Invalid Message Format',
      description: 'Test malformed message structure',
      test: async () => {
        return await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'invalid_role', content: 'Test' }],
          max_tokens: 10
        });
      }
    },
    {
      name: '5. Empty Messages Array',
      description: 'Test with no messages',
      test: async () => {
        return await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [],
          max_tokens: 10
        });
      }
    },
    {
      name: '6. Rate Limit Simulation',
      description: 'Test rapid successive requests',
      test: async () => {
        // Make multiple rapid requests
        const promises = Array(10).fill().map((_, i) => 
          openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: `Rapid test ${i}` }],
            max_tokens: 5
          })
        );
        return await Promise.all(promises);
      }
    },
    {
      name: '7. Very Long Message',
      description: 'Test with extremely long input',
      test: async () => {
        const longMessage = 'A'.repeat(100000); // Very long message
        return await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: longMessage }],
          max_tokens: 10
        });
      }
    },
    {
      name: '8. Invalid Temperature',
      description: 'Test with out-of-range temperature',
      test: async () => {
        return await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 10,
          temperature: 5.0 // Should be between 0-2
        });
      }
    },
    {
      name: '9. Streaming Interruption',
      description: 'Test streaming with immediate abort',
      test: async () => {
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Tell me a long story' }],
          max_tokens: 100,
          stream: true
        });
        
        // Immediately try to cancel/interrupt
        let chunks = 0;
        for await (const chunk of stream) {
          chunks++;
          if (chunks === 1) {
            throw new Error('Simulated interruption');
          }
        }
      }
    },
    {
      name: '10. Missing Required Fields',
      description: 'Test with missing model field',
      test: async () => {
        return await openai.chat.completions.create({
          // model: missing
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 10
        });
      }
    }
  ];

  console.log(`Running ${tests.length} OpenAI error tests...\n`);

  const results = [];

  for (const test of tests) {
    console.log(`🧪 ${test.name}: ${test.description}`);
    
    try {
      const result = await test.test();
      console.log('❌ Expected error but got success:', result);
      results.push({
        test: test.name,
        status: 'unexpected_success',
        error: null,
        result: result
      });
    } catch (error) {
      console.log('✅ Expected error caught:');
      console.log(`   Status: ${error.status || 'No status'}`);
      console.log(`   Code: ${error.code || 'No code'}`);
      console.log(`   Type: ${error.type || 'No type'}`);
      console.log(`   Message: ${error.message || 'No message'}`);
      
      results.push({
        test: test.name,
        status: 'expected_error',
        error: {
          status: error.status,
          code: error.code,
          type: error.type,
          message: error.message,
          full: error.toString()
        }
      });
    }
    
    console.log(''); // Empty line for readability
    
    // Small delay to avoid overwhelming API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

// Additional network error simulation
async function testNetworkErrors() {
  console.log('🌐 Testing Network Error Scenarios...\n');
  
  const networkTests = [
    {
      name: 'Timeout Simulation',
      description: 'Test with very low timeout',
      test: async () => {
        const timeoutClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          timeout: 1 // 1ms timeout
        });
        
        return await timeoutClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test timeout' }],
          max_tokens: 10
        });
      }
    },
    {
      name: 'Invalid Base URL',
      description: 'Test with wrong API endpoint',
      test: async () => {
        const badUrlClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: 'https://invalid-openai-endpoint.fake'
        });
        
        return await badUrlClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test bad URL' }],
          max_tokens: 10
        });
      }
    }
  ];

  const networkResults = [];

  for (const test of networkTests) {
    console.log(`🌐 ${test.name}: ${test.description}`);
    
    try {
      const result = await test.test();
      console.log('❌ Expected network error but got success:', result);
      networkResults.push({
        test: test.name,
        status: 'unexpected_success',
        error: null
      });
    } catch (error) {
      console.log('✅ Expected network error caught:');
      console.log(`   Code: ${error.code || 'No code'}`);
      console.log(`   Message: ${error.message || 'No message'}`);
      console.log(`   Cause: ${error.cause || 'No cause'}`);
      
      networkResults.push({
        test: test.name,
        status: 'expected_error',
        error: {
          code: error.code,
          message: error.message,
          cause: error.cause?.toString()
        }
      });
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return networkResults;
}

// Main execution
async function runAllTests() {
  try {
    console.log('='.repeat(60));
    console.log('🤖 OpenAI API Error Testing Suite');
    console.log('='.repeat(60));
    console.log();

    // Test API errors
    const apiResults = await testOpenAIErrors();
    
    // Test network errors  
    const networkResults = await testNetworkErrors();
    
    const allResults = [...apiResults, ...networkResults];
    
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(40));
    
    const expectedErrors = allResults.filter(r => r.status === 'expected_error').length;
    const unexpectedSuccesses = allResults.filter(r => r.status === 'unexpected_success').length;
    
    console.log(`✅ Expected Errors Caught: ${expectedErrors}`);
    console.log(`❌ Unexpected Successes: ${unexpectedSuccesses}`);
    console.log(`📝 Total Tests: ${allResults.length}`);
    console.log();
    
    // Document common error patterns
    console.log('🔍 COMMON ERROR PATTERNS IDENTIFIED:');
    console.log('='.repeat(40));
    
    const errorsByStatus = {};
    allResults.forEach(result => {
      if (result.error && result.error.status) {
        errorsByStatus[result.error.status] = (errorsByStatus[result.error.status] || 0) + 1;
      }
    });
    
    Object.entries(errorsByStatus).forEach(([status, count]) => {
      console.log(`- HTTP ${status}: ${count} occurrences`);
    });
    
    console.log();
    console.log('💡 IMPLEMENTATION RECOMMENDATIONS:');
    console.log('='.repeat(40));
    console.log('1. Handle 401 errors (invalid API key) with user-friendly messages');
    console.log('2. Handle 400 errors (bad requests) with input validation');
    console.log('3. Handle 429 errors (rate limits) with exponential backoff');
    console.log('4. Handle 500 errors (server errors) with retry logic');
    console.log('5. Handle network timeouts with fallback strategies');
    console.log('6. Validate all parameters before sending requests');
    console.log('7. Implement streaming interruption handling');
    console.log('8. Add request/response logging for debugging');
    console.log();
    
    console.log('✅ OpenAI Error Testing Complete!');
    
    return allResults;
    
  } catch (error) {
    console.error('💥 Error Testing Suite Failed:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('🎉 All error tests completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, testOpenAIErrors, testNetworkErrors };