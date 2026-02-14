const { useEffect, useState } = React;

function formatMedicalLabel(value) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function App() {
  const [capacity, setCapacity] = useState({ limit: 200, used: 0, remaining: 200 });
  const [medicalOptions, setMedicalOptions] = useState([]);
  const [officeOptions, setOfficeOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [otpStatus, setOtpStatus] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyToken, setVerifyToken] = useState('');

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
    currentDiet: 'home cooked mixed meals',
    easyDietMode: true,
    medicalIssues: [],
    privacyAccepted: false,
    termsAccepted: false
  });

  const loadInitialData = async () => {
    const [capacityRes, medicalRes, officeRes] = await Promise.all([
      fetch('/api/register/capacity'),
      fetch('/api/register/medical-options'),
      fetch('/api/register/office-timing-options')
    ]);

    if (!capacityRes.ok || !medicalRes.ok || !officeRes.ok) {
      throw new Error('Unable to load registration data');
    }

    const capacityData = await capacityRes.json();
    const medicalData = await medicalRes.json();
    const officeData = await officeRes.json();

    setCapacity(capacityData);
    setMedicalOptions(medicalData.medicalIssues || []);
    const offices = officeData.officeTimings || [];
    setOfficeOptions(offices);
    if (offices.length) {
      setForm((prev) => ({ ...prev, officeTiming: offices.includes(prev.officeTiming) ? prev.officeTiming : offices[0] }));
    }
  };

  useEffect(() => {
    loadInitialData().catch((error) => setNotice(`❌ ${error.message}`));
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked, options } = e.target;
    if (name === 'medicalIssues') {
      const selected = Array.from(options).filter((opt) => opt.selected).map((opt) => opt.value);
      setForm((prev) => ({ ...prev, medicalIssues: selected }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const sendOtp = async () => {
    setOtpLoading(true);
    setOtpStatus('');
    setVerifyToken('');
    try {
      const response = await fetch('/api/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
      setOtpStatus('✅ OTP sent on WhatsApp. Enter it below to verify.');
    } catch (error) {
      setOtpStatus(`❌ ${error.message}`);
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    setOtpLoading(true);
    try {
      const response = await fetch('/api/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, otp: otpCode })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'OTP verification failed');
      setVerifyToken(data.verifyToken);
      setOtpStatus('✅ Phone number verified successfully.');
    } catch (error) {
      setVerifyToken('');
      setOtpStatus(`❌ ${error.message}`);
    } finally {
      setOtpLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotice('');

    if (!verifyToken) {
      setLoading(false);
      setNotice('❌ Verify your WhatsApp OTP before registration.');
      return;
    }

    if (!form.privacyAccepted || !form.termsAccepted) {
      setLoading(false);
      setNotice('❌ Please accept the Privacy Policy and Terms & Conditions.');
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, verifyToken })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');

      setNotice(`✅ ${data.message}. Welcome ${data.user.name}! Free slots left: ${data.freeAccess.remaining}`);
      const cap = await fetch('/api/register/capacity').then((res) => res.json());
      setCapacity(cap);
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
        <section className="glass hero-copy float-card">
          <span className="badge">PERSONAL HEALTH COACH • WHATSAPP SUPPORT</span>
          <h1>Simple, Trusted Health Coaching for Everyday Life</h1>
          <p className="muted">
            Register now for personalized support — free for the first <b>200</b> users.
            We keep your plan practical, budget-aware, and easy to follow.
          </p>
          <div className="feature-grid">
            <div className="feature">✅ Everyday-friendly meal guidance</div>
            <div className="feature">🧭 Work-schedule based reminders</div>
            <div className="feature">💧 Water and activity habit support</div>
            <div className="feature">🩺 Diet and medical-aware suggestions</div>
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
              <div className="field"><label>WhatsApp Phone</label><input className="input" name="phone" value={form.phone} onChange={onChange} required /></div>

              <div className="field full otp-row">
                <button type="button" className="btn ghost" onClick={sendOtp} disabled={otpLoading || !form.phone}>Send OTP</button>
                <input className="input" placeholder="Enter OTP" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
                <button type="button" className="btn ghost" onClick={verifyOtp} disabled={otpLoading || !otpCode}>Verify OTP</button>
              </div>
              {otpStatus && <div className="notice">{otpStatus}</div>}

              <div className="field"><label>Goal</label><select name="goal" value={form.goal} onChange={onChange}><option>lose weight</option><option>stay fit</option><option>gain muscle</option></select></div>
              <div className="field"><label>Body Shape Goal</label><select name="bodyShapeGoal" value={form.bodyShapeGoal} onChange={onChange}><option>fat loss</option><option>lean & toned</option><option>muscle gain</option><option>maintain shape</option></select></div>
              <div className="field"><label>Diet Type</label><select name="dietType" value={form.dietType} onChange={onChange}><option>vegetarian</option><option>vegan</option><option>eggetarian</option><option>non_vegetarian</option></select></div>
              <div className="field"><label>Current Diet</label><select name="currentDiet" value={form.currentDiet} onChange={onChange}><option>home cooked mixed meals</option><option>mostly vegetarian home food</option><option>frequent outside food</option><option>high carb traditional meals</option><option>irregular meal timing</option></select></div>
              <div className="field"><label>Daily Budget (₹)</label><input className="input" name="dailyBudget" value={form.dailyBudget} onChange={onChange} /></div>
              <div className="field"><label>Water Goal (glasses)</label><select name="waterGoal" value={form.waterGoal} onChange={onChange}><option>6</option><option>8</option><option>10</option><option>12</option></select></div>
              <div className="field full"><label>Office Timing / Work Type</label><select className="input" name="officeTiming" value={form.officeTiming} onChange={onChange}>{officeOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
              <div className="field full">
                <label>Medical Issues</label>
                <select className="input" name="medicalIssues" multiple value={form.medicalIssues} onChange={onChange} size="6">
                  {medicalOptions.map((option) => <option key={option} value={option}>{formatMedicalLabel(option)}</option>)}
                </select>
                <div className="muted helper">Hold Ctrl/Cmd to select multiple.</div>
              </div>
              <div className="field full muted helper">
                <input type="checkbox" name="easyDietMode" checked={form.easyDietMode} onChange={onChange} /> Keep diet changes easy and gradual
              </div>
              <div className="field full muted helper">
                <input type="checkbox" name="privacyAccepted" checked={form.privacyAccepted} onChange={onChange} /> I agree to the <a href="/privacy-policy.html" target="_blank">Privacy Policy</a>
              </div>
              <div className="field full muted helper">
                <input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={onChange} /> I agree to the <a href="/terms-and-conditions.html" target="_blank">Terms & Conditions</a>
              </div>
            </div>
            <button className="btn" disabled={loading || capacity.remaining <= 0 || !verifyToken}>{loading ? 'Registering...' : 'Register Now (Free Access)'}</button>
            {notice && <div className="notice">{notice}</div>}
          </form>
        </section>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
