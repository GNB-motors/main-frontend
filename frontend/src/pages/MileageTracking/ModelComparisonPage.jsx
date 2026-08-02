import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, ComposedChart, Line, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { BarChart2, Car, FileText, Gauge, Fuel, Route, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import apiClient from '../../utils/axiosConfig';
import './MileageTracking.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const BAR_COLORS = [
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B',
  '#10B981', '#06B6D4', '#EF4444', '#F97316', '#84CC16',
];

const STATUS_COLORS = {
  Healthy: '#10B981',
  Watch:   '#F59E0B',
  Poor:    '#EF4444',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const getVariancePercent = (vehicleAvg, modelAvg) => {
  if (!modelAvg) return 0;
  return ((vehicleAvg - modelAvg) / modelAvg) * 100;
};

const getPerformanceStatus = (vp) => {
  if (vp >= -5)  return 'Healthy';
  if (vp >= -10) return 'Watch';
  return 'Poor';
};

const getPerformanceColor = (status) => STATUS_COLORS[status] ?? '#6B7280';

// ── Tooltips ──────────────────────────────────────────────────────────────────

const ModelTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="mc-glass-tooltip">
      <p className="mc-glass-tooltip-title">{d.model}</p>
      <div className="mc-glass-tooltip-row"><span className="mc-glass-tooltip-label">Avg Mileage</span><span className="mc-glass-tooltip-value">{d.avgMileage} km/L</span></div>
      <div className="mc-glass-tooltip-row"><span className="mc-glass-tooltip-label">Range</span><span className="mc-glass-tooltip-value">{d.minMileage} – {d.maxMileage} km/L</span></div>
      <div className="mc-glass-tooltip-row"><span className="mc-glass-tooltip-label">Vehicles</span><span className="mc-glass-tooltip-value">{d.vehicleCount}</span></div>
      <div className="mc-glass-tooltip-row"><span className="mc-glass-tooltip-label">Records</span><span className="mc-glass-tooltip-value">{d.recordCount}</span></div>
    </div>
  );
};

const VehicleTooltip = ({ active, payload, modelAvg }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const color = getPerformanceColor(d.status);
  return (
    <div className="mc-glass-tooltip">
      <p className="mc-glass-tooltip-title">{d.vehicleNumber}</p>
      <div className="mc-glass-tooltip-row"><span className="mc-glass-tooltip-label">Vehicle Avg</span><span className="mc-glass-tooltip-value">{d.avgMileage} km/L</span></div>
      <div className="mc-glass-tooltip-row"><span className="mc-glass-tooltip-label">Model Avg</span><span className="mc-glass-tooltip-value">{modelAvg} km/L</span></div>
      <div className="mc-glass-tooltip-row">
        <span className="mc-glass-tooltip-label">Variance</span>
        <span className="mc-glass-tooltip-value" style={{ color, display: 'flex', alignItems: 'center', gap: '6px' }}>
          {d.variancePct > 0 ? '+' : ''}{d.variancePct}%
          <span className="mc-indicator-dot" style={{ background: color }} />
        </span>
      </div>
      <div className="mc-glass-tooltip-row">
        <span className="mc-glass-tooltip-label">Status</span>
        <span className="mc-glass-tooltip-value" style={{ color }}>{d.status}</span>
      </div>
      <div className="mc-glass-tooltip-row"><span className="mc-glass-tooltip-label">Records</span><span className="mc-glass-tooltip-value">{d.recordCount}</span></div>
    </div>
  );
};

// ── KPI Card ──────────────────────────────────────────────────────────────────

const KpiCard = ({ icon: Icon, label, value, iconBg, iconColor }) => (
  <div className="mc-kpi-card">
    <div className="mc-kpi-icon" style={{ background: iconBg }}>
      <Icon size={18} color={iconColor} />
    </div>
    <div className="mc-kpi-body">
      <span className="mc-kpi-label">{label}</span>
      <span className="mc-kpi-value">{value}</span>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

const ModelComparisonPage = () => {
  const [data, setData]               = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedVehicles, setSelectedVehicles] = useState([]);

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => { if (el) el.classList.remove('no-padding'); };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get('/api/mileage/model-comparison');
        const fetched = res.data?.data || [];
        setData(fetched);
        if (fetched.length > 0) setSelectedModel(fetched[0].model);
      } catch {
        toast.error('Failed to load model comparison data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Derived data ───────────────────────────────────────────────────────────

  const selectedModelData = data.find(d => d.model === selectedModel) ?? null;

  const allVehicleChartData = (selectedModelData?.vehicles ?? [])
    .map(v => {
      const rawVp  = getVariancePercent(v.avgMileage, selectedModelData.avgMileage);
      const vp     = Math.round(rawVp * 10) / 10;
      const status = getPerformanceStatus(vp);
      return {
        ...v,
        modelAvgMileage: selectedModelData.avgMileage,
        variancePct: vp,
        status,
        color: getPerformanceColor(status),
      };
    })
    .sort((a, b) => b.avgMileage - a.avgMileage);

  const atRiskCount = allVehicleChartData.filter(v => v.status !== 'Healthy').length;

  useEffect(() => {
    if (!selectedModelData || allVehicleChartData.length === 0) {
      setSelectedVehicles([]);
      return;
    }
    
    // allVehicleChartData is already sorted by avgMileage descending
    const top3 = allVehicleChartData.slice(0, 3);
    const bottom3 = allVehicleChartData.slice(-3).filter(v => !top3.some(t => t.vehicleNumber === v.vehicleNumber));
    
    const defaults = [...top3, ...bottom3].map(v => ({
      value: v.vehicleNumber,
      label: v.vehicleNumber
    }));
    
    setSelectedVehicles(defaults);
  }, [selectedModelData]); // we only want to re-calculate defaults when the model changes (data doesn't mutate dynamically here)

  const selectedValues = selectedVehicles.map(opt => opt.value);
  const vehicleChartData = allVehicleChartData.filter(v => selectedValues.includes(v.vehicleNumber));
  
  const vehicleOptions = allVehicleChartData.map(v => ({
    value: v.vehicleNumber,
    label: v.vehicleNumber
  }));

  const totalRecords  = data.reduce((s, d) => s + d.recordCount, 0);
  const totalVehicles = data.reduce((s, d) => s + d.vehicleCount, 0);
  const bestModel     = data[0] ?? null;
  const maxAvg        = data.length ? Math.max(...data.map(d => d.avgMileage)) : 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="page-container mc-page">

      {/* ── Header ── */}
      <div className="mc-header">
        <div className="mc-header-left">
          <div className="mc-header-icon">
            <BarChart2 size={20} color="#3B82F6" />
          </div>
          <div>
            <h2 className="mc-title">Model Comparison</h2>
            <p className="mc-subtitle">Average mileage performance by vehicle model</p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mc-content">

        {isLoading ? (
          <div className="mc-loading"><p>Loading model comparison data...</p></div>
        ) : data.length === 0 ? (
          <div className="mc-empty">
            <FileText size={48} color="#9ca3af" />
            <p>No completed mileage records found</p>
            <p className="mc-empty-sub">
              Model comparison data will appear once vehicles complete mileage intervals.
            </p>
          </div>
        ) : (
          <>
            {/* ── KPI Row ── */}
            <div className="mc-kpi-row">
              <KpiCard icon={Car}      label="Models Tracked"   value={data.length}
                iconBg="rgba(59,130,246,0.10)"  iconColor="#3B82F6" />
              <KpiCard icon={Gauge}    label="Best Avg Mileage" value={bestModel ? `${bestModel.avgMileage} km/L` : '—'}
                iconBg="rgba(16,185,129,0.10)"  iconColor="#10B981" />
              <KpiCard icon={FileText} label="Total Records"    value={totalRecords}
                iconBg="rgba(99,102,241,0.10)"  iconColor="#6366F1" />
              <KpiCard icon={Fuel}     label="Total Vehicles"   value={totalVehicles}
                iconBg="rgba(245,158,11,0.10)"  iconColor="#F59E0B" />
            </div>

            {/* ── Model Average Bar Chart ── */}
            <div className="mc-card">
              <div className="mc-card-header">
                <div className="mc-card-icon" style={{ background: 'rgba(59,130,246,0.10)' }}>
                  <BarChart2 size={16} color="#3B82F6" />
                </div>
                <h3 className="mc-card-title">Average Mileage by Model (km/L)</h3>
                <span className="mc-card-hint">Click a bar to inspect vehicles</span>
              </div>
              <div className="mc-chart-area">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={data}
                    margin={{ top: 8, right: 24, left: 0, bottom: 48 }}
                    onClick={(e) => {
                      if (e?.activePayload?.[0]) setSelectedModel(e.activePayload[0].payload.model);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="model"
                      tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'Inter, sans-serif' }}
                      axisLine={false} tickLine={false}
                      interval={0} angle={-25} textAnchor="end" dy={8}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'Inter, sans-serif' }}
                      axisLine={false} tickLine={false}
                      unit=" km/L" width={72}
                    />
                    <Tooltip content={<ModelTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
                    <Bar dataKey="avgMileage" radius={[6, 6, 0, 0]} maxBarSize={56}>
                      {data.map((entry, index) => (
                        <Cell
                          key={entry.model}
                          fill={entry.model === selectedModel ? '#1D4ED8' : BAR_COLORS[index % BAR_COLORS.length]}
                          opacity={entry.model === selectedModel ? 1 : 0.6}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Vehicle Performance Chart ── */}
            <div className="mc-card">
              <div className="mc-card-header mc-card-header--tall">
                <div className="mc-card-icon" style={{ background: 'rgba(16,185,129,0.10)' }}>
                  <Gauge size={16} color="#10B981" />
                </div>
                <div className="mc-card-header-text">
                  <div className="mc-card-title-row">
                    <h3 className="mc-card-title">Vehicle Performance vs Model Average</h3>
                    {selectedModel && (
                      <span className="mc-card-model-tag">{selectedModel}</span>
                    )}
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
                    <Select
                      isMulti
                      options={vehicleOptions}
                      value={selectedVehicles}
                      onChange={(newVal) => {
                        if (newVal.length > 10) {
                          toast.error('Maximum 10 vehicles can be selected');
                          return;
                        }
                        setSelectedVehicles(newVal);
                      }}
                      placeholder="Search and select vehicles (max 10)..."
                      className="mc-react-select-container"
                      classNamePrefix="mc-react-select"
                      styles={{
                        control: (base) => ({ ...base, fontSize: '14px', borderRadius: '8px', borderColor: '#e2e8f0' }),
                        menu: (base) => ({ ...base, fontSize: '14px', zIndex: 9999 })
                      }}
                    />
                  </div>
                  {(allVehicleChartData.length >= 3 && selectedVehicles.length < 3) ? (
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
                            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} vertical={false} />
                            <XAxis
                              dataKey="vehicleNumber"
                              tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Inter, sans-serif' }}
                              axisLine={false} tickLine={false}
                              interval={0} angle={-25} textAnchor="end" dy={8}
                            />
                            <YAxis
                              yAxisId="left"
                              tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Inter, sans-serif' }}
                              axisLine={false} tickLine={false}
                              unit=" km/L" width={68}
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
                          label={{ position: 'top', value: `Model Avg: ${selectedModelData?.avgMileage} km/L`, fill: '#3B82F6', fontSize: 12, fontWeight: 600, dy: -8 }}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="avgMileage"
                          name="Vehicle Avg"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={48}
                          animationDuration={1500}
                          activeBar={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))', stroke: '#0f172a', strokeWidth: 1, strokeOpacity: 0.2 }}
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

            {/* ── Model-wise Summary Table ── */}
            <div className="mc-card">
              <div className="mc-card-header">
                <div className="mc-card-icon" style={{ background: 'rgba(99,102,241,0.10)' }}>
                  <Route size={16} color="#6366F1" />
                </div>
                <h3 className="mc-card-title">Model-wise Summary</h3>
              </div>
              <div className="mc-table-wrapper">
                <table className="mc-table">
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th className="mc-th-right">Vehicles</th>
                      <th className="mc-th-right">Records</th>
                      <th className="mc-th-right">Avg Mileage</th>
                      <th className="mc-th-right">Min</th>
                      <th className="mc-th-right">Max</th>
                      <th className="mc-th-right">Total Distance</th>
                      <th className="mc-th-right">Total Fuel</th>
                      <th className="mc-th-right">At Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, index) => {
                      const atRisk = (row.vehicles ?? []).filter(v => {
                        const vp = getVariancePercent(v.avgMileage, row.avgMileage);
                        return vp < -5;
                      }).length;
                      const isSelected = row.model === selectedModel;
                      return (
                        <tr
                          key={row.model}
                          className={`mc-table-row${isSelected ? ' mc-row-selected' : ''}`}
                          onClick={() => setSelectedModel(row.model)}
                        >
                          <td className="mc-td-model">
                            <div className="mc-model-cell">
                              <span
                                className="mc-model-dot"
                                style={{ background: BAR_COLORS[index % BAR_COLORS.length] }}
                              />
                              <span>{row.model}</span>
                              {row.avgMileage === maxAvg && (
                                <span className="mc-best-badge">Best</span>
                              )}
                            </div>
                          </td>
                          <td className="mc-td-right">{row.vehicleCount}</td>
                          <td className="mc-td-right">{row.recordCount}</td>
                          <td className="mc-td-right mc-td-primary">{row.avgMileage} km/L</td>
                          <td className="mc-td-right">{row.minMileage}</td>
                          <td className="mc-td-right">{row.maxMileage}</td>
                          <td className="mc-td-right">{row.totalDistanceKm.toLocaleString()} km</td>
                          <td className="mc-td-right">{row.totalFuelL.toLocaleString()} L</td>
                          <td className="mc-td-right">
                            {atRisk > 0
                              ? <span className="mc-at-risk-badge">{atRisk}</span>
                              : <span className="mc-ok-badge">✓</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ModelComparisonPage;
