exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  }
  
  try {
    // Test OpenAI connection
    const openaiTest = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
    })
    
    // Test Remove.bg connection  
    const removeBgTest = await fetch('https://api.remove.bg/v1.0/account', {
      headers: { 'X-Api-Key': process.env.REMOVE_BG_API_KEY }
    })
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        openai: openaiTest.ok ? '✅ Connected' : '❌ Failed',
        removebg: removeBgTest.ok ? '✅ Connected' : '❌ Failed',
        replicate: process.env.REPLICATE_API_TOKEN ? '✅ Key exists' : '❌ No key'
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}