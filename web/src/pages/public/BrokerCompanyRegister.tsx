import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, ArrowRight, ArrowLeft, Check, FileText, Landmark, UserCircle,
  Mail, Phone, KeyRound, Upload, CheckCircle2, Loader2, ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';

const BLUE = '#003DA6';
const DARK = '#00205b';

const BrokerCompanyRegister: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const [f, setF] = useState({
    company_name: '', legal_name: '', registration_number: '', tax_id: '', license_no: '',
    phone: '', email: '', address: '', city: '',
    bank_name: '', bank_iban: '',
    owner_name: '', owner_email: '', owner_phone: '', owner_password: '', owner_password_confirmation: '',
  });
  const [taxCard, setTaxCard] = useState<File | null>(null);
  const [commReg, setCommReg] = useState<File | null>(null);

  const set = (k: string, v: string) => setF(prev => ({ ...prev, [k]: v }));

  const validateStep = (): string => {
    if (step === 1) {
      if (!f.company_name.trim()) return 'Agency name is required.';
      if (!f.phone.trim()) return 'Phone number is required.';
    }
    if (step === 3) {
      if (!f.owner_name.trim()) return 'Manager name is required.';
      if (!f.owner_email.trim()) return 'Manager email is required.';
      if (f.owner_password.length < 6) return 'Password must be at least 6 characters.';
      if (f.owner_password !== f.owner_password_confirmation) return 'Passwords do not match.';
    }
    return '';
  };

  const next = () => {
    const v = validateStep();
    if (v) { setError(v); return; }
    setError(''); setStep(s => Math.min(3, s + 1));
  };
  const back = () => { setError(''); setStep(s => Math.max(1, s - 1)); };

  const submit = async () => {
    const v = validateStep();
    if (v) { setError(v); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, val]) => { if (val) fd.append(k, val); });
      if (taxCard) fd.append('tax_card', taxCard);
      if (commReg) fd.append('commercial_registry', commReg);

      const res = await api.post('/v1/broker-companies/register', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data?.success) setDone(true);
      else setError(res.data?.message || 'Registration failed.');
    } catch (err: any) {
      setError(err.response?.data?.message || (Object.values(err.response?.data?.errors || {})[0] as any)?.[0] || 'Registration failed. Please check your details.');
    } finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', background: '#fff', border: '1px solid rgba(0,61,166,.15)',
    borderRadius: 12, color: '#0f172a', fontSize: '.85rem', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '.78rem', fontWeight: 700, color: '#334155', marginBottom: 6 };

  const Field: React.FC<{ label: string; k: keyof typeof f; type?: string; icon?: any; placeholder?: string; required?: boolean }> = ({ label, k, type = 'text', placeholder, required }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}{required && <span style={{ color: '#dc2626' }}> *</span>}</label>
      <input style={inputStyle} type={type} value={f[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder} />
    </div>
  );

  const FileField: React.FC<{ label: string; file: File | null; onPick: (f: File | null) => void }> = ({ label, file, onPick }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <label style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: file ? '#0f172a' : '#94a3b8' }}>
        <Upload style={{ width: 15, height: 15, color: BLUE }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file ? file.name : 'Upload PDF / image (max 10MB)'}</span>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => onPick(e.target.files?.[0] || null)} />
      </label>
    </div>
  );

  if (done) {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: 'center', maxWidth: 460 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(5,150,105,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle2 style={{ width: 40, height: 40, color: '#059669' }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 10px', fontFamily: 'var(--font-title)' }}>Application Submitted!</h2>
          <p style={{ color: '#64748b', fontSize: '.9rem', lineHeight: 1.6 }}>
            Your agency <b>{f.company_name}</b> is now pending admin review. Once our team verifies your documents and approves your account,
            you'll be able to sign in with <b>{f.owner_email}</b> and start managing your brokerage team.
          </p>
          <button style={{ ...primaryBtn, marginTop: 22 }} onClick={() => navigate('/login')}>
            Go to Sign In <ArrowRight style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={{ ...card, maxWidth: 620 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${BLUE},${DARK})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Building2 style={{ width: 26, height: 26, color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-title)', color: '#0f172a' }}>Register Your Brokerage Agency</h1>
          <p style={{ color: '#64748b', fontSize: '.85rem', marginTop: 6 }}>Join REDP as a partner agency and manage your own team of brokers.</p>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 26 }}>
          {[{ n: 1, label: 'Agency', icon: Building2 }, { n: 2, label: 'Documents', icon: FileText }, { n: 3, label: 'Manager', icon: UserCircle }].map((s, i) => (
            <React.Fragment key={s.n}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step >= s.n ? BLUE : '#e2e8f0', color: step >= s.n ? '#fff' : '#94a3b8', transition: 'all .3s' }}>
                  {step > s.n ? <Check style={{ width: 16, height: 16 }} /> : <s.icon style={{ width: 16, height: 16 }} />}
                </div>
                <span style={{ fontSize: '.68rem', fontWeight: 700, color: step >= s.n ? BLUE : '#94a3b8' }}>{s.label}</span>
              </div>
              {i < 2 && <div style={{ width: 40, height: 2, background: step > s.n ? BLUE : '#e2e8f0', marginBottom: 18 }} />}
            </React.Fragment>
          ))}
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)', color: '#ef4444', padding: '10px 14px', borderRadius: 12, fontSize: '.8rem', marginBottom: 16, fontWeight: 500 }}>{error}</div>}

        {/* Step 1 — Agency */}
        {step === 1 && (
          <div>
            <Field label="Agency Name" k="company_name" required placeholder="e.g. Elite Realty" />
            <div style={grid2}>
              <Field label="Legal Name" k="legal_name" placeholder="Registered legal name" />
              <Field label="Commercial Reg. No." k="registration_number" />
            </div>
            <div style={grid2}>
              <Field label="Tax ID" k="tax_id" />
              <Field label="License No." k="license_no" />
            </div>
            <div style={grid2}>
              <Field label="Phone" k="phone" required placeholder="+20 …" />
              <Field label="Agency Email" k="email" type="email" />
            </div>
            <div style={grid2}>
              <Field label="City" k="city" />
              <Field label="Address" k="address" />
            </div>
          </div>
        )}

        {/* Step 2 — Documents & bank */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(0,61,166,.04)', padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>
              <ShieldCheck style={{ width: 16, height: 16, color: BLUE }} />
              <span style={{ fontSize: '.76rem', color: '#475569' }}>Documents help us verify and approve your agency faster. Optional but recommended.</span>
            </div>
            <FileField label="Tax Card" file={taxCard} onPick={setTaxCard} />
            <FileField label="Commercial Registry" file={commReg} onPick={setCommReg} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '18px 0 10px' }}>
              <Landmark style={{ width: 16, height: 16, color: BLUE }} />
              <span style={{ fontSize: '.8rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '.04em' }}>Bank Details (for payouts)</span>
            </div>
            <Field label="Bank Name" k="bank_name" />
            <Field label="IBAN / Account" k="bank_iban" />
          </div>
        )}

        {/* Step 3 — Manager account */}
        {step === 3 && (
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(0,61,166,.04)', padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>
              <UserCircle style={{ width: 16, height: 16, color: BLUE }} />
              <span style={{ fontSize: '.76rem', color: '#475569' }}>This account is the agency owner/manager — it manages employees, teams and projects.</span>
            </div>
            <Field label="Manager Full Name" k="owner_name" required />
            <div style={grid2}>
              <Field label="Manager Email (login)" k="owner_email" type="email" required />
              <Field label="Manager Phone" k="owner_phone" />
            </div>
            <div style={grid2}>
              <Field label="Password" k="owner_password" type="password" required />
              <Field label="Confirm Password" k="owner_password_confirmation" type="password" required />
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 20 }}>
          {step > 1 ? (
            <button style={ghostBtn} onClick={back}><ArrowLeft style={{ width: 15, height: 15 }} /> Back</button>
          ) : (
            <button style={ghostBtn} onClick={() => navigate('/login')}><ArrowLeft style={{ width: 15, height: 15 }} /> Sign In</button>
          )}
          {step < 3 ? (
            <button style={primaryBtn} onClick={next}>Continue <ArrowRight style={{ width: 15, height: 15 }} /></button>
          ) : (
            <button style={{ ...primaryBtn, opacity: loading ? .7 : 1 }} onClick={submit} disabled={loading}>
              {loading ? <Loader2 className="spin" style={{ width: 15, height: 15 }} /> : <Check style={{ width: 15, height: 15 }} />} Submit Application
            </button>
          )}
        </div>
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

const wrap: React.CSSProperties = { minHeight: '100vh', background: 'linear-gradient(135deg,#eef2ff 0%,#f8fafc 60%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'var(--font-body)' };
const card: React.CSSProperties = { background: '#fff', borderRadius: 22, padding: 34, width: '100%', boxShadow: '0 20px 60px rgba(0,15,61,.12)', border: '1px solid rgba(0,61,166,.06)' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };
const primaryBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(135deg,${BLUE},${DARK})`, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 22px', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,61,166,.2)' };
const ghostBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#64748b', border: '1px solid rgba(0,61,166,.12)', borderRadius: 12, padding: '11px 20px', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer' };

export default BrokerCompanyRegister;
