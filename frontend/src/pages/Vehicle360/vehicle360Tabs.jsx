/** Section tabs for Vehicle 360 (split out of vehicle360Header.jsx to keep it under 400 lines). */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="v360-tabs" role="tablist" aria-label="Vehicle sections">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          className={`v360-tab ${active === t.id ? 'v360-tab--on' : ''}`.trim()}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count != null ? <span className="v360-tab-count">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
