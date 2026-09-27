import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Pencil, Loader2, ArrowRight } from 'lucide-react';
import TypeChips from './TypeChips';
import { aType, effectiveType, suggestion, typeLabel } from './placeIntelligenceModel';

/**
 * The manager's answer, shaped by what we already know:
 *  - the engine has a confident guess → one click "Yes, it's a fuel pump";
 *  - it has none → every type as a chip, no dropdown;
 *  - already answered → change it, or say it is not a place.
 * A declared warehouse is owned by the Warehouses page, so it links there.
 * Parent keys this by site id, so the open/name state resets per place.
 */
export default function ReviewActions({ site, answer }) {
  const busy = answer.busyId === site._id;
  const hint = suggestion({ site });
  const current = effectiveType(site).type;
  const [picking, setPicking] = useState(!hint && site.status === 'PROPOSED');
  const [name, setName] = useState('');
  const pick = (t) => answer.accept(site, t, name.trim() || undefined);

  if (site.status === 'CONFIRMED' && site.legacy?.vehicleWarehouseId) {
    return (
      <div className="pi-answer">
        <p className="pi-answer-q">This is one of your declared warehouses.</p>
        <Link to="/warehouses" className="pi-link">
          Change its boundary or trucks on the Warehouses page <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  const question =
    site.status === 'CONFIRMED'
      ? `Confirmed as ${typeLabel(current).toLowerCase()}.`
      : site.status === 'REJECTED'
        ? 'You said this is not a real place.'
        : hint
          ? `Is this ${aType(hint.siteType)}?`
          : 'What is this place?';

  return (
    <div className="pi-answer">
      <p className="pi-answer-q">{question}</p>
      {site.status === 'PROPOSED' ? (
        <div className="pi-answer-row" style={{ marginBottom: 10 }}>
          <input
            className="pi-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Give it a name (optional)"
            aria-label="Place name"
            maxLength={200}
          />
        </div>
      ) : null}
      <div className="pi-answer-row">
        {site.status === 'PROPOSED' && hint ? (
          <button
            type="button"
            className="pi-btn-yes"
            disabled={busy}
            onClick={() => pick(hint.siteType)}
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Yes, it’s {aType(hint.siteType)}
          </button>
        ) : null}
        {site.status !== 'PROPOSED' || hint ? (
          <button
            type="button"
            className="pshell-btn"
            disabled={busy}
            onClick={() => setPicking(!picking)}
            aria-expanded={picking}
          >
            <Pencil size={14} />
            {site.status === 'PROPOSED'
              ? 'Something else'
              : site.status === 'REJECTED'
                ? 'Actually, it is…'
                : 'Change type'}
          </button>
        ) : null}
        {site.status !== 'REJECTED' ? (
          <button
            type="button"
            className="pi-btn-quiet"
            disabled={busy}
            onClick={() => answer.reject(site)}
            title="A GPS blip, a traffic jam or somewhere trucks never really stop"
          >
            <X size={14} /> Not a real place
          </button>
        ) : null}
      </div>
      {picking ? <TypeChips current={current} disabled={busy} onPick={pick} /> : null}
      {site.status === 'PROPOSED' ? (
        <p className="pi-note">
          Your answer is the strongest evidence there is — the system learns from it and will stop
          asking about this place.
        </p>
      ) : null}
    </div>
  );
}
