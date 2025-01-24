const { BskyAgent } = require('@atproto/api');

exports.handler = async function(event, context) {
  // Let's add some SERIOUS debugging first! 🔍
  console.log('Incoming event:', {
    body: event.body,
    method: event.httpMethod,
    headers: event.headers
  });

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'  // CRUCIAL for proper JSON response!
  };

  if (event.httpMethod === 'OPTIONS') {
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ message: 'CORS preflight successful!' })
    };
  }

  try {
    // Parse with extra safety nets! 🕸️
    let requestBody;
    try {
      requestBody = event.body ? JSON.parse(event.body) : {};
      console.log('Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON in request body',
          details: parseError.message
        })
      };
    }

    const { handle, numPosts = 10 } = requestBody;
    
    if (!handle) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Handle is required!',
          received: requestBody
        })
      };
    }

    // Initialize Bluesky with DEBUG MODE ON! 🚀
    const agent = new BskyAgent({ 
      service: 'https://bsky.social'
    });

    console.log('Attempting to resolve handle:', handle);
    const profile = await agent.resolveHandle({ handle });
    console.log('Profile resolved:', profile.data);

    console.log('Fetching feed for DID:', profile.data.did);
    const posts = await agent.getAuthorFeed({
      actor: profile.data.did,
      limit: parseInt(numPosts)
    });
    
    console.log('Feed fetched, post count:', posts.data.feed.length);

    const plainTextPosts = posts.data.feed.map(post => ({
      text: post.post.record.text,
      createdAt: new Date(post.post.record.createdAt).toISOString()
    }));

    // Return with ALL THE SAFETY CHECKS! 🛡️
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
    console.error('Operation failed:', error);
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