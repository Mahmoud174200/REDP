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

    // Sandbox Local Auth Session bypass (Artisan seeders match this)
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
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top right, rgba(168,85,247,0.15), transparent), var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Title & Logo */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
            <Building2 style={{ color: '#ffffff', width: '32px', height: '32px' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>REDP Portal</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real Estate Digital Platform Blueprint</p>
        </div>

        {/* Sandbox Quick Fills */}
        <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.15)' }}>
          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCheck style={{ width: '14px', height: '14px' }} />
            Quick-Fill Developer Profiles
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button type="button" onClick={() => fillProfile('admin')} className="btn-secondary" style={{ padding: '8px', fontSize: '0.75rem', justifyContent: 'center' }}>👑 Admin</button>
            <button type="button" onClick={() => fillProfile('sales_agent')} className="btn-secondary" style={{ padding: '8px', fontSize: '0.75rem', justifyContent: 'center' }}>🟠 Ragab (Sales)</button>
            <button type="button" onClick={() => fillProfile('finance_officer')} className="btn-secondary" style={{ padding: '8px', fontSize: '0.75rem', justifyContent: 'center' }}>🔵 Melwany (Finance)</button>
            <button type="button" onClick={() => fillProfile('delivery_engineer')} className="btn-secondary" style={{ padding: '8px', fontSize: '0.75rem', justifyContent: 'center' }}>🟢 Mahmoud (Delivery)</button>
          </div>
        </div>

        {/* Main form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '16px', top: '16px', width: '18px', height: '18px', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                className="form-control" 
                style={{ paddingLeft: '48px' }} 
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
              <KeyRound style={{ position: 'absolute', left: '16px', top: '16px', width: '18px', height: '18px', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                className="form-control" 
                style={{ paddingLeft: '48px' }} 
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
              style={{ cursor: 'pointer' }}
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
            style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '10px' }}
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
