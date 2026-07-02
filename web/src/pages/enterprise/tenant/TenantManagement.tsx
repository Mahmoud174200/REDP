import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  Shield, Layers, Users, CreditCard, Layout, Palette, CheckCircle2, RefreshCw, Save, CheckSquare
} from 'lucide-react';

interface QuotaData {
  plan: string;
  status: string;
  ends_at: string | null;
  users: { used: number; limit: number };
  leads: { used: number; limit: number };
  features: string[];
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.6)',
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', outline: 'none',
  boxSizing: 'border-box',
};

const TenantManagement: React.FC = () => {
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);

  // Branding config state
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#ec4899');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    loadQuota();
    // Load local storage branding if available to pre-fill
    setPrimaryColor(localStorage.getItem('theme_primary') || '#6366f1');
    setSecondaryColor(localStorage.getItem('theme_secondary') || '#ec4899');
  }, []);

  const loadQuota = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/enterprise/tenants/quotas');
      if (res.data?.success) {
        setQuota(res.data.data);
      }
    } catch (err) {
      console.error('Error loading tenant quotas:', err);
    }
    setLoading(false);
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranding(true);
    try {
      const res = await api.put('/v1/enterprise/tenants/branding', {
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        logo_url: logoUrl
      });
      if (res.data?.success) {
        alert('Branding colors updated successfully! Changes will take effect on next reload.');
        // Update local variables
        localStorage.setItem('theme_primary', primaryColor);
        localStorage.setItem('theme_secondary', secondaryColor);
        
        // Dynamically apply root variables in browser for real-time preview
        document.documentElement.style.setProperty('--color-primary', primaryColor);
        document.documentElement.style.setProperty('--color-secondary', secondaryColor);
      }
    } catch (err) {
      console.error('Error saving branding:', err);
      alert('Error saving organization settings.');
    }
    setSavingBranding(false);
  };

  const renderProgressBar = (used: number, limit: number) => {
    const percent = Math.min(100, (used / limit) * 100);
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
          <span style={{ color: 'var(--text-main)' }}>{used} / {limit} Used</span>
          <span style={{ color: 'var(--text-muted)' }}>{percent.toFixed(0)}%</span>
        </div>
        <div style={{ height: 8, width: '100%', background: 'rgba(0,0,0,0.03)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${percent}%`, background: percent >= 90 ? '#ef4444' : 'var(--color-primary)', borderRadius: 99 }} />
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={26} color="var(--color-primary)" />
            🏢 SaaS Organization Workspace
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Monitor subscription tier limits, audit organization usage quotas, and customize tenant hex theme branding.
          </p>
        </div>
        <button className="btn-secondary" onClick={loadQuota} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
          <RefreshCw size={12} style={{ marginRight: 4 }} /> Reload limits
        </button>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>Loading organization settings...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
          {/* LEFT PANEL: Quotas & Subscription Details */}
          <div>
            <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)' }}>Active Tenant Quota Limits</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Usage metrics are checked in real-time against subscription tiers.</p>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', textTransform: 'uppercase' }}>
                  Plan: {quota?.plan || 'trial'} ({quota?.status || 'active'})
                </span>
              </div>

              {quota && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={14} color="var(--color-primary)" /> Active Users Limit
                    </h4>
                    {renderProgressBar(quota.users.used, quota.users.limit)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Layers size={14} color="var(--color-primary)" /> CRM Leads Volume
                    </h4>
                    {renderProgressBar(quota.leads.used, quota.leads.limit)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
                      Enabled Module Features
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {quota.features.map(f => (
                        <span key={f} style={{ fontSize: '0.72rem', background: 'rgba(99,102,241,0.08)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: 99, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={10} /> {f.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Plans comparison cards */}
            <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 16 }}>Available Organization Plans</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: 16, background: 'rgba(255,255,255,0.2)' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>Standard Tier</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>FOR GROWING TEAMS</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, margin: '10px 0', color: 'var(--text-main)' }}>$199 / mo</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <li>✓ Max 25 Users</li>
                    <li>✓ Max 5,000 CRM Leads</li>
                    <li>✓ All Core CRM Modules</li>
                    <li>✓ Standard Ledger Accounting</li>
                  </ul>
                </div>

                <div style={{ border: '2px solid var(--color-primary)', borderRadius: 'var(--radius-md)', padding: 16, background: 'rgba(99,102,241,0.03)', position: 'relative' }}>
                  <span style={{ position: 'absolute', right: 8, top: 8, fontSize: '0.58rem', fontWeight: 800, background: 'var(--color-primary)', color: '#fff', padding: '2px 6px', borderRadius: 99 }}>POPULAR</span>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>Enterprise Tier</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>FOR MULTI-COMPANY DEVELOPERS</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, margin: '10px 0', color: 'var(--text-main)' }}>$499 / mo</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <li>✓ Unlimited Users</li>
                    <li>✓ Unlimited Leads Volume</li>
                    <li>✓ Full double-entry accounting</li>
                    <li>✓ AI Lead Scoring & Projections</li>
                    <li>✓ 3-Way Match Procurement</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Branding settings */}
          <div className="glass-panel" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Palette size={16} color="var(--color-primary)" /> Customize Theme & Logo
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 20 }}>Modify organization identity and branding assets globally.</p>

            <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>PRIMARY THEME COLOR</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="color"
                    style={{ width: 44, height: 38, border: '1px solid var(--border-glass)', padding: 0, borderRadius: 'var(--radius-sm)', background: 'transparent', cursor: 'pointer' }}
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                  />
                  <input
                    style={inputStyle}
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>SECONDARY THEME COLOR</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="color"
                    style={{ width: 44, height: 38, border: '1px solid var(--border-glass)', padding: 0, borderRadius: 'var(--radius-sm)', background: 'transparent', cursor: 'pointer' }}
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                  />
                  <input
                    style={inputStyle}
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>BRANDING LOGO URL</label>
                <input
                  style={inputStyle}
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                />
              </div>

              {/* Branding preview box */}
              <div style={{ border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: 16, background: 'rgba(255,255,255,0.4)', marginTop: 10 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Live preview</span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                  <div>
                    <h5 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>Tenant System Logo preview</h5>
                    <span style={{ fontSize: '0.65rem', color: primaryColor, fontWeight: 700 }}>Customized active colors</span>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }} disabled={savingBranding}>
                <Save size={14} /> {savingBranding ? 'Saving settings...' : 'Apply Branding changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;
