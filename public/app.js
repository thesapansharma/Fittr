const { useEffect, useState } = React;

function formatMedicalLabel(value) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function App() {
  const [capacity, setCapacity] = useState({ limit: 200, used: 0, remaining: 200 });
  const [medicalOptions, setMedicalOptions] = useState([]);
  const [officeOptions, setOfficeOptions] = useState({ officeStarts: [], officeEnds: [], workTypes: [] });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [otpStatus, setOtpStatus] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    weight: '',
    height: '',
    goal: 'lose weight',
    bodyShapeGoal: 'fat loss',
    officeStart: '09:00',
    officeEnd: '18:00',
    workType: 'desk',
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
    setOfficeOptions({
      officeStarts: officeData.officeStarts || [],
      officeEnds: officeData.officeEnds || [],
      workTypes: officeData.workTypes || []
    });

    setForm((prev) => ({
      ...prev,
      officeStart: (officeData.officeStarts || []).includes(prev.officeStart) ? prev.officeStart : (officeData.officeStarts || ['09:00'])[0],
      officeEnd: (officeData.officeEnds || []).includes(prev.officeEnd) ? prev.officeEnd : (officeData.officeEnds || ['18:00'])[0],
      workType: (officeData.workTypes || []).includes(prev.workType) ? prev.workType : (officeData.workTypes || ['desk'])[0]
    }));
  };

  useEffect(() => {
    loadInitialData().catch((error) => setNotice(`❌ ${error.message}`));
  }, []);

  const toggleMedicalIssue = (issue) => {
    setForm((prev) => ({
      ...prev,
      medicalIssues: prev.medicalIssues.includes(issue)
        ? prev.medicalIssues.filter((v) => v !== issue)
        : [...prev.medicalIssues, issue]
    }));
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
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
      setOtpStatus('✅ OTP sent on WhatsApp. Enter it to verify.');
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
      setShowOtpModal(false);
    } catch (error) {
      setVerifyToken('');
      setOtpStatus(`❌ ${error.message}`);
    } finally {
      setOtpLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setNotice('');

    if (!verifyToken) {
      setShowOtpModal(true);
      setNotice('⚠️ Please verify OTP to continue.');
      return;
    }

    if (!form.privacyAccepted || !form.termsAccepted) {
      setNotice('❌ Please accept the Privacy Policy and Terms & Conditions.');
      return;
    }

    setLoading(true);
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
          <p className="muted">Register now for personalized support — free for the first <b>200</b> users.</p>
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

          {verifyToken ? <div className="otp-ok">✅ WhatsApp number verified</div> : <button type="button" className="btn ghost" onClick={() => setShowOtpModal(true)}>Verify WhatsApp OTP</button>}

          <form onSubmit={onSubmit}>
            <div className="grid">
              <div className="field"><label>Name</label><input className="input" name="name" value={form.name} onChange={onChange} required /></div>
              <div className="field"><label>WhatsApp Phone</label><input className="input" name="phone" value={form.phone} onChange={onChange} required /></div>
              <div className="field"><label>Goal</label><select name="goal" value={form.goal} onChange={onChange}><option>lose weight</option><option>stay fit</option><option>gain muscle</option></select></div>
              <div className="field"><label>Body Shape Goal</label><select name="bodyShapeGoal" value={form.bodyShapeGoal} onChange={onChange}><option>fat loss</option><option>lean & toned</option><option>muscle gain</option><option>maintain shape</option></select></div>
              <div className="field"><label>Diet Type</label><select name="dietType" value={form.dietType} onChange={onChange}><option>vegetarian</option><option>vegan</option><option>eggetarian</option><option>non_vegetarian</option></select></div>
              <div className="field"><label>Current Diet</label><select name="currentDiet" value={form.currentDiet} onChange={onChange}><option>home cooked mixed meals</option><option>mostly vegetarian home food</option><option>frequent outside food</option><option>high carb traditional meals</option><option>irregular meal timing</option></select></div>

              <div className="field"><label>Work Type</label><select name="workType" value={form.workType} onChange={onChange}>{officeOptions.workTypes.map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
              <div className="field"><label>Office Start</label><select name="officeStart" value={form.officeStart} onChange={onChange}>{officeOptions.officeStarts.map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
              <div className="field"><label>Office End</label><select name="officeEnd" value={form.officeEnd} onChange={onChange}>{officeOptions.officeEnds.map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
              <div className="field"><label>Daily Budget (₹)</label><select name="dailyBudget" value={form.dailyBudget} onChange={onChange}><option value="150">₹150-₹200</option><option value="250">₹200-₹300</option><option value="350">₹300-₹400</option><option value="500">₹400+</option></select></div>

              <div className="field"><label>Water Goal (glasses)</label><select name="waterGoal" value={form.waterGoal} onChange={onChange}><option>6</option><option>8</option><option>10</option><option>12</option></select></div>

              <div className="field full">
                <label>Medical Issues</label>
                <div className="pill-wrap">
                  {medicalOptions.map((issue) => (
                    <button type="button" key={issue} className={`pill ${form.medicalIssues.includes(issue) ? 'active' : ''}`} onClick={() => toggleMedicalIssue(issue)}>
                      {formatMedicalLabel(issue)}
                    </button>
                  ))}
                </div>
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
            <button className="btn" disabled={loading || capacity.remaining <= 0}>{loading ? 'Registering...' : 'Register Now (Free Access)'}</button>
            {notice && <div className="notice">{notice}</div>}
          </form>
        </section>
      </div>

      {showOtpModal && (
        <div className="modal-backdrop">
          <div className="glass modal">
            <h3>Verify WhatsApp Number</h3>
            <p className="muted">Send OTP, then enter it to continue registration.</p>
            <input className="input" name="phone" placeholder="WhatsApp phone" value={form.phone} onChange={onChange} />
            <div className="otp-row">
              <button type="button" className="btn ghost" onClick={sendOtp} disabled={otpLoading || !form.phone}>Send OTP</button>
              <input className="input" placeholder="Enter OTP" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
              <button type="button" className="btn ghost" onClick={verifyOtp} disabled={otpLoading || !otpCode}>Verify OTP</button>
            </div>
            {otpStatus && <div className="notice">{otpStatus}</div>}
            <button type="button" className="btn ghost" onClick={() => setShowOtpModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
