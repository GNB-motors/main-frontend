export default function ListSkeleton() {
  return (
    <div className="ph-list" aria-busy="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="ph-row ph-row--ghost">
          <span className="ph-shimmer ph-ghost-tile" />
          <span className="ph-ghost-lines">
            <span className="ph-shimmer" />
            <span className="ph-shimmer" />
          </span>
        </div>
      ))}
    </div>
  );
}
