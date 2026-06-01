import React, { useState } from 'react';
import {
  Phone, PhoneOff, Mic, MicOff, Pause, Play, Volume2,
  X, User, MessageSquare, Clock, PhoneIncoming, PhoneOutgoing,
  Minimize2, Maximize2
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
// REDP — Acquisition & Sales Engine (Developer 1: Ragab)
// Component: VoIP Call Center Dialer Widget
// Sticky bottom-right softphone with caller info screen pop.
// ─────────────────────────────────────────────────────────

interface CallerInfo {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  lead_score: number;
  notes: string;
  last_interaction: string;
}

type CallState = 'idle' | 'dialing' | 'ringing' | 'active' | 'on-hold' | 'ended';

const VoipDialerWidget: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [callState, setCallState] = useState<CallState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [dialNumber, setDialNumber] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [callerInfo, setCallerInfo] = useState<CallerInfo | null>(null);
  const [callNotes, setCallNotes] = useState('');

  // Mock caller data for screen pop
  const mockCallerLookup = (phone: string): CallerInfo => ({
    id: 'l1',
    name: 'Ahmed Ali Hassan',
    phone: phone || '+20100998877',
    email: 'ahmed@gmail.com',
    status: 'interested',
    lead_score: 85,
    notes: 'Interested in Phase 3 Villa units, prefers garden view',
    last_interaction: 'Call on May 30 — discussed payment plans',
  });

  const handleDial = () => {
    if (!dialNumber) return;
    setCallState('dialing');
    setCallerInfo(mockCallerLookup(dialNumber));
    
    setTimeout(() => setCallState('ringing'), 1000);
    setTimeout(() => {
      setCallState('active');
      // Start timer
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      // Store timer ref in window for cleanup
      (window as any).__voip_timer = timer;
    }, 3000);
  };

  const handleEndCall = () => {
    setCallState('ended');
    clearInterval((window as any).__voip_timer);
    setTimeout(() => {
      setCallState('idle');
      setCallDuration(0);
      setIsMuted(false);
      setCallerInfo(null);
      setCallNotes('');
    }, 2000);
  };

  const handleHold = () => {
    setCallState(callState === 'on-hold' ? 'active' : 'on-hold');
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const dialPad = ['1','2','3','4','5','6','7','8','9','*','0','#'];

  const stateColors: Record<CallState, string> = {
    idle: 'var(--color-primary)',
    dialing: 'var(--color-warning)',
    ringing: 'var(--color-warning)',
    active: 'var(--color-success)',
    'on-hold': 'var(--color-warning)',
    ended: 'var(--color-danger)',
  };

  // ── Minimized State (Floating Button) ──
  if (!isExpanded) {
    return (
      <div
        onClick={() => setIsExpanded(true)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          width: callState !== 'idle' ? '200px' : '56px',
          height: '56px',
          background: callState !== 'idle'
            ? `linear-gradient(135deg, ${stateColors[callState]}, ${stateColors[callState]}dd)`
            : 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          borderRadius: callState !== 'idle' ? '16px' : '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          cursor: 'pointer',
          boxShadow: `0 8px 32px ${stateColors[callState]}44`,
          animation: callState === 'ringing' ? 'pulse-ring 1.5s ease infinite' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        {callState === 'active' || callState === 'on-hold' ? (
          <>
            <Phone style={{ width: '20px', height: '20px', color: '#fff' }} />
            <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
              {formatDuration(callDuration)}
            </span>
          </>
        ) : callState === 'ringing' ? (
          <PhoneIncoming style={{ width: '24px', height: '24px', color: '#fff' }} />
        ) : (
          <Phone style={{ width: '24px', height: '24px', color: '#fff' }} />
        )}
      </div>
    );
  }

  // ── Expanded Dialer Widget ──
  return (
    <>
      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); }
          70% { box-shadow: 0 0 0 20px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        @keyframes call-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
        width: callerInfo ? '420px' : '320px',
        background: '#ffffff',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${stateColors[callState]}44`,
        borderRadius: 'var(--radius-md)',
        boxShadow: `0 20px 60px rgba(0,0,0,0.15), 0 0 20px ${stateColors[callState]}11`,
        overflow: 'hidden',
        display: 'flex',
        transition: 'all 0.3s ease',
      }}>

        {/* ── Main Dialer Panel ── */}
        <div style={{ width: callerInfo ? '220px' : '100%', borderRight: callerInfo ? '1px solid var(--border-glass)' : 'none' }}>

          {/* Header Bar */}
          <div style={{
            padding: '12px 16px',
            background: stateColors[callState] + '15',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: stateColors[callState],
                animation: callState === 'active' ? 'call-pulse 2s ease infinite' : 'none',
              }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {callState === 'idle' ? 'Ready' : callState === 'on-hold' ? 'On Hold' : callState.charAt(0).toUpperCase() + callState.slice(1)}
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
            >
              <Minimize2 style={{ width: '14px', height: '14px' }} />
            </button>
          </div>

          {/* Call Duration */}
          {callState !== 'idle' && (
            <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: stateColors[callState], fontFamily: 'var(--font-title)' }}>
                {formatDuration(callDuration)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {callerInfo?.name || dialNumber}
              </div>
            </div>
          )}

          {/* Dial Input */}
          {callState === 'idle' && (
            <div style={{ padding: '16px 16px 8px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="+20 XXX XXX XXXX"
                value={dialNumber}
                onChange={(e) => setDialNumber(e.target.value)}
                style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.05em', padding: '12px' }}
              />
            </div>
          )}

          {/* Dial Pad */}
          {callState === 'idle' && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px',
              padding: '8px 16px',
            }}>
              {dialPad.map(key => (
                <button
                  key={key}
                  onClick={() => setDialNumber(prev => prev + key)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.45)', border: '1px solid var(--border-glass)',
                    borderRadius: '8px', padding: '10px', cursor: 'pointer',
                    color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(50, 71, 58, 0.1)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.45)')}
                >
                  {key}
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ padding: '12px 16px 16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {callState === 'idle' ? (
              <button
                onClick={handleDial}
                disabled={!dialNumber}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: dialNumber ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255, 255, 255, 0.45)',
                  color: '#fff', border: 'none', cursor: dialNumber ? 'pointer' : 'not-allowed',
                  fontSize: '0.85rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: dialNumber ? 1 : 0.5,
                }}
              >
                <Phone style={{ width: '16px', height: '16px' }} /> Dial
              </button>
            ) : (
              <>
                {/* Mute */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.45)',
                    border: `1px solid ${isMuted ? 'var(--color-danger)' : 'var(--border-glass)'}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isMuted ? 'var(--color-danger)' : 'var(--text-muted)',
                  }}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff style={{ width: '16px', height: '16px' }} /> : <Mic style={{ width: '16px', height: '16px' }} />}
                </button>

                {/* Hold */}
                <button
                  onClick={handleHold}
                  style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: callState === 'on-hold' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.45)',
                    border: `1px solid ${callState === 'on-hold' ? 'var(--color-warning)' : 'var(--border-glass)'}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: callState === 'on-hold' ? 'var(--color-warning)' : 'var(--text-muted)',
                  }}
                  title={callState === 'on-hold' ? 'Resume' : 'Hold'}
                >
                  {callState === 'on-hold' ? <Play style={{ width: '16px', height: '16px' }} /> : <Pause style={{ width: '16px', height: '16px' }} />}
                </button>

                {/* End Call */}
                <button
                  onClick={handleEndCall}
                  style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
                  }}
                  title="End Call"
                >
                  <PhoneOff style={{ width: '16px', height: '16px' }} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Caller Info Screen Pop (when call active) ── */}
        {callerInfo && callState !== 'idle' && (
          <div style={{ flex: 1, padding: '16px', overflow: 'auto', maxHeight: '500px' }}>
            {/* Lead Profile */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 8px',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', fontWeight: 700, color: '#fff',
              }}>
                {callerInfo.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{callerInfo.name}</h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0' }}>{callerInfo.phone}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{callerInfo.email}</p>
            </div>

            {/* Lead Status & Score */}
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span className="badge badge-info" style={{ fontSize: '0.6rem' }}>{callerInfo.status}</span>
              <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>Score: {callerInfo.lead_score}</span>
            </div>

            {/* Notes Section */}
            <div style={{
              background: 'rgba(50, 71, 58, 0.05)', borderRadius: '8px', padding: '10px',
              marginBottom: '12px', fontSize: '0.72rem', color: 'var(--text-muted)',
            }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', fontSize: '0.68rem' }}>
                <MessageSquare style={{ width: '10px', height: '10px', display: 'inline', marginRight: '4px' }} />
                Lead Notes
              </div>
              {callerInfo.notes}
            </div>

            {/* Last Interaction */}
            <div style={{
              background: 'rgba(50, 71, 58, 0.05)', borderRadius: '8px', padding: '10px',
              marginBottom: '12px', fontSize: '0.72rem', color: 'var(--text-muted)',
            }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', fontSize: '0.68rem' }}>
                <Clock style={{ width: '10px', height: '10px', display: 'inline', marginRight: '4px' }} />
                Last Interaction
              </div>
              {callerInfo.last_interaction}
            </div>

            {/* Call Notes Input */}
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                Call Notes
              </label>
              <textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Type notes during call..."
                style={{
                  width: '100%', height: '60px', resize: 'none',
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px', padding: '8px', fontSize: '0.72rem',
                  color: 'var(--text-main)', fontFamily: 'var(--font-body)',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default VoipDialerWidget;
