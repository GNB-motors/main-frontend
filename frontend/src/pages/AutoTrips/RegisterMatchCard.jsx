import { useState } from 'react';
import { ChevronDown, ChevronRight, ClipboardCheck } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useApi } from '../../hooks/useApi';
import { getUserRole } from '../../utils/session.js';
import AutoTripService from '../../services/AutoTripService';

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
  const from = r.window?.from ? new Date(r.window.from).toLocaleDateString('en-IN') : '';
  const to = r.window?.to ? new Date(r.window.to).toLocaleDateString('en-IN') : '';

  return (
    <div
      style={{
        padding: '8px 12px',
        marginBottom: 12,
        borderRadius: 8,
        background: 'var(--muted, #f6f7f9)',
        fontSize: 13,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ClipboardCheck size={16} aria-hidden="true" />
        <span style={{ flex: 1 }}>
          Matches your trip register: <strong>{pct(t.recall)}</strong> of {t.cycles} trips (
          {pct(t.recallDetectable)} of the {t.detectable} the GPS could see), {from} – {to}.{' '}
          {r.trips?.namedDropShare != null ? `${pct(r.trips.namedDropShare)} of drops named.` : ''}
        </span>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {open ? 'Hide' : 'By plant'}
        </Button>
      </div>
      {open ? (
        <table style={{ marginTop: 8, width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th>Register plant</th>
              <th style={{ textAlign: 'right' }}>Trips</th>
              <th style={{ textAlign: 'right' }}>Found</th>
              <th style={{ textAlign: 'right' }}>Found where GPS was live</th>
            </tr>
          </thead>
          <tbody>
            {plants.map(([label, b]) => (
              <tr key={label}>
                <td>{label}</td>
                <td style={{ textAlign: 'right' }}>{b.cycles}</td>
                <td style={{ textAlign: 'right' }}>
                  {b.found} ({pct(b.recall)})
                </td>
                <td style={{ textAlign: 'right' }}>
                  {b.foundDetectable}/{b.detectable} ({pct(b.recallDetectable)})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
