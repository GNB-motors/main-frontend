import AiFleetIntelligenceVisual from './AiFleetIntelligenceVisual.jsx';

export default function AiFleetIntelligenceCard() {
  return (
    <article
      data-card
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '566px',
        borderRadius: '24px',
        background: 'linear-gradient(180deg, #182042 0%, #10152C 100%)',
        border: '1px solid rgba(129,150,255,.16)',
        overflow: 'hidden',
        boxShadow: '0 18px 50px rgba(3,6,18,.45)',
        transition:
          'transform 240ms cubic-bezier(.2,0,0,1), border-color 240ms cubic-bezier(.2,0,0,1), box-shadow 240ms cubic-bezier(.2,0,0,1)',
      }}
    >
      <div
        style={{
          position: 'relative',
          flex: '1',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #182042 0%, #10152C 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '0',
            background:
              'radial-gradient(420px 240px at 50% 0%, rgba(68,105,240,.22), transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '0',
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
            maskImage: 'radial-gradient(circle at 50% 40%, #000, transparent 78%)',
          }}
        />
        <AiFleetIntelligenceVisual />
      </div>
      <div
        data-card-body
        style={{
          minHeight: '176px',
          boxSizing: 'border-box',
          padding: '26px 28px 30px',
          borderTop: '1px solid rgba(255,255,255,.07)',
        }}
      >
        <div
          data-card-title
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: '500',
            fontSize: '22px',
            letterSpacing: '-.5px',
            color: '#FFFFFF',
          }}
        >
          AI fleet intelligence
        </div>
        <div
          data-card-desc
          style={{
            fontSize: '14.5px',
            lineHeight: '23px',
            color: 'rgba(255,255,255,.6)',
            marginTop: '10px',
            textWrap: 'pretty',
          }}
        >
          Turn fleet data into actionable insights, recommendations and opportunities to improve
          your business.
        </div>
      </div>
    </article>
  );
}
