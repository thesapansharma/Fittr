const { useEffect, useState } = React;

function App() {
  const [capacity, setCapacity] = useState({ limit: 200, used: 0, remaining: 200 });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    weight: '',
    height: '',
    goal: 'lose weight',
    bodyShapeGoal: 'fat loss',
    officeTiming: '9am-6pm desk',
    sleepHours: '7',
    exerciseHabit: 'none',
    waterGoal: '8',
    dailyBudget: '250',
    dietType: 'vegetarian',
    currentDiet: '',
    easyDietMode: true,
    medicalIssues: []
  });

  const loadCapacity = async () => {
    try {
      const response = await fetch('/api/register/capacity');
      const data = await response.json();
      setCapacity(data);
    } catch {
      setNotice('Unable to load capacity right now.');
    }
  };

  useEffect(() => {
    loadCapacity();
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleMedical = (value) => {
    setForm((prev) => ({
      ...prev,
      medicalIssues: prev.medicalIssues.includes(value)
        ? prev.medicalIssues.filter((v) => v !== value)
        : [...prev.medicalIssues, value]
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotice('');
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      setNotice(`✅ ${data.message}. Welcome ${data.user.name}! Free slots left: ${data.freeAccess.remaining}`);
      loadCapacity();
    } catch (error) {
      setNotice(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const usedPct = Math.min((capacity.used / capacity.limit) * 100, 100);

  return (
    <div className="page">
      <div className="hero">
        <section className="glass hero-copy">
          <span className="badge">AI FITNESS COACH • WHATSAPP READY</span>
          <h1>Modern Health Coaching for Busy People</h1>
          <p className="muted">
            Register now for premium access — free for first <b>200</b> users. Smart diet suggestions, workout guidance,
            hydration reminders, budget-aware meals, and medical-aware coaching.
          </p>
          <div className="feature-grid">
            <div className="feature">⚡ Trending high-tech UI</div>
            <div className="feature">🤖 AI + rule-based reliability</div>
            <div className="feature">💧 Smart reminder automation</div>
            <div className="feature">🥗 Diet + medical personalization</div>
          </div>
        </section>

        <section className="glass form-card">
          <div className="capacity">
            <div><b>Free Access Capacity</b> — {capacity.remaining} / {capacity.limit} seats left</div>
            <div className="capacity-bar"><div className="capacity-fill" style={{ width: `${usedPct}%` }} /></div>
          </div>

          <form onSubmit={onSubmit}>
            <div className="grid">
              <div className="field"><label>Name</label><input className="input" name="name" value={form.name} onChange={onChange} required /></div>
              <div className="field"><label>Phone</label><input className="input" name="phone" value={form.phone} onChange={onChange} required /></div>
              <div className="field"><label>Goal</label><select name="goal" value={form.goal} onChange={onChange}><option>lose weight</option><option>stay fit</option><option>gain muscle</option></select></div>
              <div className="field"><label>Body Shape Goal</label><input className="input" name="bodyShapeGoal" value={form.bodyShapeGoal} onChange={onChange} /></div>
              <div className="field"><label>Diet Type</label><select name="dietType" value={form.dietType} onChange={onChange}><option>vegetarian</option><option>vegan</option><option>eggetarian</option><option>non_vegetarian</option></select></div>
              <div className="field"><label>Current Diet</label><input className="input" name="currentDiet" value={form.currentDiet} onChange={onChange} required /></div>
              <div className="field"><label>Daily Budget (₹)</label><input className="input" name="dailyBudget" value={form.dailyBudget} onChange={onChange} /></div>
              <div className="field"><label>Water Goal (glasses)</label><input className="input" name="waterGoal" value={form.waterGoal} onChange={onChange} /></div>
              <div className="field full"><label>Office Timing / Work Type</label><input className="input" name="officeTiming" value={form.officeTiming} onChange={onChange} /></div>
              <div className="field full">
                <label>Medical Issues</label>
                <div className="muted" style={{fontSize:'13px'}}>
                  <input type="checkbox" checked={form.medicalIssues.includes('diabetes')} onChange={() => toggleMedical('diabetes')} /> Diabetes &nbsp;
                  <input type="checkbox" checked={form.medicalIssues.includes('high_bp')} onChange={() => toggleMedical('high_bp')} /> High BP &nbsp;
                  <input type="checkbox" checked={form.medicalIssues.includes('kidney_stone')} onChange={() => toggleMedical('kidney_stone')} /> Kidney Stone
                </div>
              </div>
              <div className="field full muted" style={{fontSize:'13px'}}>
                <input type="checkbox" name="easyDietMode" checked={form.easyDietMode} onChange={onChange} /> Keep diet changes easy and gradual
              </div>
            </div>
            <button className="btn" disabled={loading || capacity.remaining <= 0}>{loading ? 'Registering...' : 'Register Now (Free Access)'}</button>
            {notice && <div className="notice">{notice}</div>}
          </form>
        </section>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
