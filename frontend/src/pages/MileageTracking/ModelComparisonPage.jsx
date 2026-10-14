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
import ExportButton from '../../components/ui/ExportButton';
import ReportDataNotice from '../../components/ui/ReportDataNotice';
import { toStartOfDayIso, toEndOfDayIso } from '../Reports/reports/mileageIntervalReportUtils';
import ReportFrame, {
  ReportClear,
  ReportDateRange,
  ReportFooter,
  ReportSearch,
  ReportSelect,
} from '../Reports/reports/ReportFrame';
import { exportFilterMeta } from '../Reports/reports/fleetReportUtils';
import { istDayEnd, istDayStart, matchesSearch } from '../Reports/reports/reportFilters';
import {
  MODEL_SUMMARY_EXPORT_COLUMNS,
  buildVehicleChartData,
  defaultVehicleSelection,
  countAtRisk,
  modelSummaryExportRows,
} from './modelComparisonLogic';
import { KpiCard } from './modelComparisonCells';
import ModelAverageBarChart from './ModelAverageBarChart';
import VehiclePerformanceChart from './VehiclePerformanceChart';
import ModelSummaryTable from './ModelSummaryTable';
import './MileageTracking.css';

const MIN_CYCLE_OPTIONS = [1, 2, 3, 5];
const MIN_CYCLE_SELECT_OPTIONS = MIN_CYCLE_OPTIONS.map((n) => ({
  value: String(n),
  label: String(n),
}));

/**
 * `range` ({ from, to } calendar days): the /mileage hub's shared dates. When
 * given, the page follows it and hides its own date inputs.
 *
 * Not embedded, it is the Reports page's Model Comparison report and uses the
 * shared ReportFrame layout.
 */
const ModelComparisonPage = ({ embedded = false, range: hubRange = null }) => {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [ownRange, setRange] = useState({ from: '', to: '' });
  const range = hubRange || ownRange;
  const [minCycles, setMinCycles] = useState(1);
  const [search, setSearch] = useState('');

  const params = useMemo(() => {
    // minCycles=1 is the API default; leaving it out keeps the request valid
    // against a backend that predates the parameter.
    const p = minCycles > 1 ? { minCycles } : {};
    // The hub's range is local calendar days; the report sends whole IST days.
    const from = embedded ? toStartOfDayIso(range.from) : istDayStart(range.from);
    const to = embedded ? toEndOfDayIso(range.to) : istDayEnd(range.to);
    if (from) p.from = from;
    if (to) p.to = to;
    return p;
  }, [range, minCycles, embedded]);

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

  const query = search.trim();
  // `data` itself when nothing is searched, so the charts keep a stable array.
  const models = useMemo(
    () => (query ? data.filter((d) => matchesSearch(query, [d.model])) : data),
    [data, query],
  );
  const activeModel = models.some((d) => d.model === selectedModel)
    ? selectedModel
    : (models[0]?.model ?? null);
  const selectedModelData = models.find((d) => d.model === activeModel) ?? null;
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

  const totalRecords = models.reduce((s, d) => s + d.recordCount, 0);
  const totalVehicles = models.reduce((s, d) => s + d.vehicleCount, 0);
  const bestModel = models[0] ?? null;
  const maxAvg = models.length ? Math.max(...models.map((d) => d.avgMileage)) : 0;
  const activeFilters = hubRange
    ? minCycles > 1
      ? 1
      : 0
    : (range.from ? 1 : 0) + (range.to ? 1 : 0) + (minCycles > 1 ? 1 : 0) + (query ? 1 : 0);

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

  const loadingState = (
    <div className="mc-loading">
      <p>Loading model comparison data...</p>
    </div>
  );
  const emptyState = (
    <div className="mc-empty">
      <FileText size={48} color="#9ca3af" />
      <p>No completed mileage records found</p>
      <p className="mc-empty-sub">
        Model comparison data will appear once vehicles complete mileage intervals.
      </p>
    </div>
  );

  const renderCharts = ({ showExport }) => (
    <>
      <ModelAverageBarChart
        data={models}
        selectedModel={activeModel}
        onSelectModel={setSelectedModel}
      />

      <VehiclePerformanceChart
        selectedModel={activeModel}
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
        data={models}
        selectedModel={activeModel}
        maxAvg={maxAvg}
        onSelectModel={setSelectedModel}
        showExport={showExport}
      />
    </>
  );

  const dataNotice = meta ? (
    <ReportDataNotice
      dataAsOf={meta.dataAsOf}
      label="Latest completed cycle"
      emptyText="No completed full-tank cycles yet."
      staleHint="A cycle completes only when the next full-tank bill is logged."
    />
  ) : null;
  const methodNoteText = methodNote ? (
    <p className="mc-empty-sub" style={{ margin: 0 }}>
      {methodNote}
    </p>
  ) : null;

  if (!embedded) {
    const kpis = models.length
      ? [
          { label: 'Models tracked', value: models.length, icon: Car },
          {
            label: 'Best avg mileage',
            value: bestModel ? `${bestModel.avgMileage} km/L` : '—',
            icon: Gauge,
            tone: 'green',
          },
          { label: 'Cycles used', value: totalRecords, icon: FileText, tone: 'violet' },
          { label: 'Total vehicles', value: totalVehicles, icon: Fuel, tone: 'orange' },
        ]
      : null;

    return (
      <ReportFrame
        title="Model Comparison"
        subtitle="Average mileage performance by vehicle model"
        filters={
          <>
            <ReportDateRange from={ownRange.from} to={ownRange.to} onChange={setRange} />
            <ReportSearch value={search} onChange={setSearch} placeholder="Search model" />
            <ReportSelect
              label="Min cycles"
              value={String(minCycles)}
              onChange={(v) => setMinCycles(Number(v))}
              options={MIN_CYCLE_SELECT_OPTIONS}
            />
            <ReportClear
              active={activeFilters > 0}
              onClear={() => {
                setRange({ from: '', to: '' });
                setSearch('');
                setMinCycles(1);
              }}
            />
          </>
        }
        actions={
          <ExportButton
            rows={modelSummaryExportRows(models)}
            columns={MODEL_SUMMARY_EXPORT_COLUMNS}
            filename="model-comparison"
            buttonClass="rpt-btn"
            meta={{
              filters: [
                ...exportFilterMeta({
                  ...ownRange,
                  entityLabel: query ? `“${query}”` : null,
                }),
                { label: 'Min cycles per vehicle', value: minCycles },
                { label: 'Models compared', value: models.length },
              ],
            }}
            disabled={!models.length}
          />
        }
        notice={
          dataNotice ? (
            <>
              {dataNotice}
              {methodNoteText}
            </>
          ) : null
        }
        kpis={kpis}
        footer={
          data.length ? (
            <ReportFooter
              summary={`${query ? `${models.length} of ${data.length}` : data.length} models · ${totalVehicles.toLocaleString('en-IN')} vehicles`}
            />
          ) : null
        }
      >
        {isLoading && !data.length ? (
          loadingState
        ) : data.length === 0 ? (
          emptyState
        ) : models.length === 0 ? (
          <div className="mc-empty">
            <FileText size={48} color="#9ca3af" />
            <p>No model matches “{query}”</p>
            <p className="mc-empty-sub">Try another model name or clear the search.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {renderCharts({ showExport: false })}
          </div>
        )}
      </ReportFrame>
    );
  }

  return (
    <PageShell
      embedded={embedded}
      title="Model Comparison"
      subtitle="Average mileage performance by vehicle model"
      filters={
        <FilterBar
          from={range.from}
          to={range.to}
          onRangeChange={hubRange ? null : (patch) => setRange((prev) => ({ ...prev, ...patch }))}
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
          {dataNotice}
          {methodNoteText}
        </div>
      ) : null}
      {isLoading && !data.length ? (
        loadingState
      ) : data.length === 0 ? (
        emptyState
      ) : (
        <>
          <div className="mc-kpi-row">
            <KpiCard
              icon={Car}
              label="Models Tracked"
              value={models.length}
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

          {renderCharts({ showExport: true })}
        </>
      )}
    </PageShell>
  );
};

export default ModelComparisonPage;
