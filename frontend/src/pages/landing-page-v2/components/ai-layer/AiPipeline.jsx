import AiStageVehicleData from './AiStageVehicleData.jsx';
import AiStageDataStorage from './AiStageDataStorage.jsx';
import AiStageAnalysis from './AiStageAnalysis.jsx';
import AiStageSmartInsights from './AiStageSmartInsights.jsx';
import AiStageReports from './AiStageReports.jsx';
import AiStageRecommendations from './AiStageRecommendations.jsx';
import AiStageBusinessActions from './AiStageBusinessActions.jsx';

export default function AiPipeline() {
  return (
    <div
      data-reveal
      data-ai-pipe
      style={{ display: 'flex', alignItems: 'stretch', gap: '0', margin: '0 auto 22px' }}
    >
      <AiStageVehicleData />
      <div style={{ flex: '0 0 22px', display: 'grid', placeItems: 'center' }}>
        <svg viewBox="0 0 22 10" style={{ width: '22px', height: '10px', overflow: 'visible' }}>
          <path d="M1 5h20" stroke="rgba(68,105,240,.26)" strokeWidth="1.2" strokeLinecap="round" />
          <path
            d="M1 5h20"
            stroke="#4469F0"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="3 39"
            style={{ animation: 'ai-flow 2.4s linear infinite 0.00s' }}
          />
          <path
            d="M17.6 2.2 20.6 5l-3 2.8"
            fill="none"
            stroke="rgba(68,105,240,.4)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <AiStageDataStorage />
      <div style={{ flex: '0 0 22px', display: 'grid', placeItems: 'center' }}>
        <svg viewBox="0 0 22 10" style={{ width: '22px', height: '10px', overflow: 'visible' }}>
          <path d="M1 5h20" stroke="rgba(68,105,240,.26)" strokeWidth="1.2" strokeLinecap="round" />
          <path
            d="M1 5h20"
            stroke="#4469F0"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="3 39"
            style={{ animation: 'ai-flow 2.4s linear infinite 0.28s' }}
          />
          <path
            d="M17.6 2.2 20.6 5l-3 2.8"
            fill="none"
            stroke="rgba(68,105,240,.4)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <AiStageAnalysis />
      <div style={{ flex: '0 0 22px', display: 'grid', placeItems: 'center' }}>
        <svg viewBox="0 0 22 10" style={{ width: '22px', height: '10px', overflow: 'visible' }}>
          <path d="M1 5h20" stroke="rgba(68,105,240,.26)" strokeWidth="1.2" strokeLinecap="round" />
          <path
            d="M1 5h20"
            stroke="#4469F0"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="3 39"
            style={{ animation: 'ai-flow 2.4s linear infinite 0.56s' }}
          />
          <path
            d="M17.6 2.2 20.6 5l-3 2.8"
            fill="none"
            stroke="rgba(68,105,240,.4)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <AiStageSmartInsights />
      <div style={{ flex: '0 0 22px', display: 'grid', placeItems: 'center' }}>
        <svg viewBox="0 0 22 10" style={{ width: '22px', height: '10px', overflow: 'visible' }}>
          <path d="M1 5h20" stroke="rgba(68,105,240,.26)" strokeWidth="1.2" strokeLinecap="round" />
          <path
            d="M1 5h20"
            stroke="#4469F0"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="3 39"
            style={{ animation: 'ai-flow 2.4s linear infinite 0.84s' }}
          />
          <path
            d="M17.6 2.2 20.6 5l-3 2.8"
            fill="none"
            stroke="rgba(68,105,240,.4)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <AiStageReports />
      <div style={{ flex: '0 0 22px', display: 'grid', placeItems: 'center' }}>
        <svg viewBox="0 0 22 10" style={{ width: '22px', height: '10px', overflow: 'visible' }}>
          <path d="M1 5h20" stroke="rgba(68,105,240,.26)" strokeWidth="1.2" strokeLinecap="round" />
          <path
            d="M1 5h20"
            stroke="#4469F0"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="3 39"
            style={{ animation: 'ai-flow 2.4s linear infinite 1.12s' }}
          />
          <path
            d="M17.6 2.2 20.6 5l-3 2.8"
            fill="none"
            stroke="rgba(68,105,240,.4)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <AiStageRecommendations />
      <div style={{ flex: '0 0 22px', display: 'grid', placeItems: 'center' }}>
        <svg viewBox="0 0 22 10" style={{ width: '22px', height: '10px', overflow: 'visible' }}>
          <path d="M1 5h20" stroke="rgba(68,105,240,.26)" strokeWidth="1.2" strokeLinecap="round" />
          <path
            d="M1 5h20"
            stroke="#4469F0"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="3 39"
            style={{ animation: 'ai-flow 2.4s linear infinite 1.40s' }}
          />
          <path
            d="M17.6 2.2 20.6 5l-3 2.8"
            fill="none"
            stroke="rgba(68,105,240,.4)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <AiStageBusinessActions />
    </div>
  );
}
