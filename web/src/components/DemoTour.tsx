import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import {
  X, Play, Pause, ChevronRight, ChevronLeft, Sparkles, RotateCcw, Minus, Maximize2,
  UserCheck, Globe, Building2, Ticket, FileText, CheckCircle, Mail,
  ListOrdered, KeyRound, CalendarCheck,
} from 'lucide-react';

/**
 * Demo Mode — a LIVE, automatic walkthrough driver.
 *
 * Mounted once at the app root (inside <Router>) so it survives route
 * changes. When the admin enables Demo Mode and a visitor clicks
 * "Start Guided Demo", this driver:
 *   1. backs up the current session,
 *   2. plays the backend tour script step-by-step,
 *   3. auto-logs-in as the right demo role for each step (gated /demo/login),
 *   4. auto-navigates to the real page (or scrolls the landing page),
 *   5. narrates over it (bilingual) and auto-advances,
 *   6. restores the original session when finished.
 *
 * Trigger from anywhere with:
 *   window.dispatchEvent(new CustomEvent('redp-demo-start', { detail: { lang: 'ar' } }))
 */

interface DemoStep {
  id: number;
  actor: string;
  icon: string;
  title: string;
  title_ar: string;
  narration: string;
  narration_ar: string;
  mode: 'scroll' | 'navigate';
  anchor?: string;
  route?: string;
  auth_role?: string;
  duration_ms: number;
  actions?: DemoAction[];
  email?: DemoEmail;
}

interface DemoAction {
  type: 'emit' | 'wait' | 'api';
  event?: string;
  endpoint?: string;
  value?: any;
  delay?: number;
}

interface DemoEmail {
  brand?: string;
  to?: string;
  subject?: string;
  subject_ar?: string;
  lines?: string[];
  lines_ar?: string[];
  button?: string;
  button_ar?: string;
  credentials?: { username: string; password: string };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  UserCheck, Globe, Building2, Ticket, FileText, CheckCircle, Mail,
  ListOrdered, KeyRound, CalendarCheck,
};

const ACTOR_COLORS: Record<string, string> = {
  broker: '#7c3aed', customer: '#003DA6', finance: '#0891b2', admin: '#C5A880', system: '#16a34a',
};
const ACTOR_LABEL: Record<string, { en: string; ar: string }> = {
  broker:   { en: 'Broker', ar: 'البروكر' },
  customer: { en: 'Customer', ar: 'العميل' },
  finance:  { en: 'Finance', ar: 'الفايننس' },
  admin:    { en: 'Head of Sales', ar: 'مدير المبيعات' },
  system:   { en: 'System', ar: 'النظام' },
};

const BACKUP_KEY = 'redp_demo_backup';

export default function DemoTour() {
  const [active, setActive] = useState(false);
  const [steps, setSteps] = useState<DemoStep[]>([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [lang, setLang] = useState<'en' | 'ar'>('ar');
  const [collapsed, setCollapsed] = useState(false);

  const roleRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isAr = lang === 'ar';

  // Load the script once.
  useEffect(() => {
    api.get('/demo/tour').then((r) => setSteps(r.data?.data?.steps || [])).catch(() => {});
  }, []);

  // ── session backup / restore ──
  const backupSession = () => {
    if (sessionStorage.getItem(BACKUP_KEY)) return;
    sessionStorage.setItem(BACKUP_KEY, JSON.stringify({
      token: localStorage.getItem('redp_token'),
      user: localStorage.getItem('redp_user'),
    }));
  };
  const restoreSession = () => {
    const raw = sessionStorage.getItem(BACKUP_KEY);
    if (raw) {
      try {
        const { token, user } = JSON.parse(raw);
        if (token) localStorage.setItem('redp_token', token); else localStorage.removeItem('redp_token');
        if (user) localStorage.setItem('redp_user', user); else localStorage.removeItem('redp_user');
      } catch { /* ignore */ }
      sessionStorage.removeItem(BACKUP_KEY);
    }
    roleRef.current = null;
  };

  const ensureRole = useCallback(async (role?: string) => {
    if (!role || roleRef.current === role) return;
    const r = await api.post('/demo/login', { role });
    if (r.data?.token) {
      localStorage.setItem('redp_token', r.data.token);
      localStorage.setItem('redp_user', JSON.stringify(r.data.user));
      roleRef.current = role;
    }
  }, []);

  const endDemo = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setActive(false);
    setPlaying(false);
    restoreSession();
    sessionStorage.removeItem('redp_demo_active');
    navigate('/');
  }, [navigate]);

  // ── start trigger ──
  useEffect(() => {
    const onStart = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      backupSession();
      setLang(detail.lang === 'en' ? 'en' : 'ar');
      roleRef.current = null;
      setIdx(0);
      setProgress(0);
      setPlaying(true);
      setActive(true);
      sessionStorage.setItem('redp_demo_active', '1');
    };
    window.addEventListener('redp-demo-start', onStart);
    return () => window.removeEventListener('redp-demo-start', onStart);
  }, []);

  const step = steps[idx];
  const total = steps.length;
  const isLast = idx >= total - 1;

  const goTo = useCallback((n: number) => {
    setProgress(0);
    setIdx(Math.max(0, Math.min(total - 1, n)));
  }, [total]);

  // ── per-step: auth-switch + navigate + scroll ──
  useEffect(() => {
    if (!active || !step) return;
    let cancelled = false;

    (async () => {
      try {
        await ensureRole(step.auth_role);
      } catch { /* keep going; page may show login */ }
      if (cancelled) return;

      // When a step reveals login credentials in its email preview, make them
      // real in the DB so the visitor can actually sign in with them afterwards.
      if (step.email?.credentials) {
        api.post('/demo/prioritize-client').catch(() => {});
      }

      if (step.mode === 'scroll') {
        if (location.pathname !== '/') navigate('/');
        await sleep(550);
        if (cancelled) return;
        const el = document.querySelector(`[data-tour="${step.anchor}"]`)
          || (step.anchor ? document.getElementById(step.anchor) : null);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (step.route) {
        if (location.pathname !== step.route) navigate(step.route);
        else window.scrollTo({ top: 0, behavior: 'smooth' });
        await sleep(700);
      }
      if (cancelled) return;

      // LIVE actions: drive the real UI (open modal, fill fields, select options…).
      if (step.actions?.length) {
        for (const a of step.actions) {
          if (cancelled) return;
          if (a.type === 'emit' && a.event) {
            window.dispatchEvent(new CustomEvent('redp-demo-action', { detail: { action: a.event, value: a.value } }));
          } else if (a.type === 'api' && a.endpoint) {
            // Perform a real backend action live (approve EOI, prioritize client…),
            // then tell any open dashboard page to re-fetch.
            try { await api.post(a.endpoint); } catch { /* best effort in demo */ }
            window.dispatchEvent(new CustomEvent('redp-demo-refresh'));
          }
          await sleep(a.delay ?? 800);
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, active]);

  // ── auto-advance progress ──
  useEffect(() => {
    if (!active || !step || !playing) return;
    const start = performance.now();
    const dur = step.duration_ms || 9000;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else if (!isLast) goTo(idx + 1);
      else setPlaying(false);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [idx, playing, active, step, isLast, goTo]);

  // Esc ends the demo.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') endDemo(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, endDemo]);

  // While the demo runs, shift any open modal up so the narration card never hides it.
  useEffect(() => {
    document.body.classList.toggle('redp-demo-running', active);
    return () => document.body.classList.remove('redp-demo-running');
  }, [active]);

  if (!active || !step) return null;

  const Icon = ICONS[step.icon] || Sparkles;
  const accent = ACTOR_COLORS[step.actor] || 'var(--color-primary)';
  const actor = ACTOR_LABEL[step.actor]?.[lang] || step.actor;
  const title = isAr ? step.title_ar : step.title;
  const narration = isAr ? step.narration_ar : step.narration;
  const overallPct = ((idx + progress) / Math.max(1, total)) * 100;

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ position: 'fixed', inset: 0, zIndex: 7000, pointerEvents: 'none' }}>
      {/* top overall progress */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 4, background: 'rgba(0,0,0,0.08)' }}>
        <div style={{ height: '100%', width: `${overallPct}%`, background: accent, transition: 'width 0.1s linear' }} />
      </div>

      {/* "LIVE DEMO" badge */}
      <div style={{
        position: 'fixed', top: 14, [isAr ? 'left' : 'right']: 16, pointerEvents: 'auto',
        display: 'flex', alignItems: 'center', gap: 8, background: '#16a34a', color: '#fff',
        padding: '6px 14px', borderRadius: 999, fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.08em',
        boxShadow: '0 8px 22px -8px rgba(22,163,74,0.7)',
      } as React.CSSProperties}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: '#fff', animation: 'pulse 1.2s infinite' }} />
        {isAr ? 'عرض تجريبي مباشر' : 'LIVE DEMO'}
      </div>

      {/* Email preview overlay (for the "email sent" steps) */}
      {step.email && (
        <div style={{
          position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
          width: 'min(620px, calc(100vw - 32px))', maxHeight: 'calc(100vh - 150px)', overflowY: 'auto',
          pointerEvents: 'auto', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
          boxShadow: '0 30px 70px -20px rgba(15,23,42,0.5)', overflowX: 'hidden',
        }}>
          {/* email client chrome */}
          <div style={{ background: '#f1f5f9', padding: '10px 16px', display: 'flex', gap: 6, borderBottom: '1px solid #e2e8f0' }}>
            <span style={{ width: 11, height: 11, borderRadius: 999, background: '#ef4444' }} />
            <span style={{ width: 11, height: 11, borderRadius: 999, background: '#f59e0b' }} />
            <span style={{ width: 11, height: 11, borderRadius: 999, background: '#22c55e' }} />
            <span style={{ marginInlineStart: 'auto', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>
              {isAr ? 'صندوق الوارد' : 'Inbox'}
            </span>
          </div>
          {/* brand header */}
          <div style={{ background: 'linear-gradient(135deg, #003DA6, #001A70)', color: '#fff', padding: '18px 22px' }}>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.14em', opacity: 0.8, fontWeight: 700 }}>
              {(step.email.brand || 'Mountain View').toUpperCase()}
            </div>
            <div style={{ fontSize: '1.12rem', fontWeight: 800, marginTop: 4 }}>
              {isAr ? step.email.subject_ar : step.email.subject}
            </div>
          </div>
          {/* body */}
          <div style={{ padding: '20px 22px' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 14 }}>
              {isAr ? 'إلى: ' : 'To: '}{step.email.to}
            </div>
            {(isAr ? step.email.lines_ar : step.email.lines)?.map((ln, k) => (
              <p key={k} style={{ margin: '0 0 10px', color: '#334155', fontSize: '0.92rem', lineHeight: 1.7 }}>{ln}</p>
            ))}

            {step.email.credentials && (
              <div style={{ marginTop: 12, padding: '12px 14px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 10, fontSize: '0.86rem' }}>
                <div><strong>{isAr ? 'اسم المستخدم: ' : 'Username: '}</strong>{step.email.credentials.username}</div>
                <div><strong>{isAr ? 'كلمة المرور: ' : 'Password: '}</strong>{step.email.credentials.password}</div>
              </div>
            )}

            {step.email.button && (
              <div style={{ marginTop: 18 }}>
                <span style={{ display: 'inline-block', background: '#16a34a', color: '#fff', padding: '11px 22px', borderRadius: 10, fontWeight: 800, fontSize: '0.9rem' }}>
                  {isAr ? step.email.button_ar : step.email.button}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* narration card — docked to a corner, compact, collapsible */}
      {collapsed ? (
        <div style={{
          position: 'fixed', bottom: 18, [isAr ? 'left' : 'right']: 18, pointerEvents: 'auto',
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', border: '1px solid rgba(0,61,166,0.14)', borderRadius: 999,
          boxShadow: '0 14px 34px -14px rgba(0,61,166,0.45)', padding: '7px 10px',
        } as React.CSSProperties}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={16} />
          </div>
          <span style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {idx + 1}/{total}
          </span>
          <button onClick={() => setPlaying((p) => !p)} style={{ ...iconBtn, color: accent }}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
          {!isLast && <button onClick={() => goTo(idx + 1)} style={{ ...iconBtn, color: accent }}>{isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}</button>}
          <button onClick={() => setCollapsed(false)} title={isAr ? 'تكبير' : 'Expand'} style={iconBtn}><Maximize2 size={15} /></button>
          <button onClick={endDemo} title={isAr ? 'إنهاء' : 'End'} style={iconBtn}><X size={15} /></button>
        </div>
      ) : (
        <div style={{
          position: 'fixed', bottom: 18, [isAr ? 'left' : 'right']: 18,
          width: 'min(370px, calc(100vw - 28px))', pointerEvents: 'auto',
          background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0,61,166,0.12)', borderRadius: 16,
          boxShadow: '0 22px 54px -18px rgba(0,61,166,0.45)', padding: '15px 16px',
          textAlign: isAr ? 'right' : 'left',
        } as React.CSSProperties}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: accent, background: `${accent}1a`, padding: '2px 8px', borderRadius: 999 }}>{actor}</span>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>{isAr ? `${idx + 1} / ${total}` : `${idx + 1} / ${total}`}</span>
              </div>
              <h3 style={{ margin: '3px 0 0', fontSize: '0.95rem', color: '#0f172a', fontWeight: 800, lineHeight: 1.3 }}>{title}</h3>
            </div>
            <div style={{ display: 'flex', flexShrink: 0 }}>
              <button onClick={() => setCollapsed(true)} title={isAr ? 'تصغير' : 'Minimize'} style={iconBtn}><Minus size={16} /></button>
              <button onClick={endDemo} title={isAr ? 'إنهاء' : 'End demo'} style={iconBtn}><X size={16} /></button>
            </div>
          </div>

          <p style={{ margin: 0, color: '#334155', fontSize: '0.85rem', lineHeight: 1.6 }}>{narration}</p>

          <div style={{ height: 3, background: 'rgba(0,0,0,0.07)', borderRadius: 999, marginTop: 11, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress * 100}%`, background: accent }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 11, flexWrap: 'wrap' }}>
            <button onClick={() => goTo(idx - 1)} disabled={idx === 0} style={{ ...ctrlBtn, opacity: idx === 0 ? 0.4 : 1 }}>
              {isAr ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}{isAr ? 'السابق' : 'Back'}
            </button>
            <button onClick={() => setPlaying((p) => !p)} style={{ ...ctrlBtn, background: accent, color: '#fff', borderColor: accent }}>
              {playing ? <Pause size={15} /> : <Play size={15} />}{playing ? (isAr ? 'إيقاف' : 'Pause') : (isAr ? 'تشغيل' : 'Play')}
            </button>
            {!isLast ? (
              <button onClick={() => goTo(idx + 1)} style={ctrlBtn}>
                {isAr ? 'التالي' : 'Next'}{isAr ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
              </button>
            ) : (
              <>
                <button onClick={() => { setPlaying(true); goTo(0); }} style={ctrlBtn}><RotateCcw size={14} />{isAr ? 'إعادة' : 'Restart'}</button>
                <button onClick={endDemo} style={{ ...ctrlBtn, background: '#16a34a', color: '#fff', borderColor: '#16a34a' }}><CheckCircle size={15} />{isAr ? 'إنهاء' : 'Finish'}</button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse{0%{opacity:1}50%{opacity:0.3}100%{opacity:1}}
        /* While the demo runs, float any open modal at the TOP, fully bright,
           and keep a clear gap so the narration card (z 7000) never covers it. */
        body.redp-demo-running .modal-backdrop{
          z-index:6000 !important;
          align-items:flex-start !important;
          padding-top:20px !important;
          padding-bottom:120px !important;
          background:rgba(2,6,23,0.55) !important;
        }
        body.redp-demo-running .modal-content{
          max-height:calc(100vh - 150px) !important;
          background:#ffffff !important;
          box-shadow:0 30px 80px -20px rgba(0,0,0,0.55) !important;
        }
      `}</style>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 8, flexShrink: 0,
};
const ctrlBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.82rem',
  fontWeight: 700, cursor: 'pointer', borderRadius: 10, border: '1px solid rgba(0,61,166,0.18)',
  background: '#fff', color: '#0f172a',
};
