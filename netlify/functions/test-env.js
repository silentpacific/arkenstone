// netlify/functions/test-env.js
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Environment test successful',
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        environment: {
          OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set ✅' : 'Missing ❌',
          REMOVE_BG_API_KEY: process.env.REMOVE_BG_API_KEY ? 'Set ✅' : 'Missing ❌',
          REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN ? 'Set ✅' : 'Missing ❌'
        },
        availableModules: {
          fs: typeof require('fs') !== 'undefined',
          path: typeof require('path') !== 'undefined',
          buffer: typeof Buffer !== 'undefined'
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Environment test failed',
        details: error.message,
        stack: error.stack
      })
    };
  }
};