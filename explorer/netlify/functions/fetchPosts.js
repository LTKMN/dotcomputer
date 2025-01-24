const { BskyAgent } = require('@atproto/api');

exports.handler = async function(event, context) {
  // Our trusty CORS shield! 🛡️
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Carefully extract our quantum parameters
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid request format - our JSON parser got cosmic vertigo!'
        })
      };
    }

    const { handle, numPosts = 10 } = requestBody;
    
    if (!handle) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Handle is required for our quantum entanglement to work!'
        })
      };
    }

    // Initialize our Bluesky quantum tunnel
    const agent = new BskyAgent({ service: 'https://bsky.social' });
    
    // First, let's make sure our handle exists in this dimension
    try {
      const profile = await agent.resolveHandle({ handle });
      
      // Now fetch their feed with extra error handling!
      const posts = await agent.getAuthorFeed({
        actor: profile.data.did,
        limit: parseInt(numPosts)
      });

      // Transform our posts into pristine JSON structures
      const plainTextPosts = posts.data.feed.map(post => ({
        text: post.post.record.text,
        createdAt: new Date(post.post.record.createdAt).toISOString()
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: plainTextPosts })
      };
      
    } catch (apiError) {
      console.error('Bluesky API error:', apiError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: `Failed to fetch posts: ${apiError.message}`
        })
      };
    }
  } catch (error) {
    console.error('General error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'A cosmic anomaly occurred while fetching posts!'
      })
    };
  }
}