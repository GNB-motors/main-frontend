export default function TripAiDelayCallout() {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: '100%',
        transform: 'translateX(-50%)',
        marginBottom: '16px',
        width: '210px',
      }}
    >
      <div
        style={{
          padding: '13px 15px',
          borderRadius: '14px',
          background: '#FFFFFF',
          border: '1px solid rgba(68,105,240,.26)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '9px',
            fontWeight: '500',
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'var(--nova-rage-600)',
            marginBottom: '7px',
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '999px',
              background: 'var(--nova-rage-400)',
              animation: 'ai-blip 2.2s ease-in-out infinite',
            }}
          />
          AI
        </div>
        <div style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '-.1px' }}>
          Predicts the delay
        </div>
        <div
          style={{
            fontSize: '11.5px',
            lineHeight: '17px',
            color: '#5D5D5E',
            marginTop: '4px',
          }}
        >
          Arrival slipping 42 min. Client notified automatically.
        </div>
      </div>
      <div
        style={{
          width: '1px',
          height: '16px',
          background: 'rgba(68,105,240,.3)',
          margin: '0 auto',
        }}
      />
    </div>
  );
}
