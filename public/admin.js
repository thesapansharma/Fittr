const { useState } = React;

function App() {
  const [token, setToken] = useState('');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [phoneFilter, setPhoneFilter] = useState('');
  const [simPhone, setSimPhone] = useState('');
  const [simText, setSimText] = useState('');
  const [simOutput, setSimOutput] = useState('');
  const [notice, setNotice] = useState('');

  const authedFetch = async (url, options = {}) => {
    const headers = { ...(options.headers || {}), 'x-admin-token': token };
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const loadOverview = async () => {
    try {
      const data = await authedFetch('/api/admin/overview');
      setOverview(data);
      setNotice('✅ Overview loaded');
    } catch (error) {
      setNotice(`❌ ${error.message}`);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await authedFetch('/api/admin/users?limit=150');
      setUsers(data.users || []);
      setNotice('✅ Users loaded');
    } catch (error) {
      setNotice(`❌ ${error.message}`);
    }
  };

  const loadMessages = async () => {
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (phoneFilter) params.set('phone', phoneFilter);
      const data = await authedFetch(`/api/admin/messages?${params.toString()}`);
      setMessages(data.messages || []);
      setNotice('✅ Messages loaded');
    } catch (error) {
      setNotice(`❌ ${error.message}`);
    }
  };

  const runSimulator = async (e) => {
    e.preventDefault();
    try {
      const data = await authedFetch('/api/admin/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: simPhone, text: simText })
      });
      setSimOutput(`Incoming: ${data.incoming}\nReply: ${data.reply}`);
      setNotice('✅ Test simulation sent');
    } catch (error) {
      setNotice(`❌ ${error.message}`);
    }
  };

  return (
    <div className="page">
      <div className="hero">
        <section className="glass form-card" style={{ width: '100%' }}>
          <h2>Admin Panel</h2>
          <p className="muted">View user list, logs, and run test message simulation.</p>

          <div className="grid">
            <div className="field full">
              <label>Admin Token</label>
              <input className="input" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter ADMIN_PANEL_TOKEN" />
            </div>
          </div>

          <div className="otp-row" style={{ marginBottom: 16 }}>
            <button type="button" className="btn ghost" onClick={loadOverview}>Load Overview</button>
            <button type="button" className="btn ghost" onClick={loadUsers}>Load Users</button>
            <button type="button" className="btn ghost" onClick={loadMessages}>Load Messages</button>
          </div>

          {overview && (
            <pre className="notice">{JSON.stringify(overview, null, 2)}</pre>
          )}

          <h3>User List</h3>
          <pre className="notice" style={{ maxHeight: 220, overflow: 'auto' }}>
            {JSON.stringify(users, null, 2)}
          </pre>

          <h3>Message Logs</h3>
          <div className="field full">
            <label>Filter by Phone (optional)</label>
            <input className="input" value={phoneFilter} onChange={(e) => setPhoneFilter(e.target.value)} placeholder="9198xxxxxx" />
          </div>
          <pre className="notice" style={{ maxHeight: 220, overflow: 'auto' }}>
            {JSON.stringify(messages, null, 2)}
          </pre>

          <h3>Test Message Simulator</h3>
          <form onSubmit={runSimulator}>
            <div className="grid">
              <div className="field">
                <label>Phone</label>
                <input className="input" value={simPhone} onChange={(e) => setSimPhone(e.target.value)} required />
              </div>
              <div className="field">
                <label>Test Message</label>
                <input className="input" value={simText} onChange={(e) => setSimText(e.target.value)} required />
              </div>
            </div>
            <button className="btn" type="submit">Run Simulation</button>
          </form>

          {simOutput && <pre className="notice">{simOutput}</pre>}
          {notice && <div className="notice">{notice}</div>}
        </section>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
