import { ArrowLeft } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Panel, StatusPill } from '../Overview/components/overview.primitives.jsx';
import { toIST } from './fiDates.js';

export default function VehicleDrilldownPanel({
  vehicle,
  chartData,
  windows,
  onClose,
  onShowWorking,
}) {
  return (
    <Panel
      eyebrow={`${vehicle} — fuel timeline`}
      question="Daily fills vs suspected losses"
      action={
        <button className="ov-btn" onClick={onClose}>
          <ArrowLeft size={14} /> Close
        </button>
      }
    >
      {chartData.length > 0 ? (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="var(--cluster-text-dim)" />
              <YAxis tick={{ fontSize: 12 }} unit=" L" stroke="var(--cluster-text-dim)" />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid var(--hairline)',
                  background: 'var(--cluster-panel)',
                  fontSize: 12,
                }}
                formatter={(value, name) => [
                  `${value} L`,
                  name === 'fills' ? 'Fills ▲' : 'Suspected loss ▼',
                ]}
              />
              <Legend formatter={(value) => (value === 'fills' ? 'Fills ▲' : 'Suspected loss ▼')} />
              <Bar dataKey="fills" fill="var(--ok)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="loss" fill="var(--critical)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-dim py-6 text-center text-sm">
          No chart data for this vehicle in the window.
        </div>
      )}

      <div className="mt-4">
        <div className="text-dim mb-2 text-[11px] font-semibold uppercase tracking-wide">
          Mass-balance windows
        </div>
        <div className="overflow-x-auto">
          <table className="ov-table">
            <thead>
              <tr>
                <th>Window</th>
                <th className="text-right">Fills</th>
                <th className="text-right">Engine burn</th>
                <th className="text-right">Tank Δ</th>
                <th className="text-right">Unaccounted</th>
                <th>Review</th>
                <th className="text-right">DEF %</th>
                <th aria-label="Working" />
              </tr>
            </thead>
            <tbody>
              {windows.map((w) => (
                <tr key={w._id}>
                  <td className="num text-dim">
                    {toIST(w.windowFrom)?.format('DD MMM') || '—'} →{' '}
                    {toIST(w.windowTo)?.format('DD MMM YY') || '—'}
                  </td>
                  <td className="num text-right">{w.fillsLitres ?? '—'}</td>
                  <td className="num text-right">{w.engineBurnL ?? '—'}</td>
                  <td className="num text-right">{w.tankDeltaL ?? '—'}</td>
                  <td
                    className="num text-right"
                    style={{
                      color: w.unaccountedLossL > 0 ? 'var(--critical)' : 'var(--cluster-text-dim)',
                    }}
                  >
                    {w.unaccountedLossL ?? '—'}
                    {w.unaccountedLossPct != null && (
                      <span className="text-dim"> ({w.unaccountedLossPct}%)</span>
                    )}
                  </td>
                  <td>
                    {w.siphonSuspected ? (
                      <StatusPill tone="caution">
                        Review · {(w.siphonConfidence || 'low').toLowerCase()}
                      </StatusPill>
                    ) : (
                      <StatusPill tone="ok">OK</StatusPill>
                    )}
                  </td>
                  <td className="text-right">
                    {w.defRatioFlag ? (
                      <span className="ov-pill ov-pill--caution">
                        {w.defToFuelRatioPct ?? '—'}%
                      </span>
                    ) : (
                      <span className="num text-dim">
                        {w.defToFuelRatioPct != null ? `${w.defToFuelRatioPct}%` : '—'}
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      className="ov-btn"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowWorking(w);
                      }}
                    >
                      Show working
                    </button>
                  </td>
                </tr>
              ))}
              {windows.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-dim py-6 text-center text-sm">
                    No mass-balance windows for this vehicle.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}
