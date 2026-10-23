import { Activity, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';

const TracePipeline = ({ traceData }) => (
  <div>
    <h4
      style={{
        margin: '0 0 14px 0',
        fontSize: 14,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <Activity size={16} color="#4f46e5" />
      Processing Pipeline Lifecycle
    </h4>
    <div className="wa-timeline">
      {traceData.pipeline.map((step) => (
        <div
          key={step.step}
          className={`wa-step ${
            step.status === 'ok'
              ? 'wa-step--ok'
              : step.status === 'failed'
                ? 'wa-step--failed'
                : step.status === 'running'
                  ? 'wa-step--running'
                  : ''
          }`}
        >
          <div className="wa-step__marker">
            {step.status === 'ok' && <CheckCircle2 size={12} />}
            {step.status === 'failed' && <XCircle size={12} />}
            {step.status === 'running' && <RefreshCw size={10} className="wa-spin" />}
          </div>
          <div className="wa-step__content">
            <div className="wa-step__title">
              <span>
                Step {step.step}: {step.name}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  color: step.status === 'failed' ? '#dc2626' : '#16a34a',
                }}
              >
                {step.status}
              </span>
            </div>
            <div className="wa-step__desc">{step.title}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default TracePipeline;
