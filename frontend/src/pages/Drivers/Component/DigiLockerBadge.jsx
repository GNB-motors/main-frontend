import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { buildDigiLockerBadge, formatVerifiedDate } from '../digilockerBadge';
import './DigiLockerBadge.css';

const TONE_ICON = {
  verified: ShieldCheck,
  partial: ShieldAlert,
  none: ShieldQuestion,
};

/**
 * DigiLocker verification badge.
 *
 * Shows an operator, at a glance, whether a driver's DL / RC came straight from
 * DigiLocker (i.e. the citizen consented on the issuer's side) rather than
 * being an uploaded photo.
 *
 * All the tone/derivation logic lives in ../digilockerBadge.js so it is unit
 * tested; this file is presentation only.
 */
const DigiLockerBadge = ({ status, enabled, showSandboxNotice = false }) => {
  const badge = buildDigiLockerBadge(status, { enabled });

  // The integration is off for this org — render nothing rather than a
  // permanent "Not verified" that operators would learn to ignore.
  if (!badge.visible) return null;

  const Icon = TONE_ICON[badge.tone] || ShieldQuestion;
  const verifiedDocs = badge.docs.filter((d) => d.verified);

  return (
    <span className={`dl-badge dl-badge--${badge.tone}`} title={badge.title}>
      <Icon size={13} strokeWidth={2.2} aria-hidden="true" />
      <span className="dl-badge__label">{badge.label}</span>

      {/* Per-document tooltip detail: verified-on date + expiry urgency. */}
      <span className="dl-badge__detail" role="tooltip">
        {badge.docs.map((d) => (
          <span key={d.key} className={`dl-badge__doc dl-badge__doc--${d.expiryTone}`}>
            <strong>{d.short}</strong>{' '}
            {d.verified
              ? `verified ${formatVerifiedDate(d.verifiedAt) || '—'}${
                  d.daysLeft === null
                    ? ''
                    : d.daysLeft < 0
                      ? ' · expired'
                      : ` · ${d.daysLeft}d left`
                }`
              : 'not verified'}
          </span>
        ))}
        {showSandboxNotice && badge.sandbox ? (
          <span className="dl-badge__sandbox">sandbox data</span>
        ) : null}
      </span>

      {/* Screen readers get the same information as the tooltip. */}
      <span className="sr-only">
        {verifiedDocs.length} of {badge.totalCount} documents verified with DigiLocker.
      </span>
    </span>
  );
};

export default DigiLockerBadge;
