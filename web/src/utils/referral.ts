// ─────────────────────────────────────────────────────────
// REDP — Broker referral capture.
//
// The backend already resolves attribution: PublicLandingController::submitEoi
// hands the request to AttributionService::resolveContext(), which reads `ref`,
// `qr` or `promo` and locks lead ownership to the first active broker it sees.
// This module is the missing half — the browser side that actually carries the
// code from the broker's link to the EOI submission.
//
// A buyer typically lands via /?ref=CODE, browses, and only submits an EOI on a
// later page. The code therefore has to outlive the URL that delivered it, so we
// persist it rather than reading the query string at submit time.
// ─────────────────────────────────────────────────────────

const STORAGE_KEY = 'redp_referral';

/** Matches the backend's REF cookie window so link and storage expire together. */
const TTL_DAYS = 90;

export type ReferralSource = 'ref' | 'qr' | 'promo';

export interface Referral {
  code: string;
  source: ReferralSource;
  capturedAt: number;
}

function isFresh(entry: Referral): boolean {
  const ageDays = (Date.now() - entry.capturedAt) / 86_400_000;
  return ageDays < TTL_DAYS;
}

/**
 * Read the stored referral, or null if absent, malformed, or expired.
 */
export function getReferral(): Referral | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const entry = JSON.parse(raw) as Referral;
    if (!entry?.code || !isFresh(entry)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

/**
 * Capture ?ref / ?qr / ?promo from the current URL, if present.
 *
 * An existing referral is NOT overwritten. The backend locks ownership to the
 * first broker to reach the lead, so honouring a later link here would only
 * produce a credit the server then refuses — better that the two agree.
 *
 * Call once, as early as possible, on any entry point into the SPA.
 */
export function captureReferralFromUrl(): Referral | null {
  const existing = getReferral();
  if (existing) return existing;

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return null;
  }

  const candidates: ReferralSource[] = ['ref', 'qr', 'promo'];

  for (const source of candidates) {
    const code = params.get(source)?.trim();
    if (!code) continue;

    const entry: Referral = { code, source, capturedAt: Date.now() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    } catch {
      // Private browsing with storage denied — the code still works for this
      // page load via the returned value; it just won't survive navigation.
    }
    return entry;
  }

  return null;
}

/**
 * Drop the stored referral. Used when the buyer says the prefilled agent is not
 * theirs, so a stale link cannot silently re-credit the wrong broker.
 */
export function clearReferral(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to do */
  }
}
