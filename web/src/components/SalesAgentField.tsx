import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { getReferral, clearReferral } from '../utils/referral';

// ─────────────────────────────────────────────────────────
// REDP — "Who is your sales agent?" field for the public EOI forms.
//
// Two ways a buyer gets credited to a broker:
//   1. They arrived on a broker's referral link / QR — the code was captured into
//      storage on page load and is prefilled here.
//   2. They walked into a showroom and the agent gave them a code verbally — they
//      type it, and we confirm the agent's name back to them before they submit.
//
// The code is confirmed against the server so a typo surfaces here, at a moment
// the buyer can still fix it, rather than silently landing the sale as "direct"
// and starting a commission dispute weeks later.
// ─────────────────────────────────────────────────────────

type Status = 'idle' | 'checking' | 'valid' | 'invalid';

interface ResolvedBroker {
  code: string;
  agent_name: string | null;
  agency_name: string | null;
}

interface Props {
  lang: 'en' | 'ar';
  value: string;
  onChange: (code: string) => void;
  /** Host forms style their fields differently — inline styles here, a CSS class there. */
  labelStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  inputClassName?: string;
}

const COPY = {
  en: {
    label: 'Sales Agent Code',
    optional: 'optional',
    placeholder: 'e.g. A7K2P9QX',
    hint: 'If an agent or broker is helping you, enter their code so they get credited.',
    fromLink: 'Filled in from your agent’s link.',
    checking: 'Checking code…',
    invalid: 'This code is not valid. Please double-check it with your agent.',
    notMine: 'Not my agent — clear',
    creditedTo: 'You will be credited to',
  },
  ar: {
    label: 'كود مندوب المبيعات',
    optional: 'اختياري',
    placeholder: 'مثال: A7K2P9QX',
    hint: 'لو فيه مندوب أو بروكر بيتعامل معاك، اكتب كوده عشان الحجز يتسجّل باسمه.',
    fromLink: 'اتملى تلقائياً من لينك المندوب بتاعك.',
    checking: 'جاري التحقق من الكود…',
    invalid: 'الكود ده مش صحيح. راجعه مع مندوبك.',
    notMine: 'مش ده مندوبي — امسح الكود',
    creditedTo: 'الحجز هيتسجّل باسم',
  },
};

const SalesAgentField: React.FC<Props> = ({
  lang,
  value,
  onChange,
  labelStyle,
  inputStyle,
  inputClassName,
}) => {
  const t = COPY[lang];

  const [status, setStatus] = useState<Status>('idle');
  const [broker, setBroker] = useState<ResolvedBroker | null>(null);
  const [fromLink, setFromLink] = useState(false);

  // Prefill from the referral captured when the buyer landed on the broker's link.
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current) return;
    prefilled.current = true;

    const referral = getReferral();
    if (referral && !value) {
      setFromLink(true);
      onChange(referral.code);
    }
  }, [value, onChange]);

  // Confirm the code with the server, debounced so we don't fire on every keystroke.
  useEffect(() => {
    const code = value.trim();

    if (!code) {
      setStatus('idle');
      setBroker(null);
      return;
    }

    setStatus('checking');
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/v1/public/broker/resolve', { params: { code } });
        if (cancelled) return;

        if (res.data?.success) {
          setBroker(res.data.data);
          setStatus('valid');
        } else {
          setBroker(null);
          setStatus('invalid');
        }
      } catch {
        if (cancelled) return;
        setBroker(null);
        setStatus('invalid');
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  const handleClear = () => {
    clearReferral();
    setFromLink(false);
    onChange('');
  };

  const borderColor =
    status === 'valid' ? '#1B7F5A' : status === 'invalid' ? '#C0392B' : 'rgba(0,61,166,0.12)';

  return (
    <div style={{ marginBottom: 24 }}>
      <label style={labelStyle}>
        {t.label}{' '}
        <span style={{ fontWeight: 400, opacity: 0.6, fontSize: '0.85em' }}>({t.optional})</span>
      </label>

      <input
        className={inputClassName}
        style={{ ...(inputStyle || {}), borderColor, textTransform: 'uppercase' }}
        type="text"
        placeholder={t.placeholder}
        value={value}
        onChange={e => {
          setFromLink(false);
          onChange(e.target.value.toUpperCase());
        }}
        onFocus={e => {
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,61,166,0.1)';
        }}
        onBlur={e => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      {status === 'idle' && (
        <p style={{ margin: '8px 2px 0', fontSize: '0.78rem', color: '#5c6c7f', lineHeight: 1.6 }}>
          {t.hint}
        </p>
      )}

      {status === 'checking' && (
        <p style={{ margin: '8px 2px 0', fontSize: '0.78rem', color: '#5c6c7f' }}>{t.checking}</p>
      )}

      {status === 'valid' && broker && (
        <div
          style={{
            margin: '10px 0 0',
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(27,127,90,0.08)',
            border: '1px solid rgba(27,127,90,0.25)',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#14684A', fontWeight: 700 }}>
            ✓ {t.creditedTo} {broker.agent_name || broker.code}
            {broker.agency_name ? ` — ${broker.agency_name}` : ''}
          </p>
          {fromLink && (
            <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#5c6c7f' }}>{t.fromLink}</p>
          )}
          <button
            type="button"
            onClick={handleClear}
            style={{
              marginTop: 6,
              padding: 0,
              background: 'none',
              border: 'none',
              color: '#5c6c7f',
              fontSize: '0.74rem',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            {t.notMine}
          </button>
        </div>
      )}

      {status === 'invalid' && (
        <p style={{ margin: '8px 2px 0', fontSize: '0.78rem', color: '#C0392B', fontWeight: 600 }}>
          {t.invalid}
        </p>
      )}
    </div>
  );
};

export default SalesAgentField;
