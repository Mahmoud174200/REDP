import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Building2, Users, Wallet, FileText, Settings, ShieldCheck, 
  LogOut, Bell, BarChart3, Wrench, X, Terminal, FileSearch, ShieldAlert, AlertTriangle, CreditCard
} from 'lucide-react';

interface SidebarProps {
  userRole: string;
  menuOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole, menuOpen = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('redp_token');
    localStorage.removeItem('redp_user');
    onClose?.();
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Acquisition 🟠 Ragab',
      roles: ['admin', 'sales_agent', 'broker'],
      items: [
        { name: 'Leads & KYC', path: '/acquisition/leads', icon: Users },
        { name: 'CRM Pipeline', path: '/acquisition/crm', icon: BarChart3 },
        { name: 'Broker Portal', path: '/acquisition/brokers', icon: Building2 },
      ]
    },
    {
      title: 'Finance & Contracts 🔵 Melwany',
      roles: ['admin', 'finance_officer', 'client'],
      items: [
        { name: 'Units Inventory', path: '/finance/inventory', icon: Building2 },
        { name: 'Payment Dashboard', path: '/finance/payments', icon: CreditCard },
        { name: 'Contracts Vault', path: '/finance/contracts', icon: FileText },
        { name: 'Collections Queue', path: '/finance/collections', icon: AlertTriangle },
      ]
    },
    {
      title: 'Delivery & Platform 🟢 Mahmoud',
      roles: ['admin', 'delivery_engineer', 'client'],
      items: [
        { name: 'Homeowner Overview', path: '/delivery/overview', icon: Building2 },
        { name: 'Maintenance Tickets', path: '/delivery/maintenance', icon: Wrench },
        { name: 'Snagging Inspector', path: '/delivery/handover', icon: ShieldCheck },
        { name: 'Documents Vault', path: '/delivery/documents', icon: FileText },
        { name: 'BI Analytics', path: '/delivery/analytics', icon: BarChart3 },
        { name: 'Visual Workflows', path: '/delivery/workflows', icon: Terminal },
      ]
    }
  ];

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
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
              <Building2 style={{ color: '#ffffff', width: '20px', height: '20px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.2' }}>Ether REDP</h2>
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

            return (
              <div key={idx}>
                <h3 style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.12em', marginBottom: '6px', paddingLeft: '10px' }}>
                  {section.title}
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {section.items.map((item) => {
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
                          <Icon style={{ width: '15px', height: '15px', color: isActive ? 'var(--color-primary)' : 'var(--text-muted)' }} />
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
