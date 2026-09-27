/** Placeholder rows while a tab's first page loads. */
export default function PanelLoading({ rows = 5 }) {
  return (
    <div className="flex flex-col gap-2 p-4" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => `row-${i}`).map((id) => (
        <div key={id} className="cluster-inset h-10 animate-pulse" />
      ))}
    </div>
  );
}
