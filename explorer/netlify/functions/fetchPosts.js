const { BskyAgent } = require('@atproto/api');

exports.handler = async function(event, context) {
  // MISSION CONTROL CENTER - Let's see EVERYTHING! 🎭
  console.log('INCOMING TRANSMISSION! 📡', {
    rawBody: event.body,
    bodyType: typeof event.body,
    httpMethod: event.httpMethod,
    headers: event.headers,
    timestamp: new Date().toISOString(),
    isBodyEmpty: !event.body,
    bodyLength: event.body?.length
  });

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // CORS Preflight Dance Party! 💃
  if (event.httpMethod === 'OPTIONS') {
    console.log('CORS PARTY DETECTED! Sending VIP access passes...');
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ message: 'CORS preflight successful! 🎉' })
    };
  }

  try {
    // JSON PARSING ADVENTURE TIME! 🗺️
    let requestBody;
    try {
      console.log('ATTEMPTING JSON PARSE MISSION! Raw payload:', {
        body: event.body,
        isString: typeof event.body === 'string',
        firstFewChars: event.body?.substring(0, 50) + '...'
      });

      requestBody = event.body ? JSON.parse(event.body) : {};
      
      console.log('JSON PARSE VICTORY! 🏆 Decoded payload:', requestBody);
    } catch (parseError) {
      console.error('JSON PARSE DISTRESS SIGNAL! 🚨', {
        error: parseError.message,
        whatWeTriedToParse: event.body,
        errorName: parseError.name,
        errorStack: parseError.stack
      });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON in request body',
          details: parseError.message,
          receivedBody: event.body
        })
      };
    }

    const { handle, numPosts = 10 } = requestBody;
    
    console.log('PAYLOAD EXTRACTION COMPLETE! 📦', {
      extractedHandle: handle,
      extractedNumPosts: numPosts,
      fullPayload: requestBody
    });

    if (!handle) {
      console.log('ALERT! Missing handle in payload! 🚫');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Handle is required!',
          received: requestBody
        })
      };
    }

    // Bluesky Connection Sequence! 🌌
    console.log('INITIATING BLUESKY PROTOCOLS...');
    const agent = new BskyAgent({ 
      service: 'https://bsky.social'
    });

    console.log(`COMMENCING HANDLE RESOLUTION: ${handle}`);
    const profile = await agent.resolveHandle({ handle });
    console.log('PROFILE ACQUIRED! 🎯', profile.data);

    console.log(`RETRIEVING FEED FOR DID: ${profile.data.did}`);
    const posts = await agent.getAuthorFeed({
      actor: profile.data.did,
      limit: parseInt(numPosts)
    });
    
    console.log('FEED RETRIEVAL SUCCESS! 📜', {
      postsFound: posts.data.feed.length,
      requestedAmount: numPosts
    });

    const plainTextPosts = posts.data.feed.map(post => ({
      text: post.post.record.text,
      createdAt: new Date(post.post.record.createdAt).toISOString()
    }));

    console.log('MISSION ACCOMPLISHED! 🎉 Preparing final transmission...');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: plainTextPosts,
        meta: {
          handle,
          postsRequested: numPosts,
          postsRetrieved: plainTextPosts.length
        }
      })
    };

  } catch (error) {
    console.error('CRITICAL SYSTEM ERROR! 🔥', {
      errorType: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Internal quantum fluctuation detected',
        type: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
}