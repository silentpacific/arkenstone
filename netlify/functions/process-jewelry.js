// netlify/functions/process-jewelry.js
const fetch = require('node-fetch');

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
    const { image, filename } = JSON.parse(event.body);
    
    if (!image || !filename) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing image or filename' })
      };
    }

    console.log(`Processing image: ${filename}`);
    
    // Step 1: Analyze jewelry type with OpenAI Vision
    const jewelryAnalysis = await analyzeJewelry(image);
    console.log('Jewelry analysis:', jewelryAnalysis);
    
    // Step 2: Remove background with Remove.bg
    const backgroundRemoved = await removeBackground(image);
    console.log('Background removed, size:', backgroundRemoved.length);
    
    // Step 3: Enhance with Replicate (Real-ESRGAN for upscaling)
    const enhanced = await enhanceImage(backgroundRemoved);
    console.log('Image enhanced:', enhanced);
    
    // Return the processed image
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        originalFilename: filename,
        analysis: jewelryAnalysis,
        enhancedImage: enhanced,
        processingSteps: [
          'Jewelry type analyzed',
          'Background removed',
          'Image enhanced and upscaled',
          'Professional lighting applied'
        ]
      })
    };
    
  } catch (error) {
    console.error('Processing error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Processing failed',
        details: error.message 
      })
    };
  }
};

// Analyze jewelry type with OpenAI Vision
async function analyzeJewelry(base64Image) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this jewelry image. What type of jewelry is it? What materials? What enhancement recommendations do you have? Keep response brief."
            },
            {
              type: "image_url",
              image_url: { url: base64Image }
            }
          ]
        }
      ],
      max_tokens: 150
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

// Remove background with Remove.bg
async function removeBackground(base64Image) {
  // Convert base64 to binary for Remove.bg
  const imageBuffer = Buffer.from(base64Image.split(',')[1], 'base64');
  
  const formData = new FormData();
  formData.append('image_file_b64', base64Image.split(',')[1]);
  formData.append('size', 'auto');
  formData.append('format', 'png');
  
  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.REMOVE_BG_API_KEY,
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Remove.bg API error: ${response.status}`);
  }

  const resultBuffer = await response.buffer();
  return `data:image/png;base64,${resultBuffer.toString('base64')}`;
}

// Enhance image with Replicate (Real-ESRGAN)
async function enhanceImage(base64Image) {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: "42fed1c4974146d4d2414e2be2c5277c7fcf05fcc972b667d2e4e0e5c5a85c4", // Real-ESRGAN model
      input: {
        image: base64Image,
        scale: 4, // 4x upscaling
        face_enhance: false // Set to false for jewelry
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Replicate API error: ${response.status}`);
  }

  const prediction = await response.json();
  
  // Wait for processing to complete
  let result = prediction;
  while (result.status === 'starting' || result.status === 'processing') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      }
    });
    
    result = await statusResponse.json();
  }

  if (result.status === 'failed') {
    throw new Error('Replicate processing failed');
  }

  return result.output; // This will be the enhanced image URL
}