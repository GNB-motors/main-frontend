// Faithful stand-in for the design's <image-slot> placeholder (empty state).
// Swap for a real <img> when photos are ready.
export default function ImageSlot({ placeholder = 'Image' }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center', padding: '12px', boxSizing: 'border-box', background: 'rgba(127,127,127,.08)', color: '#050816', font: '13px/1.3 var(--font-ui), system-ui, sans-serif' }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45 }}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      <div style={{ maxWidth: '90%', fontWeight: 500, letterSpacing: '.01em', opacity: 0.75 }}>{placeholder}</div>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', border: '1.5px dashed currentColor', opacity: 0.35 }} />
    </div>
  );
}
