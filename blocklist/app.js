// app.js
const { useState } = React;
const { BskyAgent } = AtprotoApi;

function App() {
  const [sourceHandle, setSourceHandle] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    const agent = new BskyAgent({ service: 'https://bsky.social' });

    try {
      await agent.login({ identifier, password });
      const blocks = await agent.getBlocks({ actor: sourceHandle });
      
      const listResponse = await agent.api.app.bsky.graph.list.create(
        { did: agent.session?.did },
        {
          name: `imported from ${sourceHandle}`,
          purpose: 'mod',
          description: `moderation list imported from ${sourceHandle}'s block list`,
          createdAt: new Date().toISOString()
        }
      );

      await Promise.all(blocks.blocks.map(user => 
        agent.api.app.bsky.graph.listitem.create(
          { did: agent.session?.did },
          {
            subject: user.did,
            list: listResponse.uri,
            createdAt: new Date().toISOString()
          }
        )
      ));

      setStatus('success! moderation list created.');
    } catch (error) {
      setStatus(`oof. error: ${error.message}`);
    }

    setLoading(false);
    setPassword('');
  };

  return (
    <div className="container">
      <h1>Bluesky Block List Converter</h1>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Source Block List</label>
          <input
            placeholder="e.g. brennan.computer"
            value={sourceHandle}
            onChange={(e) => setSourceHandle(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>Your Handle/Email</label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            type="password (use app password from your bsky settings panel)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Converting...' : 'Convert to Mod List'}
        </button>
      </form>

      {status && (
        <div className={`status ${status.startsWith('Error') ? 'error' : 'success'}`}>
          {status}
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));