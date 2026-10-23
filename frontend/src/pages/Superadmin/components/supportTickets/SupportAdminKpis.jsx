import { PURGE_AFTER_DAYS } from '../../../../lib/supportTicket';

const KPIS = [
  {
    key: 'unread',
    label: 'Unread',
    hint: 'customer wrote, nobody has read it',
    filter: { unread: true, status: '' },
  },
  {
    key: 'open',
    label: 'Open',
    hint: 'waiting on support',
    filter: { status: 'OPEN', unread: false },
  },
  {
    key: 'awaitingCustomer',
    label: 'Awaiting customer',
    hint: 'we replied, waiting on them',
    filter: { status: 'AWAITING_CUSTOMER', unread: false },
  },
  {
    key: 'solved',
    label: 'Solved',
    hint: `conversation deleted ${PURGE_AFTER_DAYS} days after solving`,
    filter: { status: 'SOLVED', unread: false },
  },
  {
    key: 'all',
    label: 'All tickets',
    hint: 'in this period',
    filter: { status: '', unread: false },
  },
];

const isActive = (kpi, filters) =>
  kpi.filter.unread ? filters.unread : !filters.unread && filters.status === kpi.filter.status;

/** Counters across the top of the super-admin inbox; each one is a filter. */
export default function SupportAdminKpis({ summary, loading, filters, onSelect }) {
  return (
    <div className="sat-kpis">
      {KPIS.map((kpi) => {
        const value = summary?.[kpi.key];
        const active = filters.view === 'tickets' && isActive(kpi, filters);
        return (
          <button
            key={kpi.key}
            type="button"
            className={`sat-kpi sat-kpi--${kpi.key}${active ? ' sat-kpi--active' : ''}`}
            aria-pressed={active}
            onClick={() => onSelect(kpi.filter)}
          >
            <span className="sat-kpi-label">{kpi.label}</span>
            <span className="sat-kpi-value">{loading && value == null ? '—' : (value ?? 0)}</span>
            <span className="sat-kpi-hint">{kpi.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
