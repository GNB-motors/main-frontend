import { Link } from 'react-router-dom';
import { Wrench, FileWarning, Activity, Fuel } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import EmptyState from '../../components/cluster/EmptyState';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import { formatINR, formatKm, formatLitres, formatNum } from '../../utils/formatters';
import { formatDateIST } from '../../utils/dateUtils';
import { Panel, KV } from './vehicle360Atoms';
import { riskLamp } from './vehicle360Logic';

/** Predicted next-service window from odometer-history trend. */
export const ServicePredictionPanel = ({ prediction }) => (
  <PanelErrorBoundary name="vehicle-prediction">
    <Panel
      eyebrow="Service forecast"
      right={<Wrench size={13} style={{ color: 'var(--cluster-text-dim)' }} />}
    >
      {prediction ? (
        <div>
          <span className={`lamp ${riskLamp(prediction.risk)}`}>
            {String(prediction.risk || 'OK')
              .replace('_', ' ')
              .toLowerCase()}
          </span>
          <div className="mt-2">
            <KV
              k="Km until due"
              v={prediction.kmUntilDue != null ? formatKm(prediction.kmUntilDue) : '—'}
            />
            <KV
              k="Days until due"
              v={prediction.daysUntilDue != null ? formatNum(prediction.daysUntilDue) : '—'}
            />
            <KV
              k="Projected due"
              v={
                prediction.projectedServiceDueDate
                  ? formatDateIST(prediction.projectedServiceDueDate)
                  : '—'
              }
            />
            <KV
              k="Basis"
              v={String(prediction.basis || '')
                .replace(/_/g, ' ')
                .toLowerCase()}
            />
          </div>
        </div>
      ) : (
        <EmptyState
          title="No forecast"
          hint="A service projection appears after the predictive sweep sees odometer history for this vehicle."
        />
      )}
    </Panel>
  </PanelErrorBoundary>
);

/** Document expiry list from the fleet master record. */
export const DocumentsPanel = ({ documents }) => (
  <PanelErrorBoundary name="vehicle-docs">
    <Panel
      eyebrow="Documents"
      right={<FileWarning size={13} style={{ color: 'var(--cluster-text-dim)' }} />}
    >
      {documents?.length ? (
        <div>
          {documents.map((d) => (
            <KV
              key={d.docType}
              k={d.docType}
              v={d.expiryDate ? formatDateIST(d.expiryDate) : 'no expiry'}
            />
          ))}
          <Link
            to="/compliance"
            className="mt-2 inline-block text-[11px] font-semibold"
            style={{ color: 'var(--gnb-400)' }}
          >
            Open compliance screen →
          </Link>
        </div>
      ) : (
        <EmptyState
          title="No documents on record"
          hint="Upload RC, insurance, fitness and permits on the vehicle profile to track expiries here."
        />
      )}
    </Panel>
  </PanelErrorBoundary>
);

/** 30-day engine-hours area chart. */
export const EngineTrendPanel = ({ history }) => (
  <PanelErrorBoundary name="vehicle-trend">
    <Panel
      eyebrow="Engine hours — 30d"
      className="lg:col-span-2"
      right={<Activity size={13} style={{ color: 'var(--cluster-text-dim)' }} />}
    >
      {history.length > 1 ? (
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <XAxis dataKey="t" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--cluster-panel)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 10,
                  fontSize: 12,
                }}
                formatter={(v) => [`${formatNum(v, { decimals: 1 })} h`, 'engine hours']}
              />
              <Area
                type="monotone"
                dataKey="engineHours"
                stroke="var(--gnb-400)"
                fill="var(--gnb-400)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState
          title="Not enough history"
          hint="The engine-hours trend needs at least two live-status readings in the window."
        />
      )}
    </Panel>
  </PanelErrorBoundary>
);

/** Recent uploaded fuel bills. */
export const FuelLogsPanel = ({ recentFuelLogs }) => (
  <PanelErrorBoundary name="vehicle-fuel-logs">
    <Panel
      eyebrow="Recent fuel logs"
      right={<Fuel size={13} style={{ color: 'var(--cluster-text-dim)' }} />}
    >
      {recentFuelLogs?.length ? (
        <div>
          {recentFuelLogs.map((l) => (
            <KV
              key={l.id}
              k={formatDateIST(l.refuelTime)}
              v={`${formatLitres(l.litres)} · ${formatINR(l.totalAmount)}`}
            />
          ))}
          <Link
            to="/fuel-spend"
            className="mt-2 inline-block text-[11px] font-semibold"
            style={{ color: 'var(--gnb-400)' }}
          >
            All fuel spend →
          </Link>
        </div>
      ) : (
        <EmptyState
          title="No fuel logs"
          hint="Uploaded fuel bills for this vehicle show up here."
        />
      )}
    </Panel>
  </PanelErrorBoundary>
);
