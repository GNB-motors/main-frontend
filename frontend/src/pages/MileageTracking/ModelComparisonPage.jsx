import { useState, useEffect, useMemo } from 'react';
import { Car, FileText, Gauge, Fuel } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import apiClient from '../../utils/axiosConfig';
import { useApi } from '../../hooks/useApi';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import ReportDataNotice from '../../components/ui/ReportDataNotice';
import { toStartOfDayIso, toEndOfDayIso } from '../Reports/reports/mileageIntervalReportUtils';
import {
  buildVehicleChartData,
  defaultVehicleSelection,
  countAtRisk,
} from './modelComparisonLogic';
import { KpiCard } from './modelComparisonCells';
import ModelAverageBarChart from './ModelAverageBarChart';
import VehiclePerformanceChart from './VehiclePerformanceChart';
import ModelSummaryTable from './ModelSummaryTable';
import './MileageTracking.css';

const MIN_CYCLE_OPTIONS = [1, 2, 3, 5];

const ModelComparisonPage = () => {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [range, setRange] = useState({ from: '', to: '' });
  const [minCycles, setMinCycles] = useState(1);

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => {
      if (el) el.classList.remove('no-padding');
    };
  }, []);

  const params = useMemo(() => {
    // minCycles=1 is the API default; leaving it out keeps the request valid
    // against a backend that predates the parameter.
    const p = minCycles > 1 ? { minCycles } : {};
    const from = toStartOfDayIso(range.from);
    const to = toEndOfDayIso(range.to);
    if (from) p.from = from;
    if (to) p.to = to;
    return p;
  }, [range, minCycles]);

  const {
    data: comparisonResponse,
    loading: isLoading,
    error: comparisonError,
  } = useApi(
    (signal) => apiClient.get('/api/mileage/model-comparison', { params, signal }),
    [JSON.stringify(params)],
  );

  useEffect(() => {
    if (comparisonResponse) {
      const fetched = comparisonResponse.data?.data || [];
      setData(fetched);
      setMeta(comparisonResponse.data?.meta || null);
      setSelectedModel((current) =>
        fetched.some((d) => d.model === current) ? current : (fetched[0]?.model ?? null),
      );
    }
  }, [comparisonResponse]);

  useEffect(() => {
    if (comparisonError) toast.error('Failed to load model comparison data');
  }, [comparisonError]);

  const selectedModelData = data.find((d) => d.model === selectedModel) ?? null;
  const allVehicleChartData = buildVehicleChartData(selectedModelData);
  const atRiskCount = countAtRisk(allVehicleChartData, selectedModelData?.avgMileage);

  useEffect(() => {
    if (!selectedModelData || allVehicleChartData.length === 0) {
      setSelectedVehicles([]);
      return;
    }
    setSelectedVehicles(defaultVehicleSelection(allVehicleChartData));
    // we only want to re-calculate defaults when the model changes (data doesn't mutate dynamically here)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModelData]);

  const vehicleChartData = allVehicleChartData.filter((v) =>
    selectedVehicles.includes(v.vehicleNumber),
  );
  const vehicleOptions = allVehicleChartData.map((v) => v.vehicleNumber);

  const handleVehicleToggle = (vehicleNumber) => {
    if (selectedVehicles.includes(vehicleNumber)) {
      setSelectedVehicles(selectedVehicles.filter((v) => v !== vehicleNumber));
      return;
    }
    if (selectedVehicles.length >= 10) {
      toast.error('Maximum 10 vehicles can be selected');
      return;
    }
    setSelectedVehicles([...selectedVehicles, vehicleNumber]);
  };

  const totalRecords = data.reduce((s, d) => s + d.recordCount, 0);
  const totalVehicles = data.reduce((s, d) => s + d.vehicleCount, 0);
  const bestModel = data[0] ?? null;
  const maxAvg = data.length ? Math.max(...data.map((d) => d.avgMileage)) : 0;
  const activeFilters = (range.from ? 1 : 0) + (range.to ? 1 : 0) + (minCycles > 1 ? 1 : 0);

  const methodNote = meta
    ? [
        'Distance-weighted: total km ÷ total litres of completed full-tank cycles.',
        meta.excludedCycleCount
          ? `${meta.excludedCycleCount} cycle${meta.excludedCycleCount === 1 ? '' : 's'} with no distance or an impossible km/L (${meta.plausibleKmPerL?.min}–${meta.plausibleKmPerL?.max}) left out.`
          : null,
        meta.belowMinVehicleCount
          ? `${meta.belowMinVehicleCount} vehicle${meta.belowMinVehicleCount === 1 ? '' : 's'} with fewer than ${meta.minCycles} usable cycles hidden.`
          : null,
      ]
        .filter(Boolean)
        .join(' ')
    : null;

  return (
    <PageShell
      title="Model Comparison"
      subtitle="Average mileage performance by vehicle model"
      filters={
        <FilterBar
          from={range.from}
          to={range.to}
          onRangeChange={(patch) => setRange((prev) => ({ ...prev, ...patch }))}
          activeCount={activeFilters}
          onClear={() => {
            setRange({ from: '', to: '' });
            setMinCycles(1);
          }}
          right={
            <div className="date-input-group">
              <label htmlFor="model-comparison-min-cycles">Min cycles per vehicle</label>
              <Select value={String(minCycles)} onValueChange={(v) => setMinCycles(Number(v))}>
                <SelectTrigger id="model-comparison-min-cycles" className="h-9 w-[90px] text-sm">
                  <SelectValue>{minCycles}</SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  {MIN_CYCLE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
      }
    >
      {meta ? (
        <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          <ReportDataNotice
            dataAsOf={meta.dataAsOf}
            label="Latest completed cycle"
            emptyText="No completed full-tank cycles yet."
            staleHint="A cycle completes only when the next full-tank bill is logged."
          />
          {methodNote ? (
            <p className="mc-empty-sub" style={{ margin: 0 }}>
              {methodNote}
            </p>
          ) : null}
        </div>
      ) : null}
      {isLoading && !data.length ? (
        <div className="mc-loading">
          <p>Loading model comparison data...</p>
        </div>
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
          <div className="mc-kpi-row">
            <KpiCard
              icon={Car}
              label="Models Tracked"
              value={data.length}
              iconBg="rgba(59,130,246,0.10)"
              iconColor="#3B82F6"
            />
            <KpiCard
              icon={Gauge}
              label="Best Avg Mileage"
              value={bestModel ? `${bestModel.avgMileage} km/L` : '—'}
              iconBg="rgba(16,185,129,0.10)"
              iconColor="#10B981"
            />
            <KpiCard
              icon={FileText}
              label="Cycles Used"
              value={totalRecords}
              iconBg="rgba(99,102,241,0.10)"
              iconColor="#6366F1"
            />
            <KpiCard
              icon={Fuel}
              label="Total Vehicles"
              value={totalVehicles}
              iconBg="rgba(245,158,11,0.10)"
              iconColor="#F59E0B"
            />
          </div>

          <ModelAverageBarChart
            data={data}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
          />

          <VehiclePerformanceChart
            selectedModel={selectedModel}
            selectedModelData={selectedModelData}
            allVehicleChartData={allVehicleChartData}
            vehicleChartData={vehicleChartData}
            vehicleOptions={vehicleOptions}
            selectedVehicles={selectedVehicles}
            atRiskCount={atRiskCount}
            onToggleVehicle={handleVehicleToggle}
            onRemoveVehicle={(vehicleNumber) =>
              setSelectedVehicles(selectedVehicles.filter((v) => v !== vehicleNumber))
            }
          />

          <ModelSummaryTable
            data={data}
            selectedModel={selectedModel}
            maxAvg={maxAvg}
            onSelectModel={setSelectedModel}
          />
        </>
      )}
    </PageShell>
  );
};

export default ModelComparisonPage;
