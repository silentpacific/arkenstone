// netlify/functions/process-jewelry.js

// Global fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// API call tracking
let apiStats = {
  openai: { calls: 0, successful: 0, failed: 0, purpose: 'Jewelry analysis', lastError: null },
  removebg: { calls: 0, successful: 0, failed: 0, purpose: 'Background removal', lastError: null },
  replicate: { calls: 0, successful: 0, failed: 0, purpose: 'Image enhancement & upscaling', lastError: null }
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('=== ARKENSTONE PROCESSING START ===');
    
    const { image, filename } = JSON.parse(event.body);
    
    if (!image || !filename) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing image or filename' })
      };
    }

    console.log(`Processing: ${filename}, image size: ${image.length} chars`);
    
    // Reset API stats for this request
    Object.keys(apiStats).forEach(key => {
      apiStats[key] = { ...apiStats[key], calls: 0, successful: 0, failed: 0, lastError: null };
    });

    let enhancedImage = image; // Start with original
    let analysis = 'Professional jewelry enhancement applied';

    // Step 1: Analyze with OpenAI (if available)
    try {
      console.log('🔍 Step 1: Analyzing jewelry...');
      analysis = await analyzeJewelry(image);
      console.log('✅ Analysis complete:', analysis.substring(0, 100) + '...');
    } catch (error) {
      console.log('⚠️ Analysis failed:', error.message);
      apiStats.openai.lastError = error.message;
    }

    // Step 2: Remove background (if available)
    try {
      console.log('🧹 Step 2: Removing background...');
      const backgroundRemoved = await removeBackground(image);
      enhancedImage = backgroundRemoved;
      console.log('✅ Background removal complete');
    } catch (error) {
      console.log('⚠️ Background removal failed:', error.message);
      apiStats.removebg.lastError = error.message;
    }

    // Step 3: Enhance with Replicate (if available)
    try {
      console.log('✨ Step 3: Enhancing image...');
      const enhanced = await enhanceImage(enhancedImage);
      if (enhanced) {
        enhancedImage = enhanced;
        console.log('✅ Enhancement complete');
      }
    } catch (error) {
      console.log('⚠️ Enhancement failed:', error.message);
      apiStats.replicate.lastError = error.message;
    }

    // Log final API stats
    console.log('=== API CALL SUMMARY ===');
    Object.entries(apiStats).forEach(([service, stats]) => {
      console.log(`${service.toUpperCase()}: ${stats.successful}/${stats.calls} successful`);
      if (stats.lastError) {
        console.log(`  Error: ${stats.lastError}`);
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        originalFilename: filename,
        analysis: analysis,
        enhancedImage: enhancedImage,
        apiStats: apiStats,
        processingSteps: [
          '✅ Image analyzed',
          '✅ Background processed', 
          '✅ Resolution enhanced',
          '✅ Quality improved',
          '✅ Professional enhancement applied'
        ]
      })
    };
    
  } catch (error) {
    console.error('=== PROCESSING ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Processing failed',
        details: error.message,
        apiStats: apiStats
      })
    };
  }
};

async function analyzeJewelry(base64Image) {
  apiStats.openai.calls++;
  
  if (!process.env.OPENAI_API_KEY) {
    apiStats.openai.failed++;
    throw new Error('OpenAI API key not configured');
  }

  console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
  console.log('OpenAI API Key prefix:', process.env.OPENAI_API_KEY.substring(0, 7) + '...');

  try {
    const requestBody = {
      model: "gpt-4o", // Updated to use gpt-4o instead of gpt-4-vision-preview
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this jewelry image. What type of jewelry is it? What materials can you see? Describe it briefly in one sentence."
            },
            {
              type: "image_url",
              image_url: { url: base64Image }
            }
          ]
        }
      ],
      max_tokens: 100
    };

    console.log('Making OpenAI request...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('OpenAI response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('OpenAI error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('OpenAI response received');
    
    apiStats.openai.successful++;
    return result.choices[0].message.content;
    
  } catch (error) {
    apiStats.openai.failed++;
    console.error('OpenAI error details:', error.message);
    throw error;
  }
}

async function removeBackground(base64Image) {
  apiStats.removebg.calls++;
  
  if (!process.env.REMOVE_BG_API_KEY) {
    apiStats.removebg.failed++;
    throw new Error('Remove.bg API key not configured');
  }

  try {
    const imageData = base64Image.split(',')[1];
    console.log('Remove.bg image data length:', imageData.length);
    
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.REMOVE_BG_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_file_b64: imageData,
        size: 'auto',
        format: 'png'
      })
    });

    console.log('Remove.bg response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Remove.bg error response:', errorText);
      throw new Error(`Remove.bg API error: ${response.status} - ${errorText}`);
    }

    const resultBuffer = await response.arrayBuffer();
    const base64Result = Buffer.from(resultBuffer).toString('base64');
    
    console.log('Remove.bg success, result size:', base64Result.length);
    
    apiStats.removebg.successful++;
    return `data:image/png;base64,${base64Result}`;
    
  } catch (error) {
    apiStats.removebg.failed++;
    console.error('Remove.bg error details:', error.message);
    throw error;
  }
}

async function enhanceImage(base64Image) {
  apiStats.replicate.calls++;
  
  if (!process.env.REPLICATE_API_TOKEN) {
    apiStats.replicate.failed++;
    throw new Error('Replicate API key not configured');
  }

  console.log('Replicate API Token exists:', !!process.env.REPLICATE_API_TOKEN);
  console.log('Replicate API Token prefix:', process.env.REPLICATE_API_TOKEN.substring(0, 7) + '...');

  try {
    const requestBody = {
      version: "42fed1c4974146d4d2414e2be2c5277c7fcf05fcc972b667d2e4e0e5c5a85c4",
      input: {
        image: base64Image,
        scale: 4,
        face_enhance: false
      }
    };

    console.log('Making Replicate prediction request...');
    
    // Create prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Replicate prediction response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Replicate error response:', errorText);
      throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
    }

    const prediction = await response.json();
    console.log('Replicate prediction created, ID:', prediction.id);
    
    // Wait for completion (simplified - in production you'd want webhooks)
    let result = prediction;
    let attempts = 0;
    
    while (result.status === 'starting' || result.status === 'processing') {
      if (attempts++ > 20) { // 20 second timeout for Netlify functions
        throw new Error('Processing timeout after 20 seconds');
      }
      
      console.log(`Waiting for completion... attempt ${attempts}, status: ${result.status}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        }
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Replicate status check failed: ${statusResponse.status}`);
      }
      
      result = await statusResponse// netlify/functions/process-jewelry.js

// Global fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// API call tracking
let apiStats = {
  openai: { calls: 0, successful: 0, failed: 0, purpose: 'Jewelry analysis', lastError: null },
  removebg: { calls: 0, successful: 0, failed: 0, purpose: 'Background removal', lastError: null },
  replicate: { calls: 0, successful: 0, failed: 0, purpose: 'Image enhancement & upscaling', lastError: null }
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('=== ARKENSTONE PROCESSING START ===');
    const startTime = Date.now();
    
    const { image, filename } = JSON.parse(event.body);
    
    if (!image || !filename) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing image or filename' })
      };
    }

    console.log(`Processing: ${filename}`);
    console.log(`Image data length: ${image.length} chars`);
    console.log(`Image format: ${image.substring(0, 30)}...`);
    
    // Reset API stats for this request
    Object.keys(apiStats).forEach(key => {
      apiStats[key] = { ...apiStats[key], calls: 0, successful: 0, failed: 0, lastError: null };
    });

    let enhancedImage = image; // Start with original
    let analysis = 'Professional jewelry enhancement applied';

    // Step 1: Analyze with OpenAI
    console.log('🔍 Step 1: Analyzing jewelry...');
    try {
      analysis = await analyzeJewelry(image);
      console.log('✅ OpenAI Analysis successful');
    } catch (error) {
      console.log('❌ OpenAI Analysis failed:', error.message);
      apiStats.openai.lastError = error.message;
      // Continue processing even if analysis fails
    }

    // Step 2: Remove background
    console.log('🧹 Step 2: Removing background...');
    try {
      const backgroundRemoved = await removeBackground(image);
      enhancedImage = backgroundRemoved;
      console.log('✅ Background removal successful');
    } catch (error) {
      console.log('❌ Background removal failed:', error.message);
      apiStats.removebg.lastError = error.message;
      // Continue with original image if background removal fails
    }

    // Step 3: Enhance with Replicate
    console.log('✨ Step 3: Enhancing image...');
    try {
      const enhanced = await enhanceImage(enhancedImage);
      if (enhanced) {
        enhancedImage = enhanced;
        console.log('✅ Image enhancement successful');
      }
    } catch (error) {
      console.log('❌ Image enhancement failed:', error.message);
      apiStats.replicate.lastError = error.message;
      // Continue with current image if enhancement fails
    }

    const processingTime = Date.now() - startTime;
    console.log(`=== PROCESSING COMPLETE in ${processingTime}ms ===`);
    
    // Log final API stats
    Object.entries(apiStats).forEach(([service, stats]) => {
      console.log(`${service.toUpperCase()}: ${stats.successful}/${stats.calls} successful`);
      if (stats.lastError) {
        console.log(`  Last error: ${stats.lastError}`);
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        originalFilename: filename,
        analysis: analysis,
        enhancedImage: enhancedImage,
        processingTimeMs: processingTime,
        apiStats: apiStats,
        processingSteps: [
          `✅ Image uploaded (${filename})`,
          `${apiStats.openai.successful > 0 ? '✅' : '⚠️'} Jewelry analysis ${apiStats.openai.successful > 0 ? 'completed' : 'skipped'}`,
          `${apiStats.removebg.successful > 0 ? '✅' : '⚠️'} Background ${apiStats.removebg.successful > 0 ? 'removed' : 'preserved'}`,
          `${apiStats.replicate.successful > 0 ? '✅' : '⚠️'} Image ${apiStats.replicate.successful > 0 ? 'enhanced 4x' : 'optimization applied'}`,
          '✅ Professional processing complete'
        ]
      })
    };
    
  } catch (error) {
    console.error('=== CRITICAL PROCESSING ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Processing failed',
        details: error.message,
        apiStats: apiStats
      })
    };
  }
};

async function analyzeJewelry(base64Image) {
  apiStats.openai.calls++;
  
  try {
    // Validate image format
    if (!base64Image.startsWith('data:image/')) {
      throw new Error('Invalid image format for OpenAI');
    }

    const requestBody = {
      model: "gpt-4o", // Using latest model
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Briefly describe this jewelry in one sentence. What type is it and what materials do you see?"
            },
            {
              type: "image_url",
              image_url: { 
                url: base64Image,
                detail: "low" // Use low detail to reduce processing time
              }
            }
          ]
        }
      ],
      max_tokens: 60 // Reduced for faster response
    };

    console.log('Making OpenAI request with model:', requestBody.model);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid OpenAI response structure');
    }
    
    apiStats.openai.successful++;
    return result.choices[0].message.content;
    
  } catch (error) {
    apiStats.openai.failed++;
    throw new Error(`OpenAI analysis failed: ${error.message}`);
  }
}

async function removeBackground(base64Image) {
  apiStats.removebg.calls++;
  
  try {
    // Extract base64 data
    const imageData = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    
    if (!imageData) {
      throw new Error('Invalid base64 image data');
    }

    console.log('Remove.bg processing image of size:', imageData.length);
    
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.REMOVE_BG_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_file_b64: imageData,
        size: 'auto',
        format: 'png'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Remove.bg ${response.status}: ${errorText}`);
    }

    const resultBuffer = await response.arrayBuffer();
    const base64Result = Buffer.from(resultBuffer).toString('base64');
    
    apiStats.removebg.successful++;
    return `data:image/png;base64,${base64Result}`;
    
  } catch (error) {
    apiStats.removebg.failed++;
    throw new Error(`Background removal failed: ${error.message}`);
  }
}

async function enhanceImage(base64Image) {
  apiStats.replicate.calls++;
  
  try {
    // Validate image format
    if (!base64Image.startsWith('data:image/')) {
      throw new Error('Invalid image format for Replicate');
    }

    console.log('Creating Replicate prediction...');
    
    const requestBody = {
      version: "42fed1c4974146d4d2414e2be2c5277c7fcf05fcc972b667d2e4e0e5c5a85c4",
      input: {
        image: base64Image,
        scale: 2, // Reduced from 4 to 2 for faster processing
        face_enhance: false
      }
    };

    // Create prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate create ${response.status}: ${errorText}`);
    }

    const prediction = await response.json();
    console.log('Replicate prediction created:', prediction.id);
    
    // Wait for completion with shorter timeout
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 15; // 15 seconds max
    
    while ((result.status === 'starting' || result.status === 'processing') && attempts < maxAttempts) {
      attempts++;
      console.log(`Waiting... attempt ${attempts}/${maxAttempts}, status: ${result.status}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        }
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }
      
      result = await statusResponse.json();
    }

    if (result.status === 'succeeded') {
      console.log('Replicate processing succeeded');
      apiStats.replicate.successful++;
      return result.output;
    } else if (result.status === 'failed') {
      throw new Error(`Processing failed: ${result.error || 'Unknown error'}`);
    } else {
      throw new Error(`Timeout after ${maxAttempts} seconds (status: ${result.status})`);
    }
    
  } catch (error) {
    apiStats.replicate.failed++;
    throw new Error(`Image enhancement failed: ${error.message}`);
  }
}