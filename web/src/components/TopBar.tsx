import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Settings, ShieldCheck, Menu, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface TopBarProps {
  userRole: string;
  onMenuToggle?: () => void;
}

interface SearchItem {
  name: string;
  category: string;
  path: string;
}

const TopBar: React.FC<TopBarProps> = ({ userRole, onMenuToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(4);

  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine current active domain prefix
  let currentModule = 'delivery';
  if (path.startsWith('/finance')) {
    currentModule = 'finance';
  } else if (path.startsWith('/acquisition')) {
    currentModule = 'acquisition';
  }

  // Define tab navigation target URLs
  const tabs = {
    overview: currentModule === 'finance' ? '/finance/inventory' : currentModule === 'acquisition' ? '/acquisition/leads' : '/delivery/overview',
    analytics: currentModule === 'finance' ? '/finance/payments' : currentModule === 'acquisition' ? '/acquisition/campaigns' : '/delivery/analytics',
    reports: currentModule === 'finance' ? '/finance/collections' : currentModule === 'acquisition' ? '/acquisition/crm' : '/delivery/documents',
  };

  const isTabActive = (tabPath: string) => path === tabPath;

  // Search items database
  const searchItems: SearchItem[] = [
    { name: 'Patio Luxury Compound', category: 'Compound', path: '/finance/inventory' },
    { name: 'Uptown Residence Compound', category: 'Compound', path: '/finance/inventory' },
    { name: 'Unit 101-A', category: 'Unit Spec', path: '/finance/inventory' },
    { name: 'Unit 201-B', category: 'Unit Spec', path: '/finance/inventory' },
    { name: 'Unit 12-C', category: 'Unit Spec', path: '/finance/inventory' },
    { name: 'Mohamed Nabil', category: 'Lead Profile', path: '/acquisition/leads' },
    { name: 'Sherif Kamal', category: 'Lead Profile', path: '/acquisition/leads' },
    { name: 'Yasmine Fouad', category: 'Lead Profile', path: '/acquisition/leads' },
    { name: 'Karim Saeed', category: 'Lead Profile', path: '/acquisition/leads' },
    { name: 'Mahmoud_National_ID.pdf', category: 'KYC Scan Document', path: '/delivery/documents' },
    { name: 'Reservation_Agreement_Unit_A101.pdf', category: 'Legal Agreement Document', path: '/delivery/documents' },
    { name: 'Floor_Overlay_Layout_V501.pdf', category: 'Asset Overlay Map', path: '/delivery/documents' },
    { name: 'Maintenance Tickets Queue', category: 'SLA Tickets', path: '/delivery/maintenance' },
    { name: 'QC Handover Inspector Tool', category: 'Inspections', path: '/delivery/handover' },
    { name: 'Visual Workflow Builder Engine', category: 'Automations', path: '/delivery/workflows' }
  ];

  const filteredSearchItems = searchItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const notifications = [
    { id: 1, text: 'New lead registered: Mohamed Nabil (KYC Verified)', time: '2 mins ago' },
    { id: 2, text: 'Payment processed: EOI deposit for Patio Compound', time: '10 mins ago' },
    { id: 3, text: 'Maintenance ticket #t1 dispatched to Arab Contractors', time: '1 hour ago' },
    { id: 4, text: 'Snag logged: Living room outlet defect in Unit 101-A', time: '3 hours ago' }
  ];

  // Retrieve user data
  const userStr = localStorage.getItem('redp_user');
  const user = userStr ? JSON.parse(userStr) : {
    name: 'REDP Operator',
    email: `${userRole}@redp.com`,
    role: userRole || 'admin'
  };

  const handleLogout = () => {
    localStorage.removeItem('redp_token');
    localStorage.removeItem('redp_user');
    navigate('/login');
  };

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
        border: '1.5px solid var(--border-glass)',
        position: 'relative'
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

        <div ref={searchRef} style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', width: '220px' }}>
          <Search style={{ position: 'absolute', left: '16px', width: '14px', height: '14px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search Assets..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
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

          {/* Search results dropdown */}
          {showSearchDropdown && searchQuery && (
            <div 
              className="glass-panel"
              style={{
                position: 'absolute',
                top: '45px',
                left: '0',
                width: '320px',
                maxHeight: '300px',
                overflowY: 'auto',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-glass)',
                boxShadow: 'var(--shadow-premium)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                zIndex: 100
              }}
            >
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', paddingLeft: '8px' }}>
                Search Results ({filteredSearchItems.length})
              </div>
              {filteredSearchItems.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  No matches found
                </div>
              ) : (
                filteredSearchItems.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchDropdown(false);
                      navigate(item.path);
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      transition: 'background 0.2s',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</span>
                    <span style={{ fontSize: '0.65rem', background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: '9999px', fontWeight: 700 }}>
                      {item.category}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Middle: Soft text toggles */}
      <div className="topbar-links" style={{ display: 'flex', gap: '30px', fontSize: '0.8rem', fontWeight: 800 }}>
        <Link 
          to={tabs.overview}
          style={{ 
            cursor: 'pointer', 
            textDecoration: 'none',
            color: isTabActive(tabs.overview) ? 'var(--text-main)' : 'var(--text-muted)', 
            borderBottom: isTabActive(tabs.overview) ? '2.5px solid var(--color-primary)' : '2.5px solid transparent', 
            paddingBottom: '4px', 
            letterSpacing: '0.05em',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          OVERVIEW
        </Link>
        <Link 
          to={tabs.analytics}
          style={{ 
            cursor: 'pointer', 
            textDecoration: 'none',
            color: isTabActive(tabs.analytics) ? 'var(--text-main)' : 'var(--text-muted)', 
            borderBottom: isTabActive(tabs.analytics) ? '2.5px solid var(--color-primary)' : '2.5px solid transparent', 
            paddingBottom: '4px', 
            letterSpacing: '0.05em',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          ANALYTICS
        </Link>
        <Link 
          to={tabs.reports}
          style={{ 
            cursor: 'pointer', 
            textDecoration: 'none',
            color: isTabActive(tabs.reports) ? 'var(--text-main)' : 'var(--text-muted)', 
            borderBottom: isTabActive(tabs.reports) ? '2.5px solid var(--color-primary)' : '2.5px solid transparent', 
            paddingBottom: '4px', 
            letterSpacing: '0.05em',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          REPORTS
        </Link>
      </div>

      {/* Horizontal Right: Control Icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--border-glass)', borderRadius: '9999px' }}>
          <ShieldCheck style={{ width: '14px', height: '14px', color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-primary)' }}>Secure Sandbox</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-muted)' }}>
          {/* Bell Icon & Dropdown */}
          <div ref={notificationsRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Bell 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', color: showNotifications ? 'var(--color-primary)' : 'var(--text-muted)' }} 
            />
            {unreadNotifications > 0 && (
              <span 
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '8px',
                  height: '8px',
                  background: 'var(--color-danger)',
                  borderRadius: '50%'
                }}
              />
            )}

            {showNotifications && (
              <div 
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: '35px',
                  right: '-80px',
                  width: '320px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-glass)',
                  boxShadow: 'var(--shadow-premium)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  zIndex: 100
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Notifications</span>
                  <button 
                    onClick={() => setUnreadNotifications(0)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Mark all as read
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                  {notifications.map((n) => (
                    <div key={n.id} style={{ display: 'flex', gap: '10px', paddingBottom: '8px', borderBottom: n.id !== 4 ? '1px solid rgba(0,0,0,0.03)' : 'none' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', marginTop: '6px', flexShrink: 0, opacity: unreadNotifications >= n.id ? 1 : 0 }}></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', lineHeight: '1.3' }}>{n.text}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings Icon & Dropdown */}
          <div ref={settingsRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Settings 
              onClick={() => setShowSettings(!showSettings)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', color: showSettings ? 'var(--color-primary)' : 'var(--text-muted)' }} 
            />

            {showSettings && (
              <div 
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: '35px',
                  right: '-48px',
                  width: '240px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-glass)',
                  boxShadow: 'var(--shadow-premium)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  zIndex: 100
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px', textAlign: 'left' }}>
                  System Settings
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-main)' }}>Sandbox Mode</span>
                    <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>Active</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-main)' }}>Mock API Server</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Disabled (DB Live)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-main)' }}>Vite HMR</span>
                    <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>Enabled</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* User Circular Avatar Thumbnail & Dropdown */}
          <div ref={profileRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#ffffff', 
                fontWeight: 700, 
                fontSize: '0.75rem', 
                border: '2px solid #ffffff', 
                boxShadow: '0 2px 6px rgba(44,62,50,0.1)',
                cursor: 'pointer'
              }}
            >
              {user.name.substring(0, 1).toUpperCase()}
            </div>

            {showProfileMenu && (
              <div 
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: '35px',
                  right: '0',
                  width: '240px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-glass)',
                  boxShadow: 'var(--shadow-premium)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  zIndex: 100
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{user.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.email}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'capitalize', marginTop: '4px' }}>Role: {user.role}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-danger)',
                    background: 'rgba(239, 68, 68, 0.05)',
                    color: 'var(--color-danger)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                >
                  <LogOut style={{ width: '14px', height: '14px' }} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
