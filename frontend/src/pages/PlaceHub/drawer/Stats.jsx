export default function Stats({ items }) {
  return (
    <dl className="ph-stats">
      {items.filter(Boolean).map((s) => (
        <div key={s.label} className={s.tone ? `ph-stat ph-stat--${s.tone}` : 'ph-stat'}>
          <dt>{s.label}</dt>
          <dd>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
