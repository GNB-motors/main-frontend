/** Placeholder cards while a list's first page loads. */
export default function PanelLoading({ rows = 5 }) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => `row-${i}`).map((id) => (
        <div key={id} className="pi-skel" />
      ))}
    </div>
  );
}
