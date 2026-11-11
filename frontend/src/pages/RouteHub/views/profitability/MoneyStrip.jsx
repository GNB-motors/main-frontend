import { KpiRow } from '../../routeHubShared.jsx';

/** ₹ the API could not compute is unknown, never ₹0. */
const rupees = (n) =>
  typeof n === 'number' && Number.isFinite(n) ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—';

// Each row carries its own honest sub-label. Theft and bill variance are
// REVIEW signals (a suspected loss to check), never a measured figure or an
// accusation; idling/detour/fuel/DEF are genuinely estimated from telemetry.
const WASTE = [
  [
    'theftLossInr',
    'Suspected fuel loss',
    '#C2323A',
    'rgba(229,104,107,.14)',
    'fuel gone while parked · review',
  ],
  [
    'billFraudSuspectInr',
    'Bill variance',
    '#C2323A',
    'rgba(229,104,107,.14)',
    'bill vs tank gap · review',
  ],
  ['idlingWasteInr', 'Idling', '#C56200', 'rgba(240,170,72,.16)', 'estimated from telemetry'],
  ['detourWasteInr', 'Detours', '#C56200', 'rgba(240,170,72,.16)', 'estimated from telemetry'],
  ['fuelCostInr', 'Fuel', '#2F58EE', 'var(--nova-rage-a10)', 'estimated from telemetry'],
  ['defCostInr', 'DEF', '#2F58EE', 'var(--nova-rage-a10)', 'estimated from telemetry'],
];

/**
 * The fleet's ₹ layer — the money lost in the window and where it went. Every
 * figure is the API's own number; nothing here is rounded to zero.
 */
export default function MoneyStrip({ money, loading }) {
  if (!money && !loading) return null;
  const m = money?.money || {};
  const items = [
    {
      ic: 'alert',
      l: 'Waste in the window',
      v: rupees(money?.totalWasteInr),
      s: 'suspected loss, idling, detours and fuel — review before acting',
      c: '#C2323A',
      tint: 'rgba(229,104,107,.14)',
      vc: '#C2323A',
    },
    ...WASTE.map(([key, label, c, tint, sub]) => ({
      ic: 'ledger',
      l: label,
      v: rupees(m[key]),
      s: sub,
      c,
      tint,
    })),
  ];
  return (
    <>
      <KpiRow items={items} loading={loading} />
      {money?.disclaimer ? <p className="hint">{money.disclaimer}</p> : null}
    </>
  );
}
