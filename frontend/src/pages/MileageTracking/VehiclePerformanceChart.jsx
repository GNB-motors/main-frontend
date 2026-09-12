import {
  BarChart,
  Bar,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Gauge, AlertTriangle } from 'lucide-react';
import SearchableDropdown from '../../components/SearchableDropdown/SearchableDropdown';
import { STATUS_COLORS } from './modelComparisonLogic';
import { VehicleTooltip } from './modelComparisonCells';

/** Selected vehicles' mileage vs their model's average, with a legend and vehicle picker. */
const VehiclePerformanceChart = (props) => {
  const {
    selectedModel,
    selectedModelData,
    allVehicleChartData,
    vehicleChartData,
    vehicleOptions,
    selectedVehicles,
    atRiskCount,
    onToggleVehicle,
    onRemoveVehicle,
  } = props;

  return (
    <div className="mc-card">
      <div className="mc-card-header mc-card-header--tall">
        <div className="mc-card-icon" style={{ background: 'rgba(16,185,129,0.10)' }}>
          <Gauge size={16} color="#10B981" />
        </div>
        <div className="mc-card-header-text">
          <div className="mc-card-title-row">
            <h3 className="mc-card-title">Vehicle Performance vs Model Average</h3>
            {selectedModel && <span className="mc-card-model-tag">{selectedModel}</span>}
          </div>
          {selectedModelData && atRiskCount > 0 && (
            <span className="mc-card-sub">
              <span className="mc-at-risk-inline">
                <AlertTriangle size={11} />
                {atRiskCount} vehicle{atRiskCount !== 1 ? 's' : ''} need attention
              </span>
            </span>
          )}
        </div>
      </div>

      {allVehicleChartData.length === 0 ? (
        <div className="mc-empty mc-empty-sm">
          <p>No vehicle-level records available for this model.</p>
        </div>
      ) : (
        <>
          <div className="mc-chart-controls" style={{ padding: '0 24px 16px', zIndex: 10 }}>
            <SearchableDropdown
              options={vehicleOptions}
              selectedOptions={selectedVehicles}
              onSelect={onToggleVehicle}
              onRemove={onRemoveVehicle}
              placeholder="Search and select vehicles (max 10)..."
            />
          </div>
          {allVehicleChartData.length >= 3 && selectedVehicles.length < 3 ? (
            <div className="mc-empty mc-empty-sm">
              <p>Please select at least 3 vehicles to view the comparison graph.</p>
            </div>
          ) : (
            <>
              <div className="mc-chart-area" style={{ overflowX: 'auto', overflowY: 'hidden' }}>
                <div style={{ minWidth: Math.max(600, selectedVehicles.length * 75) + 'px' }}>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={vehicleChartData}
                      margin={{ top: 24, right: 24, left: 0, bottom: 48 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#94a3b8"
                        opacity={0.15}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="vehicleNumber"
                        tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Inter, sans-serif' }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        dy={8}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Inter, sans-serif' }}
                        axisLine={false}
                        tickLine={false}
                        unit=" km/L"
                        width={68}
                      />
                      <Tooltip
                        content={<VehicleTooltip modelAvg={selectedModelData?.avgMileage} />}
                        cursor={false}
                      />
                      <ReferenceLine
                        yAxisId="left"
                        y={selectedModelData?.avgMileage}
                        stroke="#3B82F6"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        label={{
                          position: 'top',
                          value: `Model Avg: ${selectedModelData?.avgMileage} km/L`,
                          fill: '#3B82F6',
                          fontSize: 12,
                          fontWeight: 600,
                          dy: -8,
                        }}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="avgMileage"
                        name="Vehicle Avg"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                        animationDuration={1500}
                        activeBar={{
                          filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))',
                          stroke: '#0f172a',
                          strokeWidth: 1,
                          strokeOpacity: 0.2,
                        }}
                      >
                        {vehicleChartData.map((entry) => (
                          <Cell key={String(entry.vehicleId)} fill={entry.color} opacity={0.9} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Legend */}
              <div className="mc-perf-legend">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <span key={status} className="mc-perf-legend-item">
                    <span className="mc-perf-legend-dot" style={{ background: color }} />
                    {status}
                  </span>
                ))}
                <span className="mc-perf-legend-item">
                  <span className="mc-perf-legend-dash" style={{ background: '#3B82F6' }} />
                  Model Avg Baseline
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default VehiclePerformanceChart;
