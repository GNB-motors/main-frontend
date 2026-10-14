export default function SoonPill() {
  return (
    <span
      style={{
        marginLeft: 8,
        fontFamily: 'var(--font-eyebrow)',
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: '.12em',
        textTransform: 'uppercase',
        color: 'var(--nova-rage-600)',
        background: 'rgba(68,105,240,.10)',
        border: '1px solid rgba(68,105,240,.22)',
        borderRadius: 999,
        padding: '2px 7px',
        whiteSpace: 'nowrap',
      }}
    >
      Soon
    </span>
  );
}
