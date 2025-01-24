const { BskyAgent } = require('@atproto/api');

exports.handler = async function(event, context) {
  // CORS headers for our intergalactic travelers! 🛸
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests from other star systems
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { handle, numPosts = 10 } = JSON.parse(event.body || '{}');
    
    if (!handle) {
      throw new Error('Handle is required for our quantum entanglement to work!');
    }

    const agent = new BskyAgent({ service: 'https://bsky.social' });
    const profile = await agent.resolveHandle({ handle });
    const posts = await agent.getAuthorFeed({
      actor: profile.data.did,
      limit: parseInt(numPosts)
    });

    const plainTextPosts = posts.data.feed.map(post => ({
      text: post.post.record.text,
      createdAt: new Date(post.post.record.createdAt).toISOString()
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(plainTextPosts)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}