// netlify/functions/api-diagnostic.js
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

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    apiKeys: {},
    apiTests: {}
  };

  // Check API Keys
  diagnostics.apiKeys = {
    OPENAI_API_KEY: {
      exists: !!process.env.OPENAI_API_KEY,
      length: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
      prefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) + '...' : 'missing'
    },
    REMOVE_BG_API_KEY: {
      exists: !!process.env.REMOVE_BG_API_KEY,
      length: process.env.REMOVE_BG_API_KEY ? process.env.REMOVE_BG_API_KEY.length : 0,
      prefix: process.env.REMOVE_BG_API_KEY ? process.env.REMOVE_BG_API_KEY.substring(0, 7) + '...' : 'missing'
    },
    REPLICATE_API_TOKEN: {
      exists: !!process.env.REPLICATE_API_TOKEN,
      length: process.env.REPLICATE_API_TOKEN ? process.env.REPLICATE_API_TOKEN.length : 0,
      prefix: process.env.REPLICATE_API_TOKEN ? process.env.REPLICATE_API_TOKEN.substring(0, 7) + '...' : 'missing'
    }
  };

  // Test OpenAI API
  try {
    console.log('Testing OpenAI API...');
    const openaiResponse = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    diagnostics.apiTests.openai = {
      status: openaiResponse.status,
      success: openaiResponse.ok,
      error: openaiResponse.ok ? null : await openaiResponse.text()
    };
  } catch (error) {
    diagnostics.apiTests.openai = {
      status: 'error',
      success: false,
      error: error.message
    };
  }

  // Test Remove.bg API  
  try {
    console.log('Testing Remove.bg API...');
    const removebgResponse = await fetch('https://api.remove.bg/v1.0/account', {
      headers: {
        'X-Api-Key': process.env.REMOVE_BG_API_KEY,
      }
    });
    
    diagnostics.apiTests.removebg = {
      status: removebgResponse.status,
      success: removebgResponse.ok,
      error: removebgResponse.ok ? null : await removebgResponse.text()
    };
  } catch (error) {
    diagnostics.apiTests.removebg = {
      status: 'error',
      success: false,
      error: error.message
    };
  }

  // Test Replicate API
  try {
    console.log('Testing Replicate API...');
    const replicateResponse = await fetch('https://api.replicate.com/v1/models', {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });
    
    diagnostics.apiTests.replicate = {
      status: replicateResponse.status,
      success: replicateResponse.ok,
      error: replicateResponse.ok ? null : await replicateResponse.text()
    };
  } catch (error) {
    diagnostics.apiTests.replicate = {
      status: 'error',
      success: false,
      error: error.message
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(diagnostics, null, 2)
  };
};

// Global fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}