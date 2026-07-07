import React, { useEffect, useRef, useState } from 'react';
import { Video, PhoneOff, X, MessageCircle, User } from 'lucide-react';

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Anam AI real-time photoreal avatar ("Nour") for customers.
 *
 * On page open we surface an INCOMING VIDEO-CALL popup ("Talk to your
 * sales"). Accepting launches Anam's OFFICIAL agent-widget web component
 * — a live photoreal avatar session via api.anam.ai. Declining dismisses
 * to a small floating chat-icon the visitor can tap to call back.
 *
 * The agent's persona/brain is configured on anam.ai (NOT the REDP Gemini
 * assistant). Override the agent id via VITE_ANAM_AGENT_ID.
 *
 * NOTE: Anam only starts a session on domains ALLOW-LISTED for the agent
 * in the Anam dashboard — add localhost / your prod domain there or the
 * avatar won't connect.
 * ─────────────────────────────────────────────────────────
 */

const AGENT_ID = (import.meta.env.VITE_ANAM_AGENT_ID as string) || '1e538658-067d-4b62-a860-ecfff6d111c6';
const SCRIPT_SRC = 'https://unpkg.com/@anam-ai/agent-widget';

const AnamAgent: React.FC = () => {
  const [incoming, setIncoming] = useState(false); // ringing popup
  const [open, setOpen] = useState(false);         // live avatar panel
  const hostRef = useRef<HTMLDivElement>(null);

  // Ring shortly after the page opens — every visit/refresh.
  useEffect(() => {
    const t = setTimeout(() => setIncoming(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Lazily load the Anam widget + mount the element only once the call is answered.
  useEffect(() => {
    if (!open) return;

    if (!document.querySelector('script[data-anam="1"]')) {
      const s = document.createElement('script');
      s.src = SCRIPT_SRC;
      s.async = true;
      s.setAttribute('data-anam', '1');
      document.body.appendChild(s);
    }

    const host = hostRef.current;
    if (host && !host.querySelector('anam-agent')) {
      const el = document.createElement('anam-agent');
      el.setAttribute('agent-id', AGENT_ID);
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.display = 'block';
      host.appendChild(el);
    }
  }, [open]);

  const answer = () => { setIncoming(false); setOpen(true); };
  const decline = () => setIncoming(false);

  return (
    <>
      {/* Keyframes for the ringing avatar pulse */}
      <style>{`
        @keyframes anamRing {
          0%   { box-shadow: 0 0 0 0 rgba(79,70,229,0.55); }
          70%  { box-shadow: 0 0 0 18px rgba(79,70,229,0); }
          100% { box-shadow: 0 0 0 0 rgba(79,70,229,0); }
        }
        @keyframes anamRise {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* ── Incoming video-call popup ── */}
      {incoming && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '320px',
            maxWidth: 'calc(100vw - 32px)',
            borderRadius: '20px',
            overflow: 'hidden',
            background: 'linear-gradient(160deg, #111827 0%, #1e1b4b 100%)',
            boxShadow: '0 26px 70px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff',
            zIndex: 9999,
            animation: 'anamRise 0.35s ease-out',
          }}
        >
          <div style={{ padding: '22px 20px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.12em', color: '#a5b4fc', fontWeight: 600 }}>
              INCOMING VIDEO CALL
            </div>

            <div
              style={{
                margin: '16px auto 12px',
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'anamRing 1.6s infinite',
              }}
            >
              <User style={{ width: 40, height: 40, color: '#fff' }} />
            </div>

            <div style={{ fontSize: '18px', fontWeight: 700 }}>Nour</div>
            <div style={{ fontSize: '14px', color: '#c7d2fe', marginTop: '4px' }}>Talk to your sales</div>
          </div>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', padding: '0 20px 22px' }}>
            {/* Decline */}
            <button
              onClick={decline}
              aria-label="Decline call"
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                background: '#dc2626',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(220,38,38,0.4)',
              }}
            >
              <PhoneOff style={{ width: 24, height: 24 }} />
            </button>
            {/* Answer */}
            <button
              onClick={answer}
              aria-label="Answer call"
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                background: '#16a34a',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(22,163,74,0.45)',
              }}
            >
              <Video style={{ width: 24, height: 24 }} />
            </button>
          </div>
        </div>
      )}

      {/* ── Live avatar panel ── */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '540px',
            maxHeight: 'calc(100vh - 140px)',
            borderRadius: '20px',
            overflow: 'hidden',
            background: '#0b1220',
            boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.08)',
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)',
              color: '#fff',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Nour · Live Assistant</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="End call"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
          <div ref={hostRef} data-anam-host style={{ flex: 1, minHeight: 0 }} />
        </div>
      )}

      {/* ── Floating chat-icon (call back anytime) ── */}
      <button
        onClick={() => (open ? setOpen(false) : answer())}
        aria-label={open ? 'End call' : 'Talk to your sales'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)',
          color: '#fff',
          boxShadow: '0 12px 30px rgba(79,70,229,0.45)',
          display: incoming ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9997,
        }}
      >
        {open ? <X style={{ width: 26, height: 26 }} /> : <MessageCircle style={{ width: 26, height: 26 }} />}
      </button>
    </>
  );
};

export default AnamAgent;
