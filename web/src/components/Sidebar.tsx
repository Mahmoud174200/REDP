import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Building2, Users, Wallet, FileText, Settings, ShieldCheck, 
  LogOut, Bell, BarChart3, Wrench, FileSearch, ShieldAlert, TrendingUp
} from 'lucide-react';

interface SidebarProps {
  userRole: string;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('redp_token');
    localStorage.removeItem('redp_user');
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Acquisition 🟠 Ragab',
      roles: ['admin', 'sales_agent', 'broker'],
      items: [
        { name: 'Leads & KYC', path: '/acquisition/leads', icon: Users },
        { name: 'CRM Kanban Pipeline', path: '/acquisition/crm', icon: BarChart3 },
        { name: 'Broker Portal', path: '/acquisition/brokers', icon: Building2 },
        { name: 'KYC Approvals', path: '/acquisition/kyc', icon: ShieldCheck },
        { name: 'Campaigns Analytics', path: '/acquisition/campaigns', icon: TrendingUp },
      ]
    },
    {
      title: 'Finance & Contracts 🔵 Melwany',
      roles: ['admin', 'finance_officer', 'client'],
      items: [
        { name: 'Units Inventory', path: '/finance/inventory', icon: Building2 },
        { name: 'Payment Scheduler', path: '/finance/payments', icon: Wallet },
        { name: 'Contracts Vault', path: '/finance/contracts', icon: FileText },
      ]
    },
    {
      title: 'Delivery & Platform 🟢 Mahmoud',
      roles: ['admin', 'delivery_engineer', 'client'],
      items: [
        { name: 'Homeowner Overview', path: '/delivery/overview', icon: Building2 },
        { name: 'Maintenance Tickets', path: '/delivery/maintenance', icon: Wrench },
        { name: 'Snagging Inspector', path: '/delivery/handover', icon: ShieldCheck },
      ]
    }
  ];

  return (
    <aside className="glass-panel" style={{ width: '300px', minHeight: '100vh', borderRadius: 0, borderTop: 'none', borderLeft: 'none', padding: '30px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', paddingBottom: '20px', borderBottom: '1px solid var(--border-glass)' }}>
          <Building2 style={{ color: 'var(--color-primary)', width: '32px', height: '32px' }} />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>REDP System</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>BASE SKELETON</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {menuItems.map((section, idx) => {
            const hasAccess = section.roles.includes(userRole) || userRole === 'admin';
            if (!hasAccess) return null;

            return (
              <div key={idx}>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '12px', paddingLeft: '8px' }}>
                  {section.title}
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <li key={item.path}>
                        <Link 
                          to={item.path} 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-sm)',
                            textDecoration: 'none',
                            color: isActive ? '#ffffff' : 'var(--text-muted)',
                            background: isActive ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(168,85,247,0.15))' : 'transparent',
                            border: isActive ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                            fontWeight: isActive ? 600 : 500,
                            fontSize: '0.9rem',
                            transition: 'var(--transition-smooth)'
                          }}
                          className={isActive ? '' : 'sidebar-link-hover'}
                        >
                          <Icon style={{ width: '18px', height: '18px', color: isActive ? 'var(--color-primary)' : 'inherit' }} />
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

      <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '0 8px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#ffffff' }}>
            {userRole.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active User</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>Role: {userRole}</span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
        >
          <LogOut style={{ width: '16px', height: '16px' }} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
