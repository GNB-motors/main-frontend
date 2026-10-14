import DriverRiskSignals from './DriverRiskSignals.jsx';

export default function DriverRiskModel() {
  return (
    <div
      data-scroll-m
      data-reveal
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(68,105,240,.18)',
        borderRadius: '22px',
        padding: '28px 30px 30px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '26px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-eyebrow)',
            fontSize: '10px',
            fontWeight: '500',
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: 'var(--nova-rage-600)',
          }}
        >
          Driver risk model · signals in, score out
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#93939A' }}>
          R. Kumar · 90-day window
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 62px 1.05fr 62px 1fr',
          alignItems: 'center',
          gap: '0',
          minWidth: '680px',
        }}
      >
        <DriverRiskSignals />
        <svg
          viewBox="0 0 60 200"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '190px' }}
        >
          <path
            d="M2 30 C30 30 34 100 58 100"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="rgba(68,105,240,.24)"
            strokeWidth="1.2"
          />
          <path
            d="M2 30 C30 30 34 100 58 100"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="#4469F0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="4 96"
            style={{ animation: 'ai-flow 2.6s linear infinite 0s' }}
          />
          <path
            d="M2 77 C30 77 34 100 58 100"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="rgba(68,105,240,.24)"
            strokeWidth="1.2"
          />
          <path
            d="M2 77 C30 77 34 100 58 100"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="#4469F0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="4 96"
            style={{ animation: 'ai-flow 2.6s linear infinite 0.4s' }}
          />
          <path
            d="M2 123 C30 123 34 100 58 100"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="rgba(68,105,240,.24)"
            strokeWidth="1.2"
          />
          <path
            d="M2 123 C30 123 34 100 58 100"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="#4469F0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="4 96"
            style={{ animation: 'ai-flow 2.6s linear infinite 0.8s' }}
          />
          <path
            d="M2 170 C30 170 34 100 58 100"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="rgba(68,105,240,.24)"
            strokeWidth="1.2"
          />
          <path
            d="M2 170 C30 170 34 100 58 100"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="#4469F0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="4 96"
            style={{ animation: 'ai-flow 2.6s linear infinite 1.2s' }}
          />
        </svg>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            padding: '22px 18px',
            borderRadius: '18px',
            background: 'rgba(68,105,240,.06)',
            border: '1px solid rgba(68,105,240,.2)',
          }}
        >
          <svg viewBox="0 0 200 112" style={{ width: '190px', height: '106px' }}>
            <path
              d="M18 100 A82 82 0 0 1 182 100"
              fill="none"
              stroke="rgba(5,8,22,.09)"
              strokeWidth="13"
              strokeLinecap="round"
            />
            <path
              d="M18 100 A82 82 0 0 1 182 100"
              fill="none"
              stroke="#4469F0"
              strokeWidth="13"
              strokeLinecap="round"
              strokeDasharray="300"
              style={{ animation: 'ai-arc 1.4s cubic-bezier(.2,0,0,1) both .3s' }}
            />
            <text
              x="100"
              y="84"
              textAnchor="middle"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                fontSize: '40px',
                letterSpacing: '-1.5px',
                fill: '#050816',
              }}
            >
              68
            </text>
            <text
              x="100"
              y="104"
              textAnchor="middle"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fill: '#93939A' }}
            >
              risk score
            </text>
          </svg>
          <div
            style={{
              fontSize: '12.5px',
              lineHeight: '19px',
              color: '#5D5D5E',
              textAlign: 'center',
            }}
          >
            Above the 60 threshold. Fatigue is the largest single contributor this week.
          </div>
        </div>
        <svg
          viewBox="0 0 60 200"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '190px' }}
        >
          <path
            d="M2 100 C26 100 30 40 58 40"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="rgba(68,105,240,.24)"
            strokeWidth="1.2"
          />
          <path
            d="M2 100 C26 100 30 40 58 40"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="#4469F0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="4 96"
            style={{ animation: 'ai-flow 2.6s linear infinite 0.2s' }}
          />
          <path
            d="M2 100 L58 100"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="rgba(68,105,240,.24)"
            strokeWidth="1.2"
          />
          <path
            d="M2 100 L58 100"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="#4469F0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="4 96"
            style={{ animation: 'ai-flow 2.6s linear infinite 0.6s' }}
          />
          <path
            d="M2 100 C26 100 30 160 58 160"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="rgba(68,105,240,.24)"
            strokeWidth="1.2"
          />
          <path
            d="M2 100 C26 100 30 160 58 160"
            fill="none"
            vectorEffect="non-scaling-stroke"
            stroke="#4469F0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="4 96"
            style={{ animation: 'ai-flow 2.6s linear infinite 1s' }}
          />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              padding: '15px 17px',
              borderRadius: '14px',
              background: '#FFFFFF',
              border: '1px solid rgba(229,104,107,.28)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: '600',
                letterSpacing: '-.1px',
                color: '#050816',
              }}
            >
              Fatigue alert
            </div>
            <div
              style={{
                fontSize: '12px',
                lineHeight: '18px',
                color: '#5D5D5E',
                marginTop: '5px',
              }}
            >
              Supervisor notified before the Friday night run.
            </div>
          </div>
          <div
            style={{
              padding: '15px 17px',
              borderRadius: '14px',
              background: '#FFFFFF',
              border: '1px solid rgba(68,105,240,.2)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: '600',
                letterSpacing: '-.1px',
                color: '#050816',
              }}
            >
              Coaching note
            </div>
            <div
              style={{
                fontSize: '12px',
                lineHeight: '18px',
                color: '#5D5D5E',
                marginTop: '5px',
              }}
            >
              Braking pattern on descents, drafted and assigned.
            </div>
          </div>
          <div
            style={{
              padding: '15px 17px',
              borderRadius: '14px',
              background: '#FFFFFF',
              border: '1px solid rgba(68,105,240,.2)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: '600',
                letterSpacing: '-.1px',
                color: '#050816',
              }}
            >
              Roster change
            </div>
            <div
              style={{
                fontSize: '12px',
                lineHeight: '18px',
                color: '#5D5D5E',
                marginTop: '5px',
              }}
            >
              Surat night run reassigned to S. Yadav.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
