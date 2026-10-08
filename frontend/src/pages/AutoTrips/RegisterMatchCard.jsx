import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { getUserRole } from '../../utils/session.js';
import AutoTripService from '../../services/AutoTripService';
import { formatNum } from '../../utils/formatters';
import { fmtDateRange } from './autoTripModel';

const CAN_SEE = ['OWNER', 'MANAGER', 'SUPER_ADMIN'];
const pct = (x) => (x == null ? '—' : `${Math.round(x * 100)}%`);

/**
 * How well the detected trips reproduce the org's own trip register (the oil
 * report), measured every night. "Seen by GPS" counts only the register trips
 * whose truck was sending GPS at the time, so a feed outage shows up as an
 * outage and not as a detection miss. Hidden for orgs with no register.
 */
export default function RegisterMatchCard() {
  const canSee = CAN_SEE.includes(getUserRole());
  const [open, setOpen] = useState(false);
  const { data } = useApi(
    (signal) => (canSee ? AutoTripService.registerMatch({ signal }) : Promise.resolve(null)),
    [canSee],
  );
  const r = data?.latest?.['autotrip-3'];
  if (!r?.totals?.cycles) return null;
  const t = r.totals;
  const plants = Object.entries(r.byFrom || {}).slice(0, 8);
  const range = fmtDateRange(r.window?.from, r.window?.to);
  const gpsMissed = t.detectable != null && t.detectable < t.cycles;

  return (
    <div className="atx-banner">
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

      {open ? (
        <div className="atx-banner-more">
          <table className="atx-mini-table">
            <thead>
              <tr>
                <th>Plant in your register</th>
                <th className="num">Trips</th>
                <th className="num">Found here</th>
                <th className="num">Found while GPS was live</th>
              </tr>
            </thead>
            <tbody>
              {plants.map(([label, b]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td className="num">{formatNum(b.cycles)}</td>
                  <td className="num">
                    {formatNum(b.found)} ({pct(b.recall)})
                  </td>
                  <td className="num">
                    {formatNum(b.foundDetectable)}/{formatNum(b.detectable)} (
                    {pct(b.recallDetectable)})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
