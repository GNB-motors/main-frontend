const CARDS = [
  { key: 'open', status: 'OPEN', label: 'Open', hint: 'being worked on', dot: 'sp-dot--open' },
  {
    key: 'awaitingCustomer',
    status: 'AWAITING_CUSTOMER',
    label: 'Awaiting your reply',
    hint: 'support is waiting on you',
    dot: 'sp-dot--awaiting',
  },
  { key: 'solved', status: 'SOLVED', label: 'Solved', hint: 'resolved', dot: 'sp-dot--solved' },
  { key: 'all', status: '', label: 'All requests', hint: 'in this period', dot: 'sp-dot--all' },
];

/**
 * The four counters across the top of the portal. Each one is also the status
 * filter for the table below; the active one carries the brand border.
 */
export default function SupportStatCards({ summary, loading, activeStatus, onSelect }) {
  return (
    <div className="sp-stats">
      {CARDS.map((card) => {
        const active = activeStatus === card.status;
        const value = summary?.[card.key];
        return (
          <button
            key={card.key}
            type="button"
            className={`sp-stat${active ? ' sp-stat--active' : ''}`}
            aria-pressed={active}
            onClick={() => onSelect(card.status)}
          >
            <span className="sp-stat-label">
              <span className={`sp-dot ${card.dot}`} aria-hidden="true" />
              {card.label}
            </span>
            <span className="sp-stat-value">{loading && value == null ? '—' : (value ?? 0)}</span>
            <span className="sp-stat-hint">{card.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
