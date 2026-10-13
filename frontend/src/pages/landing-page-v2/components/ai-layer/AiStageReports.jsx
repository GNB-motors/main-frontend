export default function AiStageReports() {
  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: '0',
        background: '#FFFFFF',
        border: '1px solid rgba(68,105,240,.16)',
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
        05
      </div>
      <span
        style={{
          width: '38px',
          height: '38px',
          margin: '0 auto',
          borderRadius: '12px',
          background: 'rgba(68,105,240,.08)',
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
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 13v4M12 9v8M16 15v2" />
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
        Reports
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
        Generated and scheduled
      </div>
    </div>
  );
}
