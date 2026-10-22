/**
 * DigiLocker verification badge — presentation logic.
 *
 * Split out of the component so it can be unit-tested with vitest (see
 * digilockerBadge.test.js) without mounting React or hitting the network.
 *
 * The backend contract (`GET /digilocker/status`) returns:
 *   {
 *     enabled: boolean, sandbox: boolean,
 *     verified:   { DL: boolean, RC: boolean },
 *     verifiedAt: { DL: iso|null,    RC: iso|null },
 *     expiryDate: { DL: iso|null,    RC: iso|null }
 *   }
 *
 * IMPORTANT: `verifiedAt` is only ever set server-side by the callback handler.
 * This module NEVER derives "verified" from the presence of an uploaded image —
 * an operator must be able to trust the badge.
 */

const DOC_META = {
  DL: { key: 'DL', label: 'Driving Licence', short: 'DL' },
  RC: { key: 'RC', label: 'Registration Certificate', short: 'RC' },
};

/** Days until expiry; negative when already expired, null when unknown. */
export function daysUntil(iso) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.ceil((then - Date.now()) / 86_400_000);
}

/** Expiry urgency bucket, matching the tone names used across the app. */
export function expiryTone(iso) {
  const d = daysUntil(iso);
  if (d === null) return 'unknown';
  if (d < 0) return 'expired';
  if (d <= 30) return 'expiring';
  return 'valid';
}

/**
 * Build the badge descriptor for one driver.
 *
 * @param {object|null} status  /digilocker/status payload for this driver.
 * @param {object} [opts]
 * @param {boolean} [opts.enabled]  overrides `status.enabled` when the parent
 *   already knows the integration is on (lets us render the badge for a driver
 *   whose status call failed).
 * @returns {{
 *   visible: boolean,
 *   tone: 'verified'|'partial'|'none'|'unavailable',
 *   label: string,
 *   title: string,
 *   docs: Array<{key:string,label:string,short:string,verified:boolean,verifiedAt:string|null,expiresAt:string|null,expiryTone:string,daysLeft:number|null}>,
 *   verifiedCount: number,
 *   totalCount: number,
 *   sandbox: boolean
 * }}
 */
export function buildDigiLockerBadge(status, opts = {}) {
  const enabled = opts.enabled ?? status?.enabled ?? false;
  const sandbox = Boolean(status?.sandbox);

  const docs = Object.keys(DOC_META).map((key) => {
    const meta = DOC_META[key];
    const verifiedAt = status?.verifiedAt?.[key] ?? null;
    const expiresAt = status?.expiryDate?.[key] ?? null;
    // A doc counts as verified only when the server sent a verifiedAt stamp.
    const verified = Boolean(status?.verified?.[key]) && Boolean(verifiedAt);
    return {
      key: meta.key,
      label: meta.label,
      short: meta.short,
      verified,
      verifiedAt,
      expiresAt,
      expiryTone: expiryTone(expiresAt),
      daysLeft: daysUntil(expiresAt),
    };
  });

  const verifiedCount = docs.filter((d) => d.verified).length;
  const totalCount = docs.length;

  if (!enabled) {
    return {
      visible: false,
      tone: 'unavailable',
      label: '',
      title: 'DigiLocker verification is not enabled for this organisation.',
      docs,
      verifiedCount: 0,
      totalCount,
      sandbox,
    };
  }

  if (verifiedCount === 0) {
    return {
      visible: true,
      tone: 'none',
      label: 'Not verified',
      title: 'This driver has not verified their documents with DigiLocker.',
      docs,
      verifiedCount,
      totalCount,
      sandbox,
    };
  }

  if (verifiedCount < totalCount) {
    return {
      visible: true,
      tone: 'partial',
      label: `DigiLocker ${verifiedCount}/${totalCount}`,
      title: `Verified with DigiLocker: ${docs
        .filter((d) => d.verified)
        .map((d) => d.label)
        .join(', ')}. Pending: ${docs
        .filter((d) => !d.verified)
        .map((d) => d.label)
        .join(', ')}.`,
      docs,
      verifiedCount,
      totalCount,
      sandbox,
    };
  }

  return {
    visible: true,
    tone: 'verified',
    label: 'DigiLocker verified',
    title: `Verified with DigiLocker: ${docs.map((d) => d.label).join(', ')}.`,
    docs,
    verifiedCount,
    totalCount,
    sandbox,
  };
}

/** Short "since" string for the tooltip, e.g. "12 Aug 2026". */
export function formatVerifiedDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Does this driver need a re-verification nudge? */
export function needsAttention(badge) {
  if (!badge?.visible) return false;
  if (badge.tone === 'partial' || badge.tone === 'none') return true;
  return badge.docs.some(
    (d) => d.verified && (d.expiryTone === 'expired' || d.expiryTone === 'expiring'),
  );
}
