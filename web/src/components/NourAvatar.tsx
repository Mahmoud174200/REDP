import React, { useEffect, useRef } from 'react';

/**
 * ─────────────────────────────────────────────────────────
 * REDP — "Nour" : the customer-facing AI character
 *
 * A fully-rigged SVG hijab girl. Every feature (eyes, eyelids, brows,
 * mouth, head, shoulders) is a separate layer animated in real time:
 *   • idle   — gentle breathing, sway, periodic blinking, soft smile
 *   • listening — attentive head tilt + raised brows
 *   • thinking  — glances up, slight tilt
 *   • speaking  — mouth lip-syncs to `amplitude` (0..1, her real voice),
 *                 with head bob and friendly expression
 *
 * Animation runs on a single requestAnimationFrame loop that writes SVG
 * attributes directly (no React re-renders per frame). Props are read
 * through a ref so changes take effect immediately.
 * ─────────────────────────────────────────────────────────
 */

export type NourState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Props {
  state: NourState;
  amplitude?: number; // 0..1 live speech loudness (drives the mouth)
  size?: number;
}

// Brand-matched palette
const HIJAB = '#6d5ce0';
const HIJAB_DARK = '#5a49c4';
const SKIN = '#f0c9a8';
const SKIN_SHADE = '#e3b592';
const CLOTH = '#4a3fb0';
const BG1 = '#eef0ff';
const BG2 = '#e6e2ff';

const NourAvatar: React.FC<Props> = ({ state, amplitude = 0, size = 120 }) => {
  const propsRef = useRef({ state, amplitude });
  propsRef.current = { state, amplitude };

  const headRef = useRef<SVGGeometryElement | null>(null);
  const mouthOpenRef = useRef<SVGEllipseElement | null>(null);
  const mouthSmileRef = useRef<SVGPathElement | null>(null);
  const lidLRef = useRef<SVGGElement | null>(null);
  const lidRRef = useRef<SVGGElement | null>(null);
  const browsRef = useRef<SVGGElement | null>(null);
  const pupilsRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    let nextBlink = start + 1500;
    let blinkUntil = 0;
    let mouth = 0; // smoothed openness
    let tilt = 0; // smoothed head tilt

    const loop = (now: number) => {
      const tSec = (now - start) / 1000;
      const { state: st, amplitude: amp } = propsRef.current;

      // ── Mouth (lip-sync) ──
      let target = 0;
      if (st === 'speaking') {
        // Use real amplitude if present, else self-oscillate so TTS still "talks".
        target = amp > 0.02 ? Math.min(1, amp * 1.6) : 0.35 + 0.35 * Math.abs(Math.sin(tSec * 11));
      } else {
        target = 0;
      }
      mouth += (target - mouth) * 0.35;
      if (mouthOpenRef.current) {
        mouthOpenRef.current.setAttribute('ry', String(0.6 + mouth * 8));
        mouthOpenRef.current.setAttribute('opacity', String(Math.min(1, mouth * 1.6)));
      }
      if (mouthSmileRef.current) {
        mouthSmileRef.current.setAttribute('opacity', String(1 - Math.min(1, mouth * 1.4)));
      }

      // ── Head tilt / bob (body language) ──
      let targetTilt = Math.sin(tSec * 0.8) * 1.5; // idle sway
      if (st === 'listening') targetTilt = -6 + Math.sin(tSec * 1.2) * 1.5;
      else if (st === 'thinking') targetTilt = 5;
      else if (st === 'speaking') targetTilt = Math.sin(tSec * 6) * 2.2;
      tilt += (targetTilt - tilt) * 0.08;
      if (headRef.current) {
        headRef.current.setAttribute('transform', `rotate(${tilt.toFixed(2)} 110 118)`);
      }

      // ── Eyebrows (expression) ──
      if (browsRef.current) {
        const up = st === 'listening' ? -4 : st === 'thinking' ? -2 : st === 'speaking' ? -1.5 : 0;
        browsRef.current.setAttribute('transform', `translate(0 ${up})`);
      }

      // ── Pupils (look direction) ──
      if (pupilsRef.current) {
        const lx = st === 'thinking' ? 2 : Math.sin(tSec * 0.5) * 1.2;
        const ly = st === 'thinking' ? -3 : 0;
        pupilsRef.current.setAttribute('transform', `translate(${lx.toFixed(2)} ${ly.toFixed(2)})`);
      }

      // ── Blinking ──
      if (now > nextBlink && !blinkUntil) blinkUntil = now + 130;
      let lid = 0; // 0 open, 1 closed
      if (blinkUntil) {
        if (now < blinkUntil) lid = 1;
        else {
          blinkUntil = 0;
          nextBlink = now + 2200 + Math.random() * 2600;
        }
      }
      const sy = 1 - lid; // scaleY of the open eye
      if (lidLRef.current) lidLRef.current.setAttribute('transform', `translate(86 104) scale(1 ${sy}) translate(-86 -104)`);
      if (lidRRef.current) lidRRef.current.setAttribute('transform', `translate(134 104) scale(1 ${sy}) translate(-134 -104)`);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg width={size} height={size} viewBox="0 0 220 240" style={{ display: 'block' }}>
      <defs>
        <radialGradient id="nourBg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor={BG1} />
          <stop offset="100%" stopColor={BG2} />
        </radialGradient>
        <linearGradient id="nourHijab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={HIJAB} />
          <stop offset="100%" stopColor={HIJAB_DARK} />
        </linearGradient>
        <clipPath id="nourClip"><circle cx="110" cy="118" r="104" /></clipPath>
      </defs>

      <g>
        {/* Shoulders / clothing */}
        <path d="M40 240 Q40 188 110 188 Q180 188 180 240 Z" fill={CLOTH} />
        {/* Hijab drape over shoulders */}
        <path d="M28 240 Q30 176 74 168 L146 168 Q190 176 192 240 Z" fill="url(#nourHijab)" />

        {/* Head group (animated: tilt/bob) */}
        <g ref={headRef as any}>
          {/* Hijab back (frames the face) */}
          <path
            d="M110 34
               C64 34 52 78 52 116
               C52 150 66 176 88 184
               L132 184
               C154 176 168 150 168 116
               C168 78 156 34 110 34 Z"
            fill="url(#nourHijab)"
          />
          {/* Neck */}
          <rect x="98" y="150" width="24" height="26" rx="10" fill={SKIN_SHADE} />
          {/* Face */}
          <ellipse cx="110" cy="118" rx="46" ry="52" fill={SKIN} />
          {/* Hijab front edge over cheeks/forehead (frame) */}
          <path
            d="M110 34 C70 34 60 72 62 108 C70 92 84 82 84 82 L136 82 C136 82 150 92 158 108 C160 72 150 34 110 34 Z"
            fill="url(#nourHijab)"
          />
          <path d="M62 108 C58 150 78 178 110 178 C142 178 162 150 158 108 C150 150 132 168 110 168 C88 168 70 150 62 108 Z" fill="url(#nourHijab)" opacity="0.0" />

          {/* Cheeks */}
          <circle cx="86" cy="132" r="8" fill="#f4a9a0" opacity="0.35" />
          <circle cx="134" cy="132" r="8" fill="#f4a9a0" opacity="0.35" />

          {/* Eyebrows */}
          <g ref={browsRef as any}>
            <path d="M74 94 Q86 88 98 93" stroke="#5a3d2b" strokeWidth="3.2" fill="none" strokeLinecap="round" />
            <path d="M122 93 Q134 88 146 94" stroke="#5a3d2b" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          </g>

          {/* Eyes (whites + pupils), with eyelids that scale to blink */}
          <g ref={lidLRef as any}>
            <ellipse cx="86" cy="104" rx="11" ry="8" fill="#ffffff" />
          </g>
          <g ref={lidRRef as any}>
            <ellipse cx="134" cy="104" rx="11" ry="8" fill="#ffffff" />
          </g>
          <g ref={pupilsRef as any}>
            <circle cx="86" cy="104" r="4.6" fill="#3a2c22" />
            <circle cx="134" cy="104" r="4.6" fill="#3a2c22" />
            <circle cx="87.4" cy="102.6" r="1.4" fill="#fff" />
            <circle cx="135.4" cy="102.6" r="1.4" fill="#fff" />
          </g>

          {/* Nose */}
          <path d="M110 112 Q113 124 108 128" stroke={SKIN_SHADE} strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Mouth: smile (default) + open ellipse (lip-sync) */}
          <path ref={mouthSmileRef as any} d="M98 144 Q110 154 122 144" stroke="#b5545a" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <ellipse ref={mouthOpenRef as any} cx="110" cy="146" rx="9" ry="1" fill="#8f3b46" opacity="0" />
        </g>
      </g>
    </svg>
  );
};

export default NourAvatar;
