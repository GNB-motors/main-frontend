import NdCardSkeleton from './NdCardSkeleton.jsx';

export default function NdMorningBriefSkeleton() {
  return (
    <section className="nd-brief">
      <div className="nd-eyebrow">Morning brief</div>
      <div className="nd-cols nd-cols--half">
        {['Excess idling', 'Fuel over expected'].map((title) => (
          <NdCardSkeleton
            key={title}
            title={title}
            hint="Today · top 5 vehicles"
            big
            rows={3}
            rowHeight={36}
          />
        ))}
      </div>
    </section>
  );
}
