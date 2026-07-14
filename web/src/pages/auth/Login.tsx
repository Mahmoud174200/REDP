import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, KeyRound, Mail, User, Phone, Sparkles, Shield, ArrowRight, Compass,
  Crown, Briefcase, Users, UserRound, Headset, PhoneCall, Headphones, Store, Handshake, Laptop,
  Wallet, HardHat, Truck, Wrench, Scale, House
} from 'lucide-react';
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
    let emailVal = `${selectedRole}@redp.com`;
    let roleValue = selectedRole === 'handover' ? 'handover_officer' : selectedRole;

    // Custom hierarchy mappings
    if (selectedRole === 'tele_sales_manager') {
      emailVal = 'tele_sales_manager@redp.com';
      roleValue = 'tele_sales';
    } else if (selectedRole === 'tele_sales_head') {
      emailVal = 'tele_sales_head@redp.com';
      roleValue = 'tele_sales';
    } else if (selectedRole === 'broker_team_leader') {
      emailVal = 'broker_team_leader@redp.com';
      roleValue = 'broker';
    } else if (selectedRole === 'broker_owner') {
      emailVal = 'broker_owner@redp.com';
      roleValue = 'broker';
    } else if (selectedRole === 'freelance_broker') {
      emailVal = 'freelance_broker@redp.com';
      roleValue = 'broker';
    } else if (selectedRole === 'company_sales_agent') {
      emailVal = 'company_sales_agent@redp.com';
      roleValue = 'company_sales';
    } else if (selectedRole === 'company_sales_leader') {
      emailVal = 'company_sales_leader@redp.com';
      roleValue = 'company_sales';
    }

    setRole(roleValue);
    setEmail(emailVal);
    setPassword('password');
    setConfirmPassword('password');
  };

  // Sandbox quick-fill profiles, grouped by department with color-coded accents & vector icons.
  const quickFillGroups = [
    {
      label: 'Admin & Executive',
      accent: '#b45309',
      soft: 'rgba(180, 83, 9, 0.12)',
      items: [
        { key: 'admin', label: 'Admin', Icon: Crown },
        { key: 'executive', label: 'Executive', Icon: Briefcase },
      ],
    },
    {
      label: 'Commercial Sales',
      accent: '#003DA6',
      soft: 'rgba(0, 61, 166, 0.12)',
      items: [
        { key: 'company_sales', label: 'Co-Sales Head', Icon: Building2 },
        { key: 'company_sales_leader', label: 'Sales Leader', Icon: Users },
        { key: 'company_sales_agent', label: 'Sales Agent', Icon: UserRound },
        { key: 'sales_agent', label: 'Direct Agent', Icon: Headset },
        { key: 'tele_sales', label: 'Tele-Sales Agent', Icon: Phone },
        { key: 'tele_sales_manager', label: 'Tele-Sales Mgr', Icon: PhoneCall },
        { key: 'tele_sales_head', label: 'Tele-Sales Head', Icon: Headphones },
      ],
    },
    {
      label: 'External Brokers',
      accent: '#ea580c',
      soft: 'rgba(234, 88, 12, 0.12)',
      items: [
        { key: 'broker_owner', label: 'Broker Owner', Icon: Store },
        { key: 'broker_team_leader', label: 'Team Leader', Icon: Users },
        { key: 'broker', label: 'Broker Agent', Icon: Handshake },
        { key: 'freelance_broker', label: 'Freelancer', Icon: Laptop },
      ],
    },
    {
      label: 'Finance, Ops & Support',
      accent: '#0f766e',
      soft: 'rgba(15, 118, 110, 0.12)',
      items: [
        { key: 'finance_officer', label: 'Accounts', Icon: Wallet },
        { key: 'project_manager', label: 'Project Mgr', Icon: HardHat },
        { key: 'delivery_engineer', label: 'Delivery', Icon: Truck },
        { key: 'handover', label: 'Handover', Icon: KeyRound },
        { key: 'maintenance_manager', label: 'Facilities', Icon: Wrench },
        { key: 'legal_officer', label: 'Legal', Icon: Scale },
      ],
    },
    {
      label: 'Client Portal',
      accent: '#0891b2',
      soft: 'rgba(8, 145, 178, 0.12)',
      items: [
        { key: 'client', label: 'Homeowner', Icon: House },
      ],
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f8fafc', // Clean light background
      fontFamily: 'var(--font-body)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Google Fonts link for Cinzel (Serif) */}
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* CSS Injected Styles for Layout and Advanced Micro-interactions */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .luxury-overlay {
          background: linear-gradient(135deg, rgba(0, 15, 61, 0.65) 0%, rgba(0, 15, 61, 0.4) 60%, rgba(0, 15, 61, 0.7) 100%);
        }
        .split-right-panel::-webkit-scrollbar {
          display: none !important;
        }
        .split-right-panel {
          -ms-overflow-style: none !important;  /* IE and Edge */
          scrollbar-width: none !important;  /* Firefox */
        }
        /* ===== Quick-Fill Sandbox Profiles ===== */
        .qf-panel {
          padding: 16px;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(0,61,166,0.025) 0%, rgba(0,61,166,0.004) 100%);
          border: 1px solid rgba(0, 61, 166, 0.08);
          box-shadow: inset 0 1px 2px rgba(255,255,255,0.7);
          max-height: 250px;
          overflow-y: auto;
        }
        .qf-panel::-webkit-scrollbar { width: 5px; }
        .qf-panel::-webkit-scrollbar-track { background: transparent; }
        .qf-panel::-webkit-scrollbar-thumb { background: rgba(0,61,166,0.14); border-radius: 10px; }
        .qf-title {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.66rem;
          text-transform: uppercase;
          color: #003DA6;
          font-weight: 800;
          letter-spacing: 0.09em;
          font-family: var(--font-title);
          margin-bottom: 14px;
        }
        .qf-cat {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.56rem;
          font-weight: 800;
          letter-spacing: 0.11em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 7px;
        }
        .qf-cat::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent, #003DA6);
          box-shadow: 0 0 0 3px var(--accentSoft, rgba(0,61,166,0.12));
        }
        .qf-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 13px 5px 5px;
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 13px;
          cursor: pointer;
          font-size: 0.72rem;
          font-weight: 600;
          color: #334155;
          font-family: var(--font-body);
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .qf-chip .qf-ico {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 9px;
          background: var(--accentSoft);
          color: var(--accent);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .qf-chip:hover {
          border-color: var(--accent);
          color: var(--accent);
          transform: translateY(-2px);
          box-shadow: 0 8px 18px var(--accentSoft);
        }
        .qf-chip:hover .qf-ico {
          background: var(--accent);
          color: #ffffff;
          transform: scale(1.06);
        }
        .qf-chip:active { transform: translateY(0); }
        .luxury-input-group {
          position: relative;
          transition: all 0.3s ease;
        }
        .luxury-input {
          width: 100%;
          padding: 11px 16px 11px 40px;
          background: #ffffff;
          border: 1px solid rgba(0, 61, 166, 0.15);
          border-radius: 12px;
          color: #0f172a;
          font-size: 0.85rem;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .luxury-input::placeholder {
          color: #94a3b8;
        }
        .luxury-input:focus {
          outline: none;
          background: #ffffff;
          border-color: #003DA6; /* Mountain View Royal Blue */
          box-shadow: 0 0 12px rgba(0, 61, 166, 0.15);
        }
        .luxury-select {
          width: 100%;
          padding: 11px 16px;
          background: #ffffff;
          border: 1px solid rgba(0, 61, 166, 0.15);
          border-radius: 12px;
          color: #0f172a;
          font-size: 0.85rem;
          cursor: pointer;
          appearance: none;
          transition: all 0.3s ease;
        }
        .luxury-select:focus {
          outline: none;
          border-color: #003DA6;
          box-shadow: 0 0 12px rgba(0, 61, 166, 0.15);
        }
        .luxury-select option {
          background: #ffffff;
          color: #0f172a;
          padding: 10px;
        }
        .submit-btn-glow {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #003DA6 0%, #00205b 100%); /* Signature Mountain View Royal Blue */
          border: 1px solid rgba(0, 61, 166, 0.15);
          box-shadow: 0 4px 14px rgba(0, 61, 166, 0.2);
          color: #ffffff;
          border-radius: 12px;
          padding: 12px;
          font-weight: 700;
          font-family: var(--font-title);
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .submit-btn-glow:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #004cce 0%, #002d7a 100%);
          box-shadow: 0 6px 20px rgba(0, 61, 166, 0.3);
        }
        .submit-btn-glow:active {
          transform: translateY(0);
        }
        .submit-btn-glow::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -60%;
          width: 30%;
          height: 200%;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.15), transparent);
          transform: rotate(30deg);
          transition: all 0.8s ease;
        }
        .submit-btn-glow:hover::after {
          left: 140%;
        }
        .tab-btn {
          flex: 1;
          padding: 10px 16px;
          font-size: 0.82rem;
          font-weight: 700;
          font-family: var(--font-title);
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .tab-btn-active {
          background: #ffffff;
          color: #003DA6;
          box-shadow: 0 4px 10px rgba(0, 61, 166, 0.06);
          border: 1px solid rgba(0, 61, 166, 0.03);
        }
        .tab-btn-inactive {
          background: transparent;
          color: #64748b;
        }
        .tab-btn-inactive:hover {
          color: #003DA6;
        }
        .back-to-landing-link {
          position: relative;
          color: #64748b;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          background: none;
          border: none;
          padding: 4px 0;
          transition: color 0.25s ease;
        }
        .back-to-landing-link:hover {
          color: #003DA6;
        }
        .back-to-landing-link:hover .arrow {
          transform: translateX(-3px);
        }
        .back-to-landing-link::after {
          content: '';
          position: absolute;
          width: 100%;
          transform: scaleX(0);
          height: 1.5px;
          bottom: 0;
          left: 0;
          background-color: #003DA6;
          transform-origin: bottom right;
          transition: transform 0.25s ease-out;
        }
        .back-to-landing-link:hover::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }
        @media (max-width: 1024px) {
          .split-left-panel {
            display: none !important;
          }
          .split-right-panel {
            width: 100% !important;
            max-width: 100% !important;
          }
          .mobile-bg-overlay {
            display: block !important;
          }
        }
      `}} />

      {/* Background image for mobile (underneath form container) */}
      <div
        className="mobile-bg-overlay"
        style={{
          display: 'none',
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 1,
          overflow: 'hidden'
        }}
      >
        <video
          src="/mountain_view_video.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>
      <div
        className="mobile-bg-overlay"
        style={{
          display: 'none',
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.9) 50%, rgba(248, 250, 252, 0.98) 100%)',
          zIndex: 2
        }}
      />

      {/* LEFT PANEL: Breathtaking Mountain View Image Showcase */}
      <div
        className="split-left-panel"
        style={{
          flex: '1.2',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '50px',
          overflow: 'hidden',
          zIndex: 3
        }}
      >
        {/* Background Video Container */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          overflow: 'hidden',
          zIndex: 1
        }}>
          <video
            src="/mountain_view_video.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>

        {/* Breathtaking Dark Blue Mountain View Overlay */}
        <div
          className="luxury-overlay"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 2
          }}
        />

        {/* Ambient top light */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '20%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)',
          zIndex: 3,
          pointerEvents: 'none'
        }} />

        {/* Top Logo / Official Mountain View Logo Image downloaded from their site */}
        <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', zIndex: 4 }}>
          <img
            src="/mountain_view_logo.png"
            alt="Mountain View Logo"
            style={{ height: '36px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
        </div>

        {/* Center Tagline / Luxury statement */}
        <div className="animate-fade-in" style={{ zIndex: 4, maxWidth: '580px', marginTop: '80px', marginBottom: 'auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '6px 14px', borderRadius: '20px', marginBottom: '24px' }}>
            <Sparkles style={{ width: '12px', height: '12px', color: '#ffffff' }} />
            <span style={{ fontSize: '0.7rem', color: '#ffffff', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Introducing Mountain View Peak Collection</span>
          </div>
          <h1 style={{
            fontSize: '3.2rem',
            fontWeight: 800,
            lineHeight: 1.15,
            color: '#ffffff',
            letterSpacing: '-0.04em',
            fontFamily: 'var(--font-title)',
            textShadow: '0 4px 24px rgba(0,0,0,0.3)'
          }}>
            Elegance <span style={{ color: '#3b82f6', fontStyle: 'italic', fontWeight: 400 }}>Defined</span> by Majestic Views.
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '16px', lineHeight: '1.6', fontWeight: 400 }}>
            Step inside our digital ecosystem. Manage high-end acquisition pipelines, client reservation logs, and premium collections through our custom designed, glassmorphic real estate operators portal.
          </p>
        </div>

        {/* Bottom Metadata & Badges */}
        <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', zIndex: 4 }}>
          <div style={{ display: 'flex', gap: '28px' }}>
            <div>
              <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Ecosystem Security</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <Shield style={{ width: '12px', height: '12px', color: '#ffffff' }} />
                <span style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>End-to-End SSL Encrypted</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Operations Level</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <Compass style={{ width: '12px', height: '12px', color: '#ffffff' }} />
                <span style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>Global Enterprise Scale</span>
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>v3.4.2-Ethereal</span>
        </div>
      </div>

      {/* RIGHT PANEL: Elegant, Ultra-Premium Login Form (Light Mode - Scrollbar Hidden) */}
      <div
        className="split-right-panel"
        style={{
          width: '540px',
          background: '#ffffff', // Clean light mode white background
          borderLeft: '1px solid rgba(0, 61, 166, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px 40px',
          zIndex: 4,
          position: 'relative',
          overflowY: 'auto'
        }}
      >
        {/* Subtle blur decoration in the form card background */}
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(0, 61, 166, 0.03) 0%, transparent 70%)',
          zIndex: -1,
          pointerEvents: 'none'
        }} />

        <div
          className="animate-fade-in"
          style={{
            width: '100%',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px' // Compact gap to prevent scrolling
          }}
        >
          {/* Back to Landing Page */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
            <button
              onClick={() => navigate('/')}
              className="back-to-landing-link"
            >
              <span className="arrow" style={{ transition: 'transform 0.25s ease', display: 'inline-block' }}>←</span>
              <span>Back to Landing Page</span>
            </button>
          </div>

          {/* Logo and Greeting */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {/* Official Mountain View Logo Image (Original Blue on Light Background) */}
            <img
              src="/mountain_view_logo.png"
              alt="Mountain View Logo"
              style={{ 
                height: '36px', 
                width: 'auto', 
                objectFit: 'contain', 
                marginBottom: '8px',
                filter: 'brightness(0) saturate(100%) invert(16%) sepia(61%) saturate(5185%) hue-rotate(217deg) brightness(92%) contrast(109%)'
              }}
            />

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-title)', letterSpacing: '-0.02em', marginTop: '12px' }}>
              {isRegister ? 'Register Account' : 'Welcome Back'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 400, marginTop: '-4px' }}>
              {isRegister ? 'Create an operator profile on the digital gateway.' : 'Access your real estate management dashboard.'}
            </p>
          </div>

          {/* Tab Selector */}
          <div style={{
            display: 'flex',
            background: 'rgba(0, 61, 166, 0.02)',
            border: '1px solid rgba(0, 61, 166, 0.08)',
            padding: '4px',
            borderRadius: '14px',
            gap: '4px'
          }}>
            <button
              type="button"
              className={`tab-btn ${!isRegister ? 'tab-btn-active' : 'tab-btn-inactive'}`}
              onClick={() => { setIsRegister(false); setError(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`tab-btn ${isRegister ? 'tab-btn-active' : 'tab-btn-inactive'}`}
              onClick={() => { setIsRegister(true); setError(''); }}
            >
              Register Operator
            </button>
          </div>

          {/* Quick-Fill Profiles section - Premium color-coded chips with vector icons */}
          {!isRegister && (
            <div className="qf-panel">
              <h4 className="qf-title">
                <Sparkles style={{ width: '13px', height: '13px', color: '#003DA6' }} />
                Quick-Fill Sandbox Profiles
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {quickFillGroups.map((group) => (
                  <div key={group.label}>
                    <span
                      className="qf-cat"
                      style={{ '--accent': group.accent, '--accentSoft': group.soft } as React.CSSProperties}
                    >
                      {group.label}
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                      {group.items.map(({ key, label, Icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => fillProfile(key)}
                          className="qf-chip"
                          style={{ '--accent': group.accent, '--accentSoft': group.soft } as React.CSSProperties}
                        >
                          <span className="qf-ico">
                            <Icon size={13} strokeWidth={2.4} />
                          </span>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={isRegister ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div style={{
                color: '#ef4444',
                fontSize: '0.78rem',
                textAlign: 'center',
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.12)',
                borderRadius: '12px',
                fontWeight: 500
              }}>
                {error}
              </div>
            )}

            {isRegister && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#334155', fontSize: '0.8rem', paddingLeft: '4px' }}>Full Name</label>
                <div className="luxury-input-group">
                  <User style={{ position: 'absolute', left: '14px', top: '13px', width: '14px', height: '14px', color: '#64748b' }} />
                  <input
                    type="text"
                    className="luxury-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. User Operator"
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: '#334155', fontSize: '0.8rem', paddingLeft: '4px' }}>Email Address</label>
              <div className="luxury-input-group">
                <Mail style={{ position: 'absolute', left: '14px', top: '13px', width: '14px', height: '14px', color: '#64748b' }} />
                <input
                  type="email"
                  className="luxury-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                />
              </div>
            </div>

            {isRegister && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#334155', fontSize: '0.8rem', paddingLeft: '4px' }}>Phone Number</label>
                <div className="luxury-input-group">
                  <Phone style={{ position: 'absolute', left: '14px', top: '13px', width: '14px', height: '14px', color: '#64748b' }} />
                  <input
                    type="text"
                    className="luxury-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +20100998877"
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: '#334155', fontSize: '0.8rem', paddingLeft: '4px' }}>Password</label>
              <div className="luxury-input-group">
                <KeyRound style={{ position: 'absolute', left: '14px', top: '13px', width: '14px', height: '14px', color: '#64748b' }} />
                <input
                  type="password"
                  className="luxury-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {isRegister && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#334155', fontSize: '0.8rem', paddingLeft: '4px' }}>Confirm Password</label>
                <div className="luxury-input-group">
                  <KeyRound style={{ position: 'absolute', left: '14px', top: '13px', width: '14px', height: '14px', color: '#64748b' }} />
                  <input
                    type="password"
                    className="luxury-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: '#334155', fontSize: '0.8rem', paddingLeft: '4px' }}>
                {isRegister ? 'Role in Platform' : 'Login Role (Simulated)'}
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  className="luxury-select"
                  value={role}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRole(val);
                    if (!isRegister) {
                      fillProfile(val);
                    }
                  }}
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
                  <option value="maintenance_manager">🟠🔧 Facilities Maintenance Manager</option>
                  <option value="legal_officer">⚖️ Legal Officer</option>
                  <option value="client">🐳 Compound Client/Homeowner</option>
                </select>
                <div style={{
                  position: 'absolute',
                  right: '16px',
                  top: '16px',
                  pointerEvents: 'none',
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: '5px solid #64748b'
                }} />
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn-glow"
              disabled={loading}
              style={{ marginTop: '6px' }}
            >
              {loading ? 'Processing Securely...' : (isRegister ? 'Register Account' : 'Sign In')}
              {!loading && <ArrowRight style={{ width: '14px', height: '14px', marginLeft: '2px' }} />}
            </button>
          </form>

          {/* Broker Agency Registration CTA */}
          {!isRegister && (
            <div style={{
              textAlign: 'center',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(0, 61, 166, 0.03)',
              border: '1px solid rgba(0, 61, 166, 0.08)'
            }}>
              <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0 }}>
                Are you a brokerage agency?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/broker-company/register')}
                  style={{ background: 'none', border: 'none', color: '#003DA6', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '0.76rem' }}
                >
                  Register your agency →
                </button>
              </p>
            </div>
          )}

          {/* Elegant Footer */}
          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <p style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Protected by Sentinel Core Security &copy; {new Date().getFullYear()} REDP Inc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
