import React from 'react';
import { Bell, Search, Settings, ShieldCheck, Menu } from 'lucide-react';

interface TopBarProps {
  userRole: string;
  onMenuToggle?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ userRole, onMenuToggle }) => {
  return (
    <header 
      className="glass-panel" 
      style={{ 
        height: '70px', 
        borderRadius: '9999px', /* Fully rounded capsule header */
        padding: '0 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        zIndex: 40,
        boxShadow: 'var(--shadow-premium)',
        border: '1.5px solid var(--border-glass)'
      }}
    >
      {/* Horizontal Left: Hamburger menu + Pill Search Box */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Hamburger Menu Toggle - Visible on mobile only */}
        <button 
          onClick={onMenuToggle}
          className="btn-secondary mobile-menu-btn"
          style={{ 
            padding: '10px', 
            borderRadius: '50%', 
            border: 'none', 
            background: '#ffffff',
            display: 'none', /* Custom media selector in CSS forces display */
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(44,62,50,0.04)'
          }}
        >
          <Menu style={{ width: '16px', height: '16px', color: 'var(--text-main)' }} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', width: '220px' }}>
          <Search style={{ position: 'absolute', left: '16px', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search Assets..." 
            style={{ 
              width: '100%', 
              padding: '10px 16px 10px 40px', 
              borderRadius: '9999px', 
              border: 'none', 
              background: '#ffffff', 
              fontSize: '0.8rem', 
              outline: 'none',
              color: 'var(--text-main)',
              boxShadow: 'inset 0 1px 2px rgba(44,62,50,0.03)'
            }}
          />
        </div>
      </div>

      {/* Horizontal Middle: Soft text toggles */}
      <div className="topbar-links" style={{ display: 'flex', gap: '30px', fontSize: '0.8rem', fontWeight: 800 }}>
        <span style={{ cursor: 'pointer', color: 'var(--text-main)', borderBottom: '2.5px solid var(--color-primary)', paddingBottom: '4px', letterSpacing: '0.05em' }}>
          OVERVIEW
        </span>
        <span style={{ cursor: 'pointer', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          ANALYTICS
        </span>
        <span style={{ cursor: 'pointer', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          REPORTS
        </span>
      </div>

      {/* Horizontal Right: Control Icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--border-glass)', borderRadius: '9999px' }}>
          <ShieldCheck style={{ width: '14px', height: '14px', color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-primary)' }}>Secure Sandbox</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-muted)' }}>
          <Bell style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
          <Settings style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
          
          {/* User circular avatar thumbnail */}
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 700, fontSize: '0.75rem', border: '2px solid #ffffff', boxShadow: '0 2px 6px rgba(44,62,50,0.1)' }}>
            {userRole.substring(0, 1).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
