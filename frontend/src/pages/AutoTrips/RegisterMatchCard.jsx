import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { getUserRole } from '../../utils/session.js';
import AutoTripService from '../../services/AutoTripService';
import { formatNum } from '../../utils/formatters';
import { fmtDateRange } from './autoTripModel';
import './AutoTrips.css';

const CAN_SEE = ['OWNER', 'MANAGER', 'SUPER_ADMIN'];
const pct = (x) => (x == null ? '—' : `${Math.round(x * 100)}%`);

const SEGMENTS = [
  { key: 'found', label: 'Found here' },
  { key: 'missedLive', label: 'Missed while GPS was live' },
  { key: 'noGps', label: 'Missed, no GPS at the time' },
];

// Splits a plant's register trips into three parts that add up to `cycles`.
// A trip found without live GPS still counts as found, so "no GPS" is whatever
// is left once the found and the live-but-missed trips are taken out.
function breakdown(b) {
  const cycles = b.cycles ?? 0;
  const found = b.found ?? 0;
  const missedLive = Math.max((b.detectable ?? 0) - (b.foundDetectable ?? 0), 0);
  return { found, missedLive, noGps: Math.max(cycles - found - missedLive, 0) };
}

/**
 * How well the detected trips reproduce the org's own trip register (the oil
 * report), measured every night. "Seen by GPS" counts only the register trips
 * whose truck was sending GPS at the time, so a feed outage shows up as an
 * outage and not as a detection miss. Shows `empty` (nothing by default) for an
 * org with no register.
 */
export default function RegisterMatchCard({ defaultOpen = false, empty = null }) {
  const canSee = CAN_SEE.includes(getUserRole());
  const [open, setOpen] = useState(defaultOpen);
  const { data, loading } = useApi(
    (signal) => (canSee ? AutoTripService.registerMatch({ signal }) : Promise.resolve(null)),
    [canSee],
  );
  const r = data?.latest?.['autotrip-3'];
  if (!r?.totals?.cycles) return loading ? null : empty;
  const t = r.totals;
  const plants = Object.entries(r.byFrom || {}).slice(0, 8);
  const range = fmtDateRange(r.window?.from, r.window?.to);
  const gpsMissed = t.detectable != null && t.detectable < t.cycles;

  return (
    <div className="atx-scope atx-banner">
      <div className="atx-banner-row">
        <div className="atx-banner-msg">
          <ClipboardCheck size={18} strokeWidth={2} aria-hidden="true" />
          <p>
            <strong>{pct(t.recall)} of your trip register is found here</strong> (
            {formatNum(t.cycles)} trips{range ? `, ${range}` : ''}).
            {t.detectable != null
              ? ` GPS could track ${gpsMissed ? 'only ' : ''}${formatNum(t.detectable)} of those trips, and ${pct(t.recallDetectable)} of them matched.`
              : ''}
            {r.trips?.namedDropShare != null
              ? ` Unloading place is known for ${pct(r.trips.namedDropShare)} of trips.`
              : ''}
          </p>
        </div>
        {plants.length ? (
          <button
            type="button"
            className="atx-link"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Hide plant-wise' : 'See plant-wise →'}
          </button>
        ) : null}
      </div>

      {open ? <PlantChart plants={plants} /> : null}
    </div>
  );
}

function PlantChart({ plants }) {
  const max = Math.max(...plants.map(([, b]) => b.cycles ?? 0), 1);

  return (
    <div className="atx-banner-more atx-rm">
      <ul className="atx-rm-legend" aria-label="Legend">
        {SEGMENTS.map((s) => (
          <li key={s.key}>
            <span className={`atx-rm-swatch atx-rm--${s.key}`} aria-hidden="true" />
            {s.label}
          </li>
        ))}
      </ul>

      <div className="atx-rm-head" aria-hidden="true">
        <span>Plant in your register</span>
        <span>Found here</span>
        <span>While GPS was live</span>
      </div>

      <div className="atx-rm-rows">
        {plants.map(([label, b]) => {
          const parts = breakdown(b);
          return (
            <div key={label} className="atx-rm-row">
              <span className="atx-rm-label" title={label}>
                {label}
              </span>
              <span className="atx-rm-track" aria-hidden="true">
                <span className="atx-rm-bar" style={{ width: `${((b.cycles ?? 0) / max) * 100}%` }}>
                  {SEGMENTS.map((s) =>
                    parts[s.key] > 0 ? (
                      <span
                        key={s.key}
                        className={`atx-rm-seg atx-rm--${s.key}`}
                        style={{ flexGrow: parts[s.key] }}
                      />
                    ) : null,
                  )}
                </span>
              </span>
              <span className="atx-rm-val">
                <strong>{pct(b.recall)}</strong> {formatNum(b.found)}/{formatNum(b.cycles)}
              </span>
              <span className="atx-rm-val atx-rm-val--muted">
                <strong>{pct(b.recallDetectable)}</strong> {formatNum(b.foundDetectable)}/
                {formatNum(b.detectable)}
              </span>

              <span className="atx-rm-tip" aria-hidden="true">
                <span className="atx-rm-tip-title">
                  {label} · {formatNum(b.cycles)} trips
                </span>
                {SEGMENTS.map((s) => (
                  <span key={s.key} className="atx-rm-tip-line">
                    <span className={`atx-rm-swatch atx-rm--${s.key}`} />
                    <span>{s.label}</span>
                    <span className="atx-rm-tip-num">{formatNum(parts[s.key])}</span>
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
