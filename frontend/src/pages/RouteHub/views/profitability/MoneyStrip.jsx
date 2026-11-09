import { KpiRow } from '../../routeHubShared.jsx';

/** ₹ the API could not compute is unknown, never ₹0. */
const rupees = (n) =>
  typeof n === 'number' && Number.isFinite(n) ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—';

const WASTE = [
  ['theftLossInr', 'Theft', '#C2323A', 'rgba(229,104,107,.14)'],
  ['billFraudSuspectInr', 'Bill fraud', '#C2323A', 'rgba(229,104,107,.14)'],
  ['idlingWasteInr', 'Idling', '#C56200', 'rgba(240,170,72,.16)'],
  ['detourWasteInr', 'Detours', '#C56200', 'rgba(240,170,72,.16)'],
  ['fuelCostInr', 'Fuel', '#2F58EE', 'var(--nova-rage-a10)'],
  ['defCostInr', 'DEF', '#2F58EE', 'var(--nova-rage-a10)'],
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
      s: 'theft, fraud, idling and detours',
      c: '#C2323A',
      tint: 'rgba(229,104,107,.14)',
      vc: '#C2323A',
    },
    ...WASTE.map(([key, label, c, tint]) => ({
      ic: 'ledger',
      l: label,
      v: rupees(m[key]),
      s: 'estimated from telemetry',
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
