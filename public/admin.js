const { useMemo, useState } = React;

function SectionCard({ title, subtitle, actions, children }) {
  return (
    <section className="admin-card glass float-card">
      <div className="admin-card-head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        {actions && <div className="admin-actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

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
  const [busy, setBusy] = useState(false);

  const hasToken = token.trim().length > 0;

  const authedFetch = async (url, options = {}) => {
    const headers = { ...(options.headers || {}), 'x-admin-token': token.trim() };
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const withLoader = async (fn) => {
    if (!hasToken) {
      setNotice('❌ Enter admin token first.');
      return;
    }

    setBusy(true);
    try {
      await fn();
    } catch (error) {
      setNotice(`❌ ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const loadOverview = () => withLoader(async () => {
    const data = await authedFetch('/api/admin/overview');
    setOverview(data);
    setNotice('✅ Overview loaded');
  });

  const loadUsers = () => withLoader(async () => {
    const data = await authedFetch('/api/admin/users?limit=150');
    setUsers(data.users || []);
    setNotice(`✅ Users loaded (${(data.users || []).length})`);
  });

  const loadMessages = () => withLoader(async () => {
    const params = new URLSearchParams({ limit: '200' });
    if (phoneFilter) params.set('phone', phoneFilter);
    const data = await authedFetch(`/api/admin/messages?${params.toString()}`);
    setMessages(data.messages || []);
    setNotice(`✅ Messages loaded (${(data.messages || []).length})`);
  });

  const runSimulator = async (e) => {
    e.preventDefault();

    if (!simPhone.trim() || !simText.trim()) {
      setNotice('❌ Enter simulator phone and message.');
      return;
    }

    await withLoader(async () => {
      const data = await authedFetch('/api/admin/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: simPhone, text: simText })
      });
      setSimOutput(`Incoming: ${data.incoming}\nReply: ${data.reply}`);
      setNotice('✅ Test simulation sent');
    });
  };

  const metricCards = useMemo(() => {
    if (!overview) return [];
    return [
      { label: 'Total Users', value: overview.totalUsers ?? 0 },
      { label: 'Onboarded Users', value: overview.onboardedUsers ?? 0 },
      { label: 'Total Meals', value: overview.totalMeals ?? 0 },
      { label: 'Messages Logged', value: overview.totalMessages ?? 0 }
    ];
  }, [overview]);

  return (
    <div className="page">
      <div className="admin-wrap">
        <section className="admin-top glass">
          <div>
            <span className="badge">FITBUDGET ADMIN</span>
            <h1 className="admin-title">Control Center</h1>
            <p className="muted">Monitor users, track logs, and test bot replies from one place.</p>
          </div>
          <div className="field admin-token">
            <label>Admin Token</label>
            <input
              className="input"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter ADMIN_PANEL_TOKEN"
            />
          </div>
        </section>

        <div className="admin-btn-row">
          <button type="button" className="btn ghost" onClick={loadOverview} disabled={busy}>Load Overview</button>
          <button type="button" className="btn ghost" onClick={loadUsers} disabled={busy}>Load Users</button>
          <button type="button" className="btn ghost" onClick={loadMessages} disabled={busy}>Load Messages</button>
        </div>

        {notice && <div className="notice">{notice}</div>}

        {metricCards.length > 0 && (
          <div className="admin-metrics">
            {metricCards.map((m) => (
              <div key={m.label} className="metric-card glass">
                <div className="metric-label">{m.label}</div>
                <div className="metric-value">{m.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="admin-grid">
          <SectionCard title="User List" subtitle="Latest users with profile summary">
            {users.length === 0 ? (
              <p className="muted">No users loaded yet.</p>
            ) : (
              <div className="admin-list">
                {users.map((user) => (
                  <article className="mini-card" key={user._id || user.phone}>
                    <div className="mini-title">{user.name || 'Unnamed user'}</div>
                    <div className="mini-line">📞 {user.phone || 'NA'}</div>
                    <div className="mini-line">🎯 {user.goal || 'NA'} • {user.dietType || 'NA'}</div>
                    <div className="mini-line">💧 {user.waterGoal || 0} • ₹{user.dailyBudget || 0}</div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Message Logs"
            subtitle="Recent incoming/outgoing messages"
            actions={(
              <input
                className="input"
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                placeholder="Filter by phone"
              />
            )}
          >
            {messages.length === 0 ? (
              <p className="muted">No messages loaded yet.</p>
            ) : (
              <div className="admin-list">
                {messages.map((msg) => (
                  <article className="mini-card" key={msg._id || `${msg.userId}-${msg.timestamp}`}>
                    <div className="mini-title">{msg.direction === 'outgoing' ? '🤖 Bot' : '👤 User'}</div>
                    <div className="mini-line">{msg.content}</div>
                    <div className="mini-line muted">{msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}</div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Test Message Simulator" subtitle="Send test input and inspect coach reply">
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
            <button className="btn" type="submit" disabled={busy}>Run Simulation</button>
          </form>
          {simOutput && <pre className="notice admin-pre">{simOutput}</pre>}
        </SectionCard>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
