export default function FuelVarianceToolbar() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '6px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: '500',
          fontSize: '19px',
          letterSpacing: '-.4px',
        }}
      >
        Fuel variance
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
        38 trips reconciled
      </span>
      <span style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
        <span
          style={{
            fontSize: '11.5px',
            fontWeight: '500',
            padding: '6px 11px',
            borderRadius: '999px',
            background: 'var(--nova-rage-400)',
            color: '#FFFFFF',
          }}
        >
          Flagged · 3
        </span>
        <span
          style={{
            fontSize: '11.5px',
            fontWeight: '500',
            padding: '6px 11px',
            borderRadius: '999px',
            background: '#FFFFFF',
            border: '1px solid rgba(5,8,22,.11)',
            color: '#5D5D5E',
          }}
        >
          Within band
        </span>
        <span
          style={{
            fontSize: '11.5px',
            fontWeight: '500',
            padding: '6px 11px',
            borderRadius: '999px',
            background: '#FFFFFF',
            border: '1px solid rgba(5,8,22,.11)',
            color: '#5D5D5E',
          }}
        >
          All depots
        </span>
      </span>
    </div>
  );
}
