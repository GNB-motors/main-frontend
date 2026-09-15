import { useState, useEffect } from 'react';
import { Car, FileText, Gauge, Fuel } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/axiosConfig';
import { useApi } from '../../hooks/useApi';
import PageShell from '../../components/ui/PageShell';
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

const ModelComparisonPage = () => {
  const [data, setData] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedVehicles, setSelectedVehicles] = useState([]);

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => {
      if (el) el.classList.remove('no-padding');
    };
  }, []);

  const {
    data: comparisonResponse,
    loading: isLoading,
    error: comparisonError,
  } = useApi((signal) => apiClient.get('/api/mileage/model-comparison', { signal }), []);

  useEffect(() => {
    if (comparisonResponse) {
      const fetched = comparisonResponse.data?.data || [];
      setData(fetched);
      if (fetched.length > 0) setSelectedModel(fetched[0].model);
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

  return (
    <PageShell title="Model Comparison" subtitle="Average mileage performance by vehicle model">
      {isLoading ? (
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
              label="Total Records"
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
