import React from 'react';
import { Bell, ShieldAlert, ShieldCheck } from 'lucide-react';

interface TopBarProps {
  userRole: string;
}

const TopBar: React.FC<TopBarProps> = ({ userRole }) => {
  return (
    <header className="glass-panel" style={{ height: '80px', borderRadius: 0, borderTop: 'none', borderRight: 'none', borderLeft: 'none', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Real Estate Digital Platform (REDP)</h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Initial Integration Sandbox</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <ShieldCheck style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>Secure Local Environment</span>
        </div>

        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <Bell style={{ width: '20px', height: '20px', color: 'var(--text-muted)' }} />
          <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: 'var(--color-danger)', borderRadius: '50%' }}></span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
