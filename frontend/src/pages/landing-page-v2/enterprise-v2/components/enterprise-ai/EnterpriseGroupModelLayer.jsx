export default function EnterpriseGroupModelLayer() {
  return (
    <div
      style={{
        padding: '22px 24px',
        borderRadius: '18px',
        background: 'linear-gradient(150deg, rgba(68,105,240,.1), rgba(68,105,240,.04))',
        border: '1px solid rgba(68,105,240,.28)',
        animation: 'ai-band 3.6s cubic-bezier(.2,0,0,1) infinite',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
          <span
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(150deg,#4469F0,#213EA7)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
              <path d="M18 16.6l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" />
            </svg>
          </span>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: '500',
                fontSize: '19px',
                letterSpacing: '-.4px',
              }}
            >
              Group model layer
            </div>
            <div style={{ fontSize: '12.5px', color: '#5D5D5E', marginTop: '3px' }}>
              Trained on group data, scoped per entity
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 13px',
              borderRadius: '999px',
              background: '#FFFFFF',
              border: '1px solid rgba(68,105,240,.2)',
              fontSize: '12px',
              fontWeight: '500',
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4469F0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" />
            </svg>
            Data residency
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 13px',
              borderRadius: '999px',
              background: '#FFFFFF',
              border: '1px solid rgba(68,105,240,.2)',
              fontSize: '12px',
              fontWeight: '500',
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4469F0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" />
            </svg>
            Role-based access
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 13px',
              borderRadius: '999px',
              background: '#FFFFFF',
              border: '1px solid rgba(68,105,240,.2)',
              fontSize: '12px',
              fontWeight: '500',
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4469F0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" />
            </svg>
            Full audit trail
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 13px',
              borderRadius: '999px',
              background: '#FFFFFF',
              border: '1px solid rgba(68,105,240,.2)',
              fontSize: '12px',
              fontWeight: '500',
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4469F0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" />
            </svg>
            Model versioning
          </span>
        </div>
      </div>
    </div>
  );
}
