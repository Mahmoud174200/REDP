/**
 * ─────────────────────────────────────────────────────────
 * REDP — Viseme engine
 *
 * Turns text into a stream of mouth shapes ("visemes") and plays them over
 * time, so the character's mouth forms the actual shapes of the words:
 *   open "a", wide "e", round "o/u", closed "m/b/p", teeth "f/v" …
 *
 * Each viseme maps to three mouth parameters the 3D avatar consumes:
 *   open  (0..1)  — jaw drop
 *   wide  (0..1)  — horizontal spread (smile/eee)
 *   round (0..1)  — lip rounding (ooo)
 * ─────────────────────────────────────────────────────────
 */

export interface MouthShape {
  open: number;
  wide: number;
  round: number;
}

export const REST: MouthShape = { open: 0.06, wide: 0.4, round: 0 };

const SHAPES: Record<string, MouthShape> = {
  A: { open: 0.95, wide: 0.55, round: 0 }, // aa / آ
  E: { open: 0.4, wide: 0.95, round: 0 }, // eh / eee
  I: { open: 0.28, wide: 0.85, round: 0 }, // ih
  O: { open: 0.65, wide: 0.15, round: 0.9 }, // oh
  U: { open: 0.35, wide: 0.05, round: 1 }, // oo / و
  M: { open: 0.0, wide: 0.5, round: 0.05 }, // m/b/p closed
  F: { open: 0.16, wide: 0.6, round: 0 }, // f/v teeth-on-lip
  L: { open: 0.5, wide: 0.55, round: 0 }, // l/n/d tongue
  S: { open: 0.16, wide: 0.75, round: 0 }, // s/z/sh narrow
  C: { open: 0.35, wide: 0.5, round: 0.1 }, // generic consonant
  REST,
};

/** Map a single character (Latin or Arabic) to a viseme key. */
function charToViseme(c: string): keyof typeof SHAPES | null {
  const l = c.toLowerCase();
  if (/\s/.test(l)) return 'REST';
  // Latin vowels
  if ('aàáâä'.includes(l)) return 'A';
  if ('eéèê'.includes(l)) return 'E';
  if ('iíìî'.includes(l) || l === 'y') return 'I';
  if ('oóòô'.includes(l)) return 'O';
  if ('uúùû'.includes(l) || l === 'w') return 'U';
  if ('mbp'.includes(l)) return 'M';
  if ('fv'.includes(l)) return 'F';
  if ('lndrt'.includes(l)) return 'L';
  if ('szxcjgh'.includes(l)) return 'S';
  // Arabic vowels / long vowels
  if ('اأإآىَ'.includes(c)) return 'A';
  if ('ويُ'.includes(c)) return 'U';
  if ('يِ'.includes(c)) return 'I';
  if ('مبپ'.includes(c)) return 'M';
  if ('فڤ'.includes(c)) return 'F';
  if ('لنردت'.includes(c)) return 'L';
  if ('سزصشثذجحخهعغق'.includes(c)) return 'S';
  if (/[a-z؀-ۿ]/.test(c)) return 'C';
  return null;
}

/** Convert text to a compact viseme sequence (drops repeats/unknowns). */
export function textToVisemes(text: string): MouthShape[] {
  const out: MouthShape[] = [];
  let prev = '';
  for (const c of text) {
    const key = charToViseme(c);
    if (!key) continue;
    if (key === prev && key !== 'REST') continue; // collapse doubles
    prev = key;
    out.push(SHAPES[key]);
  }
  return out;
}

/**
 * Plays a text as a timed stream of mouth shapes.
 * onFrame receives the interpolated MouthShape ~60fps.
 */
export class VisemePlayer {
  private raf = 0;
  private onFrame: (m: MouthShape) => void;
  private cur: MouthShape = { ...REST };

  constructor(onFrame: (m: MouthShape) => void) {
    this.onFrame = onFrame;
  }

  play(text: string, durationMs?: number) {
    this.stop();
    const seq = textToVisemes(text);
    if (seq.length === 0) {
      this.onFrame(REST);
      return;
    }
    // ~11 visemes/sec, or fit the estimated speech duration if given.
    const per = durationMs ? Math.max(55, durationMs / seq.length) : 90;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const idx = Math.floor(elapsed / per);
      if (idx >= seq.length) {
        this.settleToRest();
        return;
      }
      const target = seq[idx];
      // ease current → target for smooth motion
      this.cur = {
        open: this.cur.open + (target.open - this.cur.open) * 0.4,
        wide: this.cur.wide + (target.wide - this.cur.wide) * 0.4,
        round: this.cur.round + (target.round - this.cur.round) * 0.4,
      };
      this.onFrame(this.cur);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private settleToRest() {
    const tick = (now: number) => {
      this.cur = {
        open: this.cur.open + (REST.open - this.cur.open) * 0.25,
        wide: this.cur.wide + (REST.wide - this.cur.wide) * 0.25,
        round: this.cur.round + (REST.round - this.cur.round) * 0.25,
      };
      this.onFrame(this.cur);
      if (Math.abs(this.cur.open - REST.open) > 0.02) {
        this.raf = requestAnimationFrame(tick);
      }
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }
}

/** Estimate how long TTS will take to speak a string (ms). */
export function estimateSpeechMs(text: string): number {
  const words = Math.max(1, text.trim().split(/\s+/).length);
  return (words / 2.7) * 1000; // ~2.7 words/sec
}
