import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Mail, Sparkles, Shield, Compass, ArrowRight } from 'lucide-react';
import api from '../../services/api';

const ClientLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projectName, setProjectName] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return;
      try {
        const res = await api.get('/projects');
        if (res.data && res.data.success) {
          const project = res.data.data.find((p: any) => p.id === projectId);
          if (project) {
            setProjectName(project.name);
          }
        }
      } catch (err) {
        console.error('Failed to fetch project info:', err);
      }
    };
    fetchProjectDetails();
  }, [projectId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data && response.data.success) {
        localStorage.setItem('redp_token', response.data.token);
        localStorage.setItem('redp_user', JSON.stringify(response.data.user));
        
        // Redirect directly to unit-selection for the project
        if (projectId) {
          navigate(`/unit-selection?project=${projectId}`);
        } else {
          navigate('/unit-selection');
        }
      } else {
        setError(response.data.message || 'Authentication failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f8fafc',
      fontFamily: 'var(--font-body)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Styled styles */}
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
          background: linear-gradient(135deg, rgba(0, 15, 61, 0.75) 0%, rgba(0, 20, 80, 0.5) 60%, rgba(0, 10, 50, 0.8) 100%);
        }
        .client-login-input {
          width: 100%;
          padding: 12px 16px 12px 42px;
          background: #ffffff;
          border: 1px solid rgba(0, 61, 166, 0.15);
          border-radius: 12px;
          color: #0f172a;
          font-size: 0.9rem;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .client-login-input:focus {
          outline: none;
          border-color: #003DA6;
          box-shadow: 0 0 12px rgba(0, 61, 166, 0.15);
        }
        .client-submit-btn {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #003DA6 0%, #001A70 100%);
          color: #ffffff;
          border: none;
          border-radius: 30px;
          padding: 14px;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 15px rgba(0, 61, 166, 0.25);
        }
        .client-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #004cce 0%, #00228c 100%);
          box-shadow: 0 6px 20px rgba(0, 61, 166, 0.35);
        }
        .client-submit-btn:active {
          transform: translateY(0);
        }
        .client-submit-btn::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -60%;
          width: 30%;
          height: 200%;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent);
          transform: rotate(30deg);
          transition: all 0.8s ease;
        }
        .client-submit-btn:hover::after {
          left: 140%;
        }
        @media (max-width: 1024px) {
          .split-left-panel {
            display: none !important;
          }
          .split-right-panel {
            width: 100% !important;
          }
        }
      `}} />

      {/* Background for mobile */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 1,
          overflow: 'hidden',
          background: '#000f3d'
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
            objectFit: 'cover',
            opacity: 0.3
          }}
        />
      </div>

      {/* LEFT PANEL - Elegant Brand Showcase */}
      <div
        className="split-left-panel"
        style={{
          flex: '1.2',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          overflow: 'hidden',
          zIndex: 3
        }}
      >
        {/* Video */}
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

        {/* Overlay */}
        <div
          className="luxury-overlay"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 2
          }}
        />

        {/* Logo */}
        <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', zIndex: 4 }}>
          <img
            src="/mountain_view_logo.png"
            alt="Mountain View Logo"
            style={{ height: '40px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
        </div>

        {/* Center Tagline */}
        <div className="animate-fade-in" style={{ zIndex: 4, maxWidth: '560px', marginTop: '100px', marginBottom: 'auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '6px 14px', borderRadius: '20px', marginBottom: '28px' }}>
            <Sparkles style={{ width: '12px', height: '12px', color: '#C5A880' }} />
            <span style={{ fontSize: '0.75rem', color: '#ffffff', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Outfit' }}>Exclusive Invitation</span>
          </div>
          <h1 style={{
            fontSize: '3.4rem',
            fontWeight: 800,
            lineHeight: 1.1,
            color: '#ffffff',
            letterSpacing: '-0.03em',
            fontFamily: 'Outfit',
            textShadow: '0 4px 24px rgba(0,0,0,0.3)'
          }}>
            Select Your Dream <span style={{ color: '#C5A880', fontStyle: 'italic', fontWeight: 400 }}>Residence</span>.
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255, 255, 255, 0.85)', marginTop: '20px', lineHeight: '1.6', fontWeight: 300, fontFamily: 'Outfit' }}>
            Your Expression of Interest priority queue is now active. Access our interactive master plan to explore available buildings, browse layouts, and secure your unit in real-time.
          </p>
        </div>

        {/* Bottom badging */}
        <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px', zIndex: 4 }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div>
              <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, fontFamily: 'Outfit' }}>Verification Gateway</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <Shield style={{ width: '12px', height: '12px', color: '#C5A880' }} />
                <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 500, fontFamily: 'Outfit' }}>Secure Client Space</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, fontFamily: 'Outfit' }}>Selection Mode</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <Compass style={{ width: '12px', height: '12px', color: '#C5A880' }} />
                <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 500, fontFamily: 'Outfit' }}>Interactive 3D Master Plan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Clean Client Login Card */}
      <div
        className="split-right-panel"
        style={{
          width: '520px',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          zIndex: 4,
          position: 'relative'
        }}
      >
        <div
          className="animate-fade-in"
          style={{
            width: '100%',
            maxWidth: '380px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          {/* Logo image */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <img
              src="/mountain_view_logo.png"
              alt="Mountain View Logo"
              style={{
                height: '42px',
                width: 'auto',
                objectFit: 'contain',
                marginBottom: '12px',
                filter: 'brightness(0) saturate(100%) invert(16%) sepia(61%) saturate(5185%) hue-rotate(217deg) brightness(92%) contrast(109%)'
              }}
            />

            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#001A70', fontFamily: 'Outfit', letterSpacing: '-0.02em', marginTop: '8px' }}>
              Client Priority Login
            </h3>
            
            {projectName ? (
              <div style={{
                background: 'rgba(197, 168, 128, 0.08)',
                border: '1.5px solid rgba(197, 168, 128, 0.25)',
                color: '#84602B',
                borderRadius: '12px',
                padding: '12px 16px',
                marginTop: '12px',
                fontSize: '0.88rem',
                fontWeight: 600,
                textAlign: 'center',
                fontFamily: 'Outfit',
                lineHeight: '1.4'
              }}>
                🔑 You are invited to select your unit at:<br/>
                <span style={{ color: '#001A70', fontSize: '1.05rem', fontWeight: 800, display: 'block', marginTop: '4px' }}>
                  {projectName}
                </span>
              </div>
            ) : (
              <p style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 400, marginTop: '2px', fontFamily: 'Outfit' }}>
                Please enter your credentials to access unit selection.
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{
                color: '#ef4444',
                fontSize: '0.82rem',
                textAlign: 'center',
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                borderRadius: '12px',
                fontWeight: 500,
                fontFamily: 'Outfit'
              }}>
                {error}
              </div>
            )}

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#334155', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'Outfit', paddingLeft: '4px' }}>Invitation Email</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '14px', top: '14px', width: '15px', height: '15px', color: '#64748b' }} />
                <input
                  type="email"
                  className="client-login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#334155', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'Outfit', paddingLeft: '4px' }}>Temporary Password</label>
              <div style={{ position: 'relative' }}>
                <KeyRound style={{ position: 'absolute', left: '14px', top: '14px', width: '15px', height: '15px', color: '#64748b' }} />
                <input
                  type="password"
                  className="client-login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="client-submit-btn"
              disabled={loading}
              style={{ marginTop: '10px' }}
            >
              {loading ? 'Verifying Credentials...' : (
                <>
                  Enter Selection Portal
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </>
              )}
            </button>
          </form>

          {/* Regular Login Link */}
          <div style={{ textAlign: 'center', marginTop: '16px', borderTop: '1px solid rgba(0, 0, 0, 0.05)', paddingTop: '20px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'Outfit' }}>Are you a broker or property consultant? </span>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#003DA6',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontFamily: 'Outfit',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              Staff Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientLogin;
