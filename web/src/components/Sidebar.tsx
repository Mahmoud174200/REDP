import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Building2, Users, Wallet, FileText, Settings, ShieldCheck,
  LogOut, Bell, BarChart3, Wrench, FileSearch, ShieldAlert, TrendingUp, X, Terminal,
  AlertTriangle, CreditCard, Phone, Handshake, Network, Shield, GitBranch, CheckSquare, MessageSquare, FolderTree, Award, Brain, Globe, Hammer
} from 'lucide-react';
import { menuItems } from '../config/sidebarMenu';

interface SidebarProps {
  userRole: string;
  menuOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole, menuOpen = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Broker sub-role (owner/leader/agent) — inferred from the linked org position,
  // used to reveal owner-only navigation (e.g. Company Management).
  const brokerIsOwner = React.useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem('redp_user') || '{}');
      const code = u?.employeeHierarchy?.position?.code || u?.position?.code || '';
      const title = u?.employeeHierarchy?.position?.title || u?.position?.title || '';
      return code === 'POS-DH' || /Owner|Head|CEO/i.test(title);
    } catch { return false; }
  }, []);

  const [systemName, setSystemName] = React.useState(localStorage.getItem('system_name') || 'Ether REDP');
  const [systemLogoUrl, setSystemLogoUrl] = React.useState(localStorage.getItem('system_logo_url') || '');
  const [systemIconName, setSystemIconName] = React.useState(localStorage.getItem('system_icon_name') || 'Building2');
  const [systemIconUrl, setSystemIconUrl] = React.useState(localStorage.getItem('system_icon_url') || '');

  // Admin-managed sidebar visibility (paths hidden or deleted from the menu).
  const readCachedPaths = (key: string): string[] => {
    try { const v = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
  };
  const [hiddenPaths, setHiddenPaths] = React.useState<string[]>(() => readCachedPaths('sidebar_hidden'));
  const [deletedPaths, setDeletedPaths] = React.useState<string[]>(() => readCachedPaths('sidebar_deleted'));

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

          // Admin-managed sidebar visibility
          const hidden = Array.isArray(res.data.data.sidebar_hidden) ? res.data.data.sidebar_hidden : [];
          const deleted = Array.isArray(res.data.data.sidebar_deleted) ? res.data.data.sidebar_deleted : [];
          setHiddenPaths(hidden);
          setDeletedPaths(deleted);
          localStorage.setItem('sidebar_hidden', JSON.stringify(hidden));
          localStorage.setItem('sidebar_deleted', JSON.stringify(deleted));
        }
      } catch (err) {
        console.error('Failed to fetch system info:', err);
      }
    };
    fetchSystemInfo();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('redp_token');
    localStorage.removeItem('redp_user');
    onClose?.();
    navigate('/login');
  };

  // Sidebar menu is defined in ../config/sidebarMenu (shared with the admin
  // "Menu Settings" page). Hidden/deleted paths come from system settings.
  const hiddenSet = new Set(hiddenPaths);
  const deletedSet = new Set(deletedPaths);

  return (
    <aside
      className={`glass-panel ${menuOpen ? 'menu-open' : ''}`}
      style={{
        width: '280px',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 16px', /* Balanced padding */
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'sticky',
        top: '16px',
        height: 'calc(100vh - 32px)',
        zIndex: 100,
        boxSizing: 'border-box', /* Force border-box calculation */
        overflow: 'hidden' /* Keep child scrolls contained */
      }}
    >
      {/* 📜 Scrollable Flex Container containing Logo & Navigation List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          flex: 1,
          marginBottom: '12px',
          paddingRight: '4px'
        }}
        className="sidebar-scroll-container"
      >
        {/* Editorial Title Logo (Ether UI layout) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '0 8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {systemLogoUrl ? (
              <img src={systemLogoUrl} alt="System Logo" style={{ width: '38px', height: '38px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} />
            ) : systemIconUrl ? (
              <img src={systemIconUrl} alt="System Icon" style={{ width: '38px', height: '38px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} />
            ) : (
              <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
                {(() => {
                  const Icon = (() => {
                    switch (systemIconName) {
                      case 'Building2': return Building2;
                      case 'Users': return Users;
                      case 'Wallet': return Wallet;
                      case 'Settings': return Settings;
                      case 'ShieldCheck': return ShieldCheck;
                      case 'Wrench': return Wrench;
                      case 'ShieldAlert': return ShieldAlert;
                      case 'Terminal': return Terminal;
                      case 'AlertTriangle': return AlertTriangle;
                      case 'CreditCard': return CreditCard;
                      default: return Building2;
                    }
                  })();
                  return <Icon style={{ color: '#ffffff', width: '20px', height: '20px' }} />;
                })()}
              </div>
            )}
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.2' }}>{systemName}</h2>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em' }}>EDITORIAL SOFT-FORM</span>
            </div>
          </div>

          {/* Mobile Close Button drawer */}
          <button
            onClick={onClose}
            className="mobile-menu-close"
            style={{
              display: 'none',
              padding: '6px',
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer'
            }}
          >
            <X style={{ width: '14px', height: '14px', color: 'var(--text-main)' }} />
          </button>
        </div>

        {/* Floating Links Queue */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {menuItems.map((section, idx) => {
            const hasAccess = section.roles.includes(userRole) || userRole === 'admin';
            if (!hasAccess) return null;

            // Resolve the items this user can actually see (role + owner + admin-managed visibility)
            const visibleItems = section.items.filter((item) => {
              const hasItemAccess = !(item as any).roles || (item as any).roles.includes(userRole) || userRole === 'admin';
              if (!hasItemAccess) return false;
              if ((item as any).brokerOwnerOnly && userRole !== 'admin' && !brokerIsOwner) return false;
              if (!(item as any).locked && (hiddenSet.has(item.path) || deletedSet.has(item.path))) return false;
              return true;
            });

            // Skip the whole section (and its header) when nothing is visible
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx}>
                <h3 style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.12em', marginBottom: '6px', paddingLeft: '10px' }}>
                  {section.title}
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {visibleItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={() => onClose?.()}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 16px',
                            borderRadius: '9999px', /* Pill buttons shapes */
                            textDecoration: 'none',
                            color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                            background: isActive ? '#ffffff' : 'transparent',
                            boxShadow: isActive ? '0 4px 12px rgba(44, 62, 50, 0.04)' : 'none',
                            fontWeight: isActive ? 700 : 500,
                            fontSize: '0.8rem',
                            transition: 'var(--transition-smooth)',
                            border: isActive ? '1px solid rgba(255,255,255,0.8)' : '1px solid transparent'
                          }}
                        >
                          {typeof Icon === 'string' ? (
                            <i
                              className={Icon}
                              style={{
                                width: '15px',
                                height: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.82rem',
                                color: isActive ? 'var(--color-primary)' : 'var(--text-muted)'
                              }}
                            />
                          ) : (
                            React.createElement(Icon, {
                              style: { width: '15px', height: '15px', color: isActive ? 'var(--color-primary)' : 'var(--text-muted)' }
                            })
                          )}
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>

      {/* 🔒 Fixed Bottom Footer Container */}
      <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', paddingLeft: '4px', paddingRight: '4px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#ffffff', fontSize: '0.8rem' }}>
            {userRole.substring(0, 1).toUpperCase()}
          </div>
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: '1.2' }}>REDP Operator</h4>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{userRole}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: '0.75rem' }}
        >
          <LogOut style={{ width: '12px', height: '12px' }} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
