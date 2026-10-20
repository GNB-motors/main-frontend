export default function AiStageSmartInsights() {
  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: '0',
        background: '#FFFFFF',
        border: '1px solid rgba(68,105,240,.34)',
        borderRadius: '16px',
        padding: '16px 12px 15px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: '#93939A',
          marginBottom: '10px',
        }}
      >
        04
      </div>
      <span
        style={{
          width: '38px',
          height: '38px',
          margin: '0 auto',
          borderRadius: '12px',
          background: 'rgba(68,105,240,.14)',
          display: 'grid',
          placeItems: 'center',
          color: '#4469F0',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flex: '0 0 auto' }}
        >
          <path d="M9.5 18h5" />
          <path d="M10.5 21h3" />
          <path d="M12 3a6 6 0 0 0-3.4 10.9c.5.4.8 1 .8 1.6h5.2c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z" />
        </svg>
      </span>
      <div
        style={{
          fontSize: '13px',
          fontWeight: '600',
          letterSpacing: '-.15px',
          color: '#050816',
          marginTop: '12px',
          lineHeight: '17px',
          overflowWrap: 'anywhere',
          hyphens: 'auto',
        }}
      >
        Smart insights
      </div>
      <div
        style={{
          fontSize: '11px',
          lineHeight: '16px',
          color: '#93939A',
          marginTop: '6px',
          overflowWrap: 'anywhere',
        }}
      >
        What changed and why
      </div>
    </div>
  );
}
