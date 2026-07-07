import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Send, X, Mic, Volume2, VolumeX, Trash2, Phone, PhoneOff, Video } from 'lucide-react';
import api from '../services/api';
import { LiveVoiceClient, type LiveState } from '../lib/liveVoice';
import NourAvatar, { type NourState } from './NourAvatar';
import NourAvatarRPM from './NourAvatarRPM';
import { VisemePlayer, estimateSpeechMs, REST, type MouthShape } from '../lib/visemes';

/**
 * ─────────────────────────────────────────────────────────
 * REDP — Aiva AI Assistant Widget
 *
 * A floating, bilingual (Arabic/English) chatbot that can talk and listen:
 *   • Text chat with an agentic Gemini backend (it can look up real data
 *     and take actions like registering a lead or opening a ticket).
 *   • 🎤 Voice input  — browser SpeechRecognition (speech-to-text).
 *   • 🔊 Voice output — browser SpeechSynthesis (text-to-speech), so it
 *     "talks like a person" on a call. No telephony required.
 *
 * mode="public"   → landing-page assistant   → /public/assistant/chat
 * mode="internal" → dashboard assistant      → /assistant/chat (role-scoped)
 * ─────────────────────────────────────────────────────────
 */

type Msg = { role: 'user' | 'assistant'; text: string };
type Lang = 'en' | 'ar';

interface Props {
  mode: 'public' | 'internal';
}

// Web Speech API isn't in the TS DOM lib — grab it untyped.
const SpeechRecognitionImpl: any =
  (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) || null;

const hasArabic = (t: string) => /[؀-ۿ]/.test(t);

const uid = () =>
  'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);

const T = {
  en: {
    title: 'Aiva — AI Assistant',
    placeholder: 'Type or press the mic to talk…',
    greetPublic: "Hi! I'm Aiva 👋 Ask me about our projects, available units and prices — or I can register your interest. How can I help?",
    greetInternal: "Hi! I'm Aiva, your work assistant. Ask me about leads, inventory, sales figures, a client's balance, or to open a ticket.",
    listening: 'Listening…',
    thinking: 'Aiva is typing…',
    voiceOn: 'Voice replies on',
    voiceOff: 'Voice replies off',
    clear: 'Clear chat',
    close: 'Close',
    open: 'Chat with Aiva',
    noMic: 'Voice input is not supported in this browser.',
  },
  ar: {
    title: 'أيفا — المساعد الذكي',
    placeholder: 'اكتب أو اضغط الميكروفون للتحدث…',
    greetPublic: 'أهلاً! أنا أيفا 👋 اسألني عن مشروعاتنا والوحدات المتاحة والأسعار، أو أقدر أسجّل اهتمامك. أقدر أساعدك بإيه؟',
    greetInternal: 'أهلاً! أنا أيفا مساعدتك في العمل. اسألني عن العملاء المحتملين، المخزون، أرقام المبيعات، رصيد عميل، أو افتح تذكرة صيانة.',
    listening: 'أستمع…',
    thinking: 'أيفا تكتب…',
    voiceOn: 'الردّ الصوتي مُفعّل',
    voiceOff: 'الردّ الصوتي مُغلق',
    clear: 'مسح المحادثة',
    close: 'إغلاق',
    open: 'تحدّث مع أيفا',
    noMic: 'الإدخال الصوتي غير مدعوم في هذا المتصفح.',
  },
};

const AiAssistant: React.FC<Props> = ({ mode }) => {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [voiceOn, setVoiceOn] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  // "Talk to your sales" incoming-call popup (customer-facing, on page open)
  const [incomingCall, setIncomingCall] = useState(false);

  // Live voice call state
  const [callState, setCallState] = useState<LiveState | 'idle'>('idle');
  const [callSpeaking, setCallSpeaking] = useState(false);
  const [userLive, setUserLive] = useState('');
  const [botLive, setBotLive] = useState('');
  const [ttsSpeaking, setTtsSpeaking] = useState(false);
  const [mouth, setMouth] = useState<MouthShape>(REST);
  // D-ID photoreal talking-head video
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const didEnabledRef = useRef<boolean | null>(null);
  const liveClientRef = useRef<LiveVoiceClient | null>(null);
  const lastSpeakerRef = useRef<'user' | 'bot'>('user');
  const visemeRef = useRef<VisemePlayer | null>(null);
  const voiceActiveRef = useRef(false);

  // Viseme player drives Nour's mouth shape from the text being spoken.
  useEffect(() => {
    visemeRef.current = new VisemePlayer((m) =>
      setMouth((prev) => (voiceActiveRef.current ? { ...prev, wide: m.wide, round: m.round } : m))
    );
    return () => visemeRef.current?.stop();
  }, []);

  // Prime the TTS voice list early (loads asynchronously in most browsers).
  useEffect(() => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!synth) return;
    synth.getVoices();
    const h = () => synth.getVoices();
    synth.addEventListener?.('voiceschanged', h);
    return () => synth.removeEventListener?.('voiceschanged', h);
  }, []);

  const sessionRef = useRef<string>('');
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endpoint = mode === 'internal' ? '/assistant/chat' : '/public/assistant/chat';

  // Persistent session id per mode
  useEffect(() => {
    const key = `redp_assistant_session_${mode}`;
    let s = localStorage.getItem(key);
    if (!s) {
      s = uid();
      localStorage.setItem(key, s);
    }
    sessionRef.current = s;
  }, [mode]);

  // Greeting when first opened
  useEffect(() => {
    if (open && messages.length === 0) {
      const t = T[lang];
      setMessages([{ role: 'assistant', text: mode === 'internal' ? t.greetInternal : t.greetPublic }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const speak = useCallback(
    (text: string) => {
      if (!voiceOn || typeof window === 'undefined' || !window.speechSynthesis || !text.trim()) return;
      const synth = window.speechSynthesis;

      const pickVoice = (ar: boolean) => {
        const voices = synth.getVoices();
        const langVoices = voices.filter((v) => (v.lang || '').toLowerCase().startsWith(ar ? 'ar' : 'en'));
        const pool = langVoices.length ? langVoices : voices;
        const femaleRe = /female|woman|girl|zira|hoda|salma|hazel|susan|samantha|karen|tessa|fiona|amira|la[iy]la|hala|sara|maryam|aria|jenny|nour|amelia|sonia|libby|nova|google/i;
        const maleRe = /male|david|mark|guy|naayf|naif|hamed|ahmed|george|paul|daniel|man\b/i;
        return (
          pool.find((v) => femaleRe.test(v.name) && !maleRe.test(v.name)) ||
          pool.find((v) => !maleRe.test(v.name)) ||
          pool[0]
        );
      };

      const run = () => {
        try {
          synth.cancel();
        } catch {
          /* ignore */
        }
        const ar = hasArabic(text);
        const u = new SpeechSynthesisUtterance(text);
        u.lang = ar ? 'ar-EG' : 'en-US';
        const v = pickVoice(ar);
        if (v) u.voice = v;
        u.rate = 1;
        u.pitch = 1.15;

        let keepAlive = 0;
        const stop = () => {
          setTtsSpeaking(false);
          visemeRef.current?.stop();
          setMouth(REST);
          if (keepAlive) {
            clearInterval(keepAlive);
            keepAlive = 0;
          }
        };
        u.onstart = () => {
          setTtsSpeaking(true);
          visemeRef.current?.play(text, estimateSpeechMs(text));
          // Chrome silently stops speech after ~15s — nudge it to keep going.
          keepAlive = window.setInterval(() => {
            if (synth.speaking) {
              synth.pause();
              synth.resume();
            } else {
              stop();
            }
          }, 9000);
        };
        u.onend = stop;
        u.onerror = stop;
        // Small delay after cancel() so Chrome doesn't drop the new utterance.
        setTimeout(() => synth.speak(u), 60);
      };

      // Voices load asynchronously — make sure they're ready before speaking.
      if (synth.getVoices().length === 0) {
        let started = false;
        const go = () => {
          if (started) return;
          started = true;
          synth.removeEventListener?.('voiceschanged', go);
          run();
        };
        synth.addEventListener?.('voiceschanged', go);
        setTimeout(go, 350);
      } else {
        run();
      }
    },
    [voiceOn]
  );

  // Photoreal talking-head (D-ID): render the reply as a real human video.
  const playAvatarVideo = useCallback(
    async (text: string): Promise<boolean> => {
      let role = '';
      try {
        role = JSON.parse(localStorage.getItem('redp_user') || '{}').role || '';
      } catch {
        /* ignore */
      }
      const customer = mode === 'public' || role === 'client';
      if (!customer || didEnabledRef.current === false || !text.trim()) return false;
      try {
        setVideoGenerating(true);
        const c = await api.post('/public/assistant/avatar-video', { text });
        const d = c.data?.data;
        if (!d?.configured) {
          didEnabledRef.current = false;
          setVideoGenerating(false);
          return false;
        }
        didEnabledRef.current = true;
        for (let i = 0; i < 45; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          const s = (await api.get('/public/assistant/avatar-video/' + d.id)).data?.data;
          if (s?.status === 'done' && s.video_url) {
            setVideoUrl(s.video_url);
            setVideoGenerating(false);
            return true;
          }
          if (s?.status === 'error' || s?.status === 'rejected') break;
        }
      } catch {
        /* fall through to TTS */
      }
      setVideoGenerating(false);
      return false;
    },
    [mode]
  );

  // Voice a reply: prefer the D-ID photoreal video, else browser TTS.
  const respondWithVoice = useCallback(
    async (reply: string) => {
      const played = await playAvatarVideo(reply);
      if (!played) speak(reply);
    },
    [playAvatarVideo, speak]
  );

  const send = useCallback(
    async (raw?: string) => {
      const text = (raw ?? input).trim();
      if (!text || loading) return;

      setInput('');
      setMessages((m) => [...m, { role: 'user', text }]);
      setLoading(true);
      setVideoUrl(null);

      try {
        const res = await api.post(endpoint, {
          message: text,
          session_id: sessionRef.current,
          context: { page: window.location.pathname },
        });
        const reply: string = res.data?.data?.reply ?? '…';
        setMessages((m) => [...m, { role: 'assistant', text: reply }]);
        respondWithVoice(reply);
      } catch (e: any) {
        const errText =
          lang === 'ar'
            ? 'عذراً، حدث خطأ في الاتصال بالمساعد. حاول مرة أخرى.'
            : 'Sorry, something went wrong reaching the assistant. Please try again.';
        setMessages((m) => [...m, { role: 'assistant', text: errText }]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, endpoint, respondWithVoice, lang]
  );

  const toggleMic = useCallback(() => {
    if (!SpeechRecognitionImpl) {
      alert(T[lang].noMic);
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SpeechRecognitionImpl();
    rec.lang = lang === 'ar' ? 'ar-EG' : 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.onresult = (ev: any) => {
      const transcript = ev.results?.[0]?.[0]?.transcript ?? '';
      setListening(false);
      if (transcript) send(transcript);
    };
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }, [listening, lang, send]);

  const clearChat = useCallback(async () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setVideoUrl(null);
    try {
      await api.post(mode === 'internal' ? '/assistant/clear' : '/public/assistant/clear', {
        session_id: sessionRef.current,
      });
    } catch {
      /* ignore */
    }
    const t = T[lang];
    setMessages([{ role: 'assistant', text: mode === 'internal' ? t.greetInternal : t.greetPublic }]);
  }, [lang, mode]);

  const endCall = useCallback(() => {
    liveClientRef.current?.stop();
    liveClientRef.current = null;
    voiceActiveRef.current = false;
    visemeRef.current?.stop();
    setMouth(REST);
    setCallState('idle');
    setCallSpeaking(false);
    setUserLive('');
    setBotLive('');
  }, []);

  const startCall = useCallback(async () => {
    if (callState !== 'idle') return;
    voiceActiveRef.current = true;
    setCallState('connecting');
    setUserLive('');
    setBotLive('');
    try {
      const res = await api.post('/assistant/live-config', { context: { page: window.location.pathname } });
      const cfg = res.data?.data;
      if (!cfg?.configured || !cfg?.api_key) {
        throw new Error('Voice not configured on the server.');
      }

      const toolExec = async (name: string, args: any) => {
        const r = await api.post('/assistant/live-tool', { name, args });
        return r.data?.data ?? {};
      };

      const client = new LiveVoiceClient(cfg, {
        onState: (s) => setCallState(s),
        onSpeaking: (sp) => setCallSpeaking(sp),
        onUserTranscript: (txt) => {
          if (lastSpeakerRef.current === 'bot') setUserLive('');
          lastSpeakerRef.current = 'user';
          setUserLive((p) => (p + txt).slice(-300));
        },
        onBotTranscript: (txt) => {
          if (lastSpeakerRef.current === 'user') setBotLive('');
          lastSpeakerRef.current = 'bot';
          setBotLive((p) => (p + txt).slice(-300));
          if (txt.trim()) visemeRef.current?.play(txt, estimateSpeechMs(txt));
        },
        onAmplitude: (level) => setMouth((prev) => ({ ...prev, open: Math.min(1, level * 1.3) })),
        onError: (msg) => {
          setMessages((m) => [...m, { role: 'assistant', text: '🎙️ ' + msg }]);
          endCall();
        },
      }, toolExec);

      liveClientRef.current = client;
      await client.start();
    } catch (e: any) {
      const msg = e?.message || 'Could not start the voice call.';
      setMessages((m) => [...m, { role: 'assistant', text: '🎙️ ' + msg }]);
      endCall();
    }
  }, [callState, endCall]);

  // Hang up if the widget unmounts.
  useEffect(() => () => { liveClientRef.current?.stop(); }, []);

  // Ring a "Talk to your sales" call shortly after the page opens (customers only).
  useEffect(() => {
    let role = '';
    try { role = JSON.parse(localStorage.getItem('redp_user') || '{}').role || ''; } catch { /* ignore */ }
    const customer = mode === 'public' || role === 'client';
    if (!customer) return;
    const timer = setTimeout(() => setIncomingCall(true), 1200);
    return () => clearTimeout(timer);
  }, [mode]);

  // Answer the call → open the assistant and greet out loud (live-call feel).
  const answerCall = useCallback(() => {
    setIncomingCall(false);
    setOpen(true);
    setVoiceOn(true);
    const g = mode === 'internal' ? T[lang].greetInternal : T[lang].greetPublic;
    setTimeout(() => speak(g), 350);
  }, [mode, lang, speak]);

  const declineCall = useCallback(() => setIncomingCall(false), []);

  const inCall = callState !== 'idle';
  // "Nour" (the hijab character) is shown for customers only: public visitors + logged-in clients.
  const userRole = (() => {
    try {
      return (JSON.parse(localStorage.getItem('redp_user') || '{}').role as string) || '';
    } catch {
      return '';
    }
  })();
  const isCustomer = mode === 'public' || userRole === 'client';
  const nourState: NourState = inCall
    ? callState === 'connecting'
      ? 'thinking'
      : callSpeaking
      ? 'speaking'
      : 'listening'
    : loading || videoGenerating
    ? 'thinking'
    : ttsSpeaking
    ? 'speaking'
    : listening
    ? 'listening'
    : 'idle';
  const t = T[lang];
  const ACCENT = '#6366f1';
  const ACCENT2 = '#8b5cf6';

  // ── Launcher + incoming "Talk to your sales" call popup ──
  if (!open) {
    return (
      <>
        <style>{`
          @keyframes redp-ring { 0%{box-shadow:0 0 0 0 rgba(99,102,241,0.55)} 70%{box-shadow:0 0 0 18px rgba(99,102,241,0)} 100%{box-shadow:0 0 0 0 rgba(99,102,241,0)} }
          @keyframes redp-rise { from{opacity:0;transform:translateY(16px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        `}</style>

        {/* Incoming video-call popup */}
        {isCustomer && incomingCall && (
          <div
            style={{
              position: 'fixed', bottom: '24px', left: '24px', zIndex: 9999,
              width: '320px', maxWidth: 'calc(100vw - 32px)', borderRadius: '20px', overflow: 'hidden',
              background: 'linear-gradient(160deg, #111827 0%, #1e1b4b 100%)',
              boxShadow: '0 26px 70px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#fff', animation: 'redp-rise 0.35s ease-out',
            }}
          >
            <div style={{ padding: '22px 20px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', letterSpacing: '0.12em', color: '#a5b4fc', fontWeight: 600 }}>
                {lang === 'ar' ? 'مكالمة فيديو واردة' : 'INCOMING VIDEO CALL'}
              </div>
              <div
                style={{
                  margin: '16px auto 12px', width: '96px', height: '96px', borderRadius: '50%', overflow: 'hidden',
                  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'redp-ring 1.6s infinite',
                }}
              >
                <NourAvatar state="idle" size={96} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>{lang === 'ar' ? 'نور' : 'Nour'}</div>
              <div style={{ fontSize: '14px', color: '#c7d2fe', marginTop: '4px' }}>
                {lang === 'ar' ? 'تحدّث مع فريق المبيعات' : 'Talk to your sales'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', padding: '0 20px 22px' }}>
              <button onClick={declineCall} aria-label="Decline call"
                style={{ width: '58px', height: '58px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(220,38,38,0.4)' }}>
                <PhoneOff style={{ width: 24, height: 24 }} />
              </button>
              <button onClick={answerCall} aria-label="Answer call"
                style={{ width: '58px', height: '58px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(22,163,74,0.45)' }}>
                <Video style={{ width: 24, height: 24 }} />
              </button>
            </div>
          </div>
        )}

        {/* Floating chat-icon launcher */}
        <button
          onClick={() => { setIncomingCall(false); setOpen(true); }}
          title={t.open}
          aria-label={t.open}
          style={{
            position: 'fixed', bottom: '24px', left: '24px', zIndex: 9998,
            width: '62px', height: '62px', borderRadius: '50%', border: 'none', cursor: 'pointer',
            overflow: 'hidden', padding: 0,
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, color: '#fff',
            display: incomingCall ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(99,102,241,0.45)',
          }}
        >
          <MessageCircle style={{ width: 26, height: 26 }} />
        </button>
      </>
    );
  }

  // ── Chat panel ──
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 9998,
        width: 'min(380px, calc(100vw - 32px))',
        height: 'min(560px, calc(100vh - 48px))',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '18px',
        overflow: 'hidden',
        background: 'rgba(17, 19, 32, 0.92)',
        backdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        color: '#e8eaf2',
        fontFamily: 'inherit',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
        }}
      >
        <div
          style={{
            width: 46, height: 46, borderRadius: isCustomer ? '0' : '50%', overflow: 'visible',
            background: isCustomer ? 'transparent' : 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          {isCustomer
            ? <NourAvatar state={nourState} amplitude={mouth.open} size={46} />
            : <MessageCircle style={{ width: 18, height: 18, color: '#fff' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
            {isCustomer ? (lang === 'ar' ? 'نور — مساعدتك العقارية' : 'Nour — Real Estate Assistant') : t.title}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.85)' }}>
            {listening ? t.listening : loading ? t.thinking : voiceOn ? t.voiceOn : t.voiceOff}
          </div>
        </div>

        <button onClick={() => setLang((l) => (l === 'en' ? 'ar' : 'en'))} title="Language"
          style={hdrBtn}>{lang === 'en' ? 'ع' : 'EN'}</button>
        {mode === 'internal' && (
          <button
            onClick={inCall ? endCall : startCall}
            title={inCall ? 'End voice call' : 'Start voice call'}
            style={{ ...hdrBtn, background: inCall ? '#ef4444' : 'rgba(255,255,255,0.18)' }}
          >
            {inCall ? <PhoneOff style={ic} /> : <Phone style={ic} />}
          </button>
        )}
        <button onClick={() => setVoiceOn((v) => !v)} title={voiceOn ? t.voiceOn : t.voiceOff} style={hdrBtn}>
          {voiceOn ? <Volume2 style={ic} /> : <VolumeX style={ic} />}
        </button>
        <button onClick={clearChat} title={t.clear} style={hdrBtn}><Trash2 style={ic} /></button>
        <button onClick={() => setOpen(false)} title={t.close} style={hdrBtn}><X style={ic} /></button>
      </div>

      {/* Customer hero — Nour's face */}
      {isCustomer && !inCall && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '14px 10px 8px', background: 'linear-gradient(180deg, rgba(109,92,224,0.12), transparent)' }}>
          <div style={{ width: 240, height: 240, borderRadius: 14, overflow: 'hidden' }}>
            {videoUrl ? (
              <video
                src={videoUrl}
                autoPlay
                playsInline
                onEnded={() => setVideoUrl(null)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <NourAvatarRPM state={nourState} mouth={mouth} size={240} />
            )}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#a5b4fc', fontWeight: 600 }}>
            {loading
              ? (lang === 'ar' ? 'نور تكتب…' : 'Nour is typing…')
              : ttsSpeaking
              ? (lang === 'ar' ? 'نور تتحدث…' : 'Nour is speaking…')
              : (lang === 'ar' ? 'نور • متصلة الآن' : 'Nour • online')}
          </div>
        </div>
      )}

      {/* Live call bar */}
      {inCall && (
        <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.14)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {isCustomer && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <div style={{ width: 240, height: 240 }}>
                <NourAvatarRPM state={nourState} mouth={mouth} size={240} />
              </div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: callState === 'live' ? '#22c55e' : '#f59e0b', animation: 'redp-pulse 1.2s infinite' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c7d2fe' }}>
              {callState === 'connecting'
                ? (lang === 'ar' ? 'جارٍ الاتصال…' : 'Connecting…')
                : callSpeaking
                ? (lang === 'ar' ? 'أيفا تتحدث…' : 'Aiva is speaking…')
                : (lang === 'ar' ? 'يستمع… تكلّم' : 'Listening… speak now')}
            </span>
            <button onClick={endCall} title="Hang up"
              style={{ marginInlineStart: 'auto', width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PhoneOff style={{ width: 15, height: 15 }} />
            </button>
          </div>
          {(userLive || botLive) && (
            <div style={{ fontSize: '0.78rem', lineHeight: 1.5, marginTop: '8px' }}>
              {userLive && <div dir={hasArabic(userLive) ? 'rtl' : 'ltr'} style={{ color: '#e8eaf2' }}><b>{lang === 'ar' ? 'أنت' : 'You'}:</b> {userLive}</div>}
              {botLive && <div dir={hasArabic(botLive) ? 'rtl' : 'ltr'} style={{ color: '#c7d2fe' }}><b>Aiva:</b> {botLive}</div>}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((m, i) => {
          const rtl = hasArabic(m.text);
          const mine = m.role === 'user';
          return (
            <div key={i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              <div
                dir={rtl ? 'rtl' : 'ltr'}
                style={{
                  maxWidth: '82%',
                  padding: '9px 12px',
                  borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background: mine ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : 'rgba(255,255,255,0.08)',
                  color: mine ? '#fff' : '#e8eaf2',
                  border: mine ? 'none' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.08)', display: 'flex', gap: '4px' }}>
              <span style={dot(0)} /><span style={dot(0.2)} /><span style={dot(0.4)} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={toggleMic}
          title="Voice"
          style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0, cursor: 'pointer', border: 'none',
            background: listening ? '#ef4444' : 'rgba(255,255,255,0.1)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: listening ? 'redp-pulse 1s infinite' : 'none',
          }}
        >
          <Mic style={{ width: 18, height: 18 }} />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder={t.placeholder}
          dir={hasArabic(input) ? 'rtl' : 'ltr'}
          style={{
            flex: 1, padding: '10px 12px', borderRadius: '22px', outline: 'none',
            border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)',
            color: '#fff', fontSize: '0.85rem',
          }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          title="Send"
          style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0, border: 'none',
            cursor: loading || !input.trim() ? 'default' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1,
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Send style={{ width: 17, height: 17 }} />
        </button>
      </div>

      <style>{`
        @keyframes redp-pulse { 0%{box-shadow:0 0 0 0 rgba(239,68,68,0.6)} 70%{box-shadow:0 0 0 10px rgba(239,68,68,0)} 100%{box-shadow:0 0 0 0 rgba(239,68,68,0)} }
        @keyframes redp-blink { 0%,80%,100%{opacity:0.3} 40%{opacity:1} }
      `}</style>
    </div>
  );
};

const hdrBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: '8px', border: 'none', cursor: 'pointer',
  background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: '0.72rem', fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
const ic: React.CSSProperties = { width: 15, height: 15 };
const dot = (delay: number): React.CSSProperties => ({
  width: 7, height: 7, borderRadius: '50%', background: '#9ca3af',
  display: 'inline-block', animation: `redp-blink 1.2s ${delay}s infinite`,
});

export default AiAssistant;
