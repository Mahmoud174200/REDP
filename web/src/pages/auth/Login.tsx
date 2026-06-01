import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, KeyRound, Mail, UserCheck } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      localStorage.setItem('redp_token', 'sandbox_auth_token_value');
      localStorage.setItem('redp_user', JSON.stringify({
        name: role.charAt(0).toUpperCase() + role.slice(1) + ' User',
        email: email || `${role}@redp.com`,
        role: role
      }));
      setLoading(false);
      navigate('/');
    }, 600);
  };

  const fillProfile = (selectedRole: string) => {
    setRole(selectedRole);
    setEmail(`${selectedRole}@redp.com`);
    setPassword('password');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 10% 20%, rgba(203, 222, 209, 0.45) 0%, rgba(246, 248, 244, 0.85) 60%, rgba(228, 237, 222, 0.4) 100%), #f2f6f1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '28px', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border-glass)' }}>
        
        {/* Title & Logo */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
            <Building2 style={{ color: '#ffffff', width: '28px', height: '28px' }} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 850, color: 'var(--text-main)' }}>Ether REDP</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real Estate Digital Platform Portal</p>
        </div>

        {/* Sandbox Quick Fills */}
        <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.6)' }}>
          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCheck style={{ width: '12px', height: '12px' }} />
            Quick-Fill Developer Profiles
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button type="button" onClick={() => fillProfile('admin')} className="btn-secondary" style={{ padding: '8px', fontSize: '0.7rem', justifyContent: 'center' }}>👑 Admin</button>
            <button type="button" onClick={() => fillProfile('sales_agent')} className="btn-secondary" style={{ padding: '8px', fontSize: '0.7rem', justifyContent: 'center' }}>🟠 Ragab (Sales)</button>
            <button type="button" onClick={() => fillProfile('finance_officer')} className="btn-secondary" style={{ padding: '8px', fontSize: '0.7rem', justifyContent: 'center' }}>🔵 Melwany (Finance)</button>
            <button type="button" onClick={() => fillProfile('delivery_engineer')} className="btn-secondary" style={{ padding: '8px', fontSize: '0.7rem', justifyContent: 'center' }}>🟢 Mahmoud (Delivery)</button>
          </div>
        </div>

        {/* Main form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', textAlign: 'center' }}>{error}</div>}

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
                placeholder="developer@redp.com" 
                required 
              />
            </div>
          </div>

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

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Login Role (Simulated)</label>
            <select 
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ cursor: 'pointer', fontSize: '0.85rem' }}
            >
              <option value="admin">👑 Platform Administrator</option>
              <option value="sales_agent">🟠 Ragab (Acquisition & KYC)</option>
              <option value="broker">🍊 External Broker Agency</option>
              <option value="finance_officer">🔵 Melwany (Finance & Locks)</option>
              <option value="client">🐳 Compound Client/Homeowner</option>
              <option value="delivery_engineer">🟢 Mahmoud (Inspection Snagger)</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '8px', fontSize: '0.9rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;
