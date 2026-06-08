import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, KeyRound, Mail, UserCheck, User, Phone, Check } from 'lucide-react';
import api from '../../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Registration Mode States
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const navigate = useNavigate();

  const [systemName, setSystemName] = useState(localStorage.getItem('system_name') || 'Ether REDP');
  const [systemLogoUrl, setSystemLogoUrl] = useState(localStorage.getItem('system_logo_url') || '');
  const [systemIconName, setSystemIconName] = useState(localStorage.getItem('system_icon_name') || 'Building2');
  const [systemIconUrl, setSystemIconUrl] = useState(localStorage.getItem('system_icon_url') || '');

  React.useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const res = await api.get('/system-info');
        if (res.data && res.data.success) {
          const { system_name, system_logo_url, system_icon_name, system_icon_url } = res.data.data;
          setSystemName(system_name || 'Ether REDP');
          setSystemLogoUrl(system_logo_url || '');
          setSystemIconName(system_icon_name || 'Building2');
          setSystemIconUrl(system_icon_url || '');
          localStorage.setItem('system_name', system_name || 'Ether REDP');
          localStorage.setItem('system_logo_url', system_logo_url || '');
          localStorage.setItem('system_icon_name', system_icon_name || 'Building2');
          localStorage.setItem('system_icon_url', system_icon_url || '');
        }
      } catch (err) {
        console.error('Failed to fetch system info:', err);
      }
    };
    fetchSystemInfo();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data && response.data.success) {
        localStorage.setItem('redp_token', response.data.token);
        localStorage.setItem('redp_user', JSON.stringify(response.data.user));
        setLoading(false);
        navigate('/');
      } else {
        setError(response.data.message || 'Authentication failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        password_confirmation: confirmPassword,
        phone: phone || null,
        role
      });
      if (response.data && response.data.success) {
        localStorage.setItem('redp_token', response.data.token);
        localStorage.setItem('redp_user', JSON.stringify(response.data.user));
        setLoading(false);
        navigate('/');
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Make sure email is unique and password is min 6 chars.');
    } finally {
      setLoading(false);
    }
  };

  const fillProfile = (selectedRole: string) => {
    setRole(selectedRole);
    setEmail(`${selectedRole}@redp.com`);
    setPassword('password');
    setConfirmPassword('password');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 10% 20%, rgba(203, 222, 209, 0.45) 0%, rgba(246, 248, 244, 0.85) 60%, rgba(228, 237, 222, 0.4) 100%), #f2f6f1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border-glass)' }}>
        
        {/* Title & Logo */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          {systemLogoUrl ? (
            <img src={systemLogoUrl} alt="System Logo" style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
          ) : systemIconUrl ? (
            <img src={systemIconUrl} alt="System Icon" style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
          ) : (
            <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
              {(() => {
                const Icon = systemIconName === 'Building2' ? Building2 : Building2; // default fallback
                return <Icon style={{ color: '#ffffff', width: '28px', height: '28px' }} />;
              })()}
            </div>
          )}
          <h1 style={{ fontSize: '1.65rem', fontWeight: 850, color: 'var(--text-main)' }}>{systemName}</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real Estate Digital Platform Portal</p>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', background: 'rgba(50, 71, 58, 0.05)', padding: '4px', borderRadius: 'var(--radius-sm)', gap: '4px' }}>
          <button 
            type="button" 
            onClick={() => { setIsRegister(false); setError(''); }}
            style={{ 
              flex: 1, 
              padding: '10px', 
              fontSize: '0.85rem', 
              fontWeight: 700, 
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: !isRegister ? '#ffffff' : 'transparent',
              color: !isRegister ? 'var(--color-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>
          <button 
            type="button" 
            onClick={() => { setIsRegister(true); setError(''); }}
            style={{ 
              flex: 1, 
              padding: '10px', 
              fontSize: '0.85rem', 
              fontWeight: 700, 
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: isRegister ? '#ffffff' : 'transparent',
              color: isRegister ? 'var(--color-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Register Operator
          </button>
        </div>

        {/* Sandbox Quick Fills - Only relevant for Login mode, but useful references */}
        {!isRegister && (
          <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.6)' }}>
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck style={{ width: '12px', height: '12px' }} />
              Quick-Fill Corporate Profiles
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Board & Executive */}
              <div>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Executive Board</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <button type="button" onClick={() => fillProfile('admin')} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.68rem', justifyContent: 'center' }}>👑 Admin (CEO)</button>
                  <button type="button" onClick={() => fillProfile('executive')} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.68rem', justifyContent: 'center' }}>👔 Exec Director</button>
                </div>
              </div>

              {/* Commercial Sales */}
              <div>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Commercial & Sales (CRM)</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <button type="button" onClick={() => fillProfile('company_sales')} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.68rem', justifyContent: 'center' }}>🏢 Sales Head (T3)</button>
                  <button type="button" onClick={() => fillProfile('sales_agent')} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.68rem', justifyContent: 'center' }}>🟠 Sales Agent</button>
                  <button type="button" onClick={() => fillProfile('tele_sales')} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.68rem', justifyContent: 'center' }}>📞 Tele-Sales (T1)</button>
                  <button type="button" onClick={() => fillProfile('broker')} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.68rem', justifyContent: 'center' }}>🍊 Broker (T2)</button>
                </div>
              </div>

              {/* Operations & Finance */}
              <div>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Operations & Finance</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <button type="button" onClick={() => fillProfile('finance_officer')} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.68rem', justifyContent: 'center' }}>🔵 Finance Officer</button>
                  <button type="button" onClick={() => fillProfile('project_manager')} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.68rem', justifyContent: 'center' }}>🏗️ Project Mgr</button>
                  <button type="button" onClick={() => fillProfile('delivery_engineer')} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.68rem', justifyContent: 'center' }}>🟢 Delivery Specialist</button>
                  <button type="button" onClick={() => fillProfile('maintenance_manager')} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.68rem', justifyContent: 'center' }}>🔧 Maintenance Mgr</button>
                </div>
              </div>

              {/* Legal & Compliance */}
              <div>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Legal & Compliance</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <button type="button" onClick={() => fillProfile('legal_officer')} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.68rem', justifyContent: 'center' }}>⚖️ Legal Officer</button>
                  <button type="button" onClick={() => fillProfile('compliance_officer')} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.68rem', justifyContent: 'center' }}>🔒 Compliance</button>
                </div>
              </div>

              {/* Clients */}
              <div>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Clients</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                  <button type="button" onClick={() => fillProfile('client')} className="btn-secondary" style={{ padding: '6px 8px', fontSize: '0.68rem', justifyContent: 'center' }}>🐳 Homeowner Client</button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Main form */}
        <form onSubmit={isRegister ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', textAlign: 'center', padding: '8px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}

          {isRegister && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '16px', top: '14px', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ paddingLeft: '44px', fontSize: '0.85rem' }} 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. User Operator" 
                  required 
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '16px', top: '14px', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                className="form-control" 
                style={{ paddingLeft: '44px', fontSize: '0.85rem' }} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com" 
                required 
              />
            </div>
          </div>

          {isRegister && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone style={{ position: 'absolute', left: '16px', top: '14px', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ paddingLeft: '44px', fontSize: '0.85rem' }} 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +20100998877" 
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound style={{ position: 'absolute', left: '16px', top: '14px', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                className="form-control" 
                style={{ paddingLeft: '44px', fontSize: '0.85rem' }} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
              />
            </div>
          </div>

          {isRegister && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <KeyRound style={{ position: 'absolute', left: '16px', top: '14px', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="form-control" 
                  style={{ paddingLeft: '44px', fontSize: '0.85rem' }} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" 
                  required 
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{isRegister ? 'Role in Platform' : 'Login Role (Simulated)'}</label>
            <select 
              className="form-control"
              value={role}
              onChange={(e) => {
                const val = e.target.value;
                setRole(val);
                if (!isRegister) {
                  fillProfile(val);
                }
              }}
              style={{ cursor: 'pointer', fontSize: '0.85rem' }}
            >
              <option value="admin">👑 Platform Administrator (CEO)</option>
              <option value="executive">👔 Executive Director</option>
              <option value="company_sales">🏢 Commercial Sales Head (Tier 3)</option>
              <option value="sales_agent">🟠 Sales Agent</option>
              <option value="tele_sales">📞 Tele-Sales Agent (Tier 1)</option>
              <option value="broker">🍊 External Broker (Tier 2)</option>
              <option value="finance_officer">🔵 Financial Officer</option>
              <option value="project_manager">🏗️ Project Manager</option>
              <option value="delivery_engineer">🟢 Delivery Specialist</option>
              <option value="maintenance_manager">🔧 Facilities Maintenance Manager</option>
              <option value="legal_officer">⚖️ Legal Officer</option>
              <option value="compliance_officer">🔒 Compliance Officer</option>
              <option value="client">🐳 Compound Client/Homeowner</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '8px', fontSize: '0.9rem' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isRegister ? 'Register Account' : 'Sign In')}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;
