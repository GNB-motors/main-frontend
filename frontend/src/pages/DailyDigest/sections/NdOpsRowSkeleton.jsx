// Same three cards NdOpsRow renders, including their accent colour, so the
// row does not change width or tint when the numbers arrive.
const OPS_SKELETON_CARDS = [
  { title: 'Idling waste', c: '#C56200' },
  { title: 'Detour waste', c: '#2F58EE' },
  { title: 'Fuel efficiency', c: '#187A32' },
];

export default function NdOpsRowSkeleton() {
  return (
    <section className="nd-ops">
      {OPS_SKELETON_CARDS.map((card) => (
        <div key={card.title} className="nd-card nd-opcard" style={{ '--c': card.c }}>
          <div className="nd-card-head">
            <h2>{card.title}</h2>
            <span className="nd-sp" />
          </div>
          <div style={{ padding: '0 var(--space-4) var(--space-4)' }}>
            <span className="nd-sk" style={{ width: '50%', height: 30 }} />
            <span className="nd-sk" style={{ width: '70%', height: 11, marginTop: 10 }} />
          </div>
        </div>
      ))}
    </section>
  );
}
