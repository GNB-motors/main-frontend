import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import PageShell from '../../components/ui/PageShell';
import { OverviewService } from './OverviewService.jsx';
import { useOwnerValueDigest } from './OwnerValueDigest.jsx';
import KpiRail from './components/KpiRail.jsx';
import FleetHealthPanel from './components/FleetHealthPanel.jsx';
import FinancialImpactPanel from './components/FinancialImpactPanel.jsx';
import ActionCenter from './components/ActionCenter.jsx';
import VehicleAttentionTable from './components/VehicleAttentionTable.jsx';
import UtilizationPanel from './components/UtilizationPanel.jsx';
import DowntimePanel from './components/DowntimePanel.jsx';
import { SectionHeader } from './components/overview.primitives.jsx';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import OverviewActions from './components/OverviewActions.jsx';
import DashboardSkeleton from './components/DashboardSkeleton.jsx';
import AnalyticsSection from './components/AnalyticsSection.jsx';
import LiveVehicleMap from './components/LiveVehicleMap.jsx';
import {
  useHealthScore,
  useMoney,
  useUtilization,
  useDowntimeRisk,
} from '../../hooks/useOwnerValue';
import { buildOverviewExportRows } from './overviewExport.js';

const OverviewPage = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [fuelAnalytics, setFuelAnalytics] = useState(null);
  const [driverPerformance, setDriverPerformance] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDays, setSelectedDays] = useState(7);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { money: riskMoney } = useOwnerValueDigest();

  const valueWindow = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - selectedDays * 24 * 3600 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [selectedDays]);

  // Owner-value layer (hoisted here so cross-panel derivations — Action Center,
  // the vehicle attention table — can read all four feeds together).
  const {
    data: health,
    loading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useHealthScore();
  const {
    data: money,
    loading: moneyLoading,
    error: moneyError,
    refetch: refetchMoney,
  } = useMoney(valueWindow);
  const {
    data: utilization,
    loading: utilLoading,
    refetch: refetchUtil,
  } = useUtilization(valueWindow);
  const { data: downtime, loading: downLoading, refetch: refetchDown } = useDowntimeRisk();

  // PageShell owns its padding — drop .page-content's default padding while mounted.
  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => {
      if (el) el.classList.remove('no-padding');
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = { days: selectedDays };
        const [summary, fuel, drivers, fin] = await Promise.all([
          OverviewService.getDashboardSummary(params),
          OverviewService.getFuelAnalytics(params),
          OverviewService.getDriverPerformance(params),
          OverviewService.getFinancials(params),
        ]);
        setSummaryData(summary?.summaryCards);
        setFuelAnalytics(fuel);
        setDriverPerformance(drivers);
        setFinancials(fin);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.detail || 'Could not load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedDays, refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    refetchHealth?.();
    refetchMoney?.();
    refetchUtil?.();
    refetchDown?.();
  }, [refetchHealth, refetchMoney, refetchUtil, refetchDown]);

  const vehicles = summaryData?.vehicles;
  const drivers = summaryData?.drivers;
  const trips = summaryData?.trips;
  const kilometers = summaryData?.kilometers;
  const fuel = summaryData?.fuel;

  const handleExport = useCallback(() => {
    const rows = buildOverviewExportRows({
      selectedDays,
      health,
      vehicles,
      drivers,
      trips,
      kilometers,
      money,
      utilization,
      downtime,
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Overview');
    XLSX.writeFile(wb, `fleet-overview-${selectedDays}d.xlsx`);
  }, [money, health, vehicles, drivers, trips, kilometers, utilization, downtime, selectedDays]);

  return (
    <PageShell
      title="Overview"
      subtitle="Fleet performance and operational health"
      freshnessAt={lastUpdated}
      actions={
        <OverviewActions
          selectedDays={selectedDays}
          onRangeChange={setSelectedDays}
          onRefresh={handleRefresh}
          onExport={handleExport}
          refreshing={isLoading}
        />
      }
    >
      {isLoading && !summaryData ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'color-mix(in srgb, var(--critical) 14%, transparent)' }}
          >
            <AlertTriangle size={32} style={{ color: 'var(--critical)' }} />
          </div>
          <p className="text-lg font-medium" style={{ color: 'var(--cluster-text)' }}>
            Something went wrong
          </p>
          <p className="max-w-md text-sm text-dim">{error}</p>
          <button onClick={handleRefresh} className="ov-btn ov-btn--primary mt-2">
            Try again
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Executive summary — the 5-second read */}
          <KpiRail
            vehicles={vehicles}
            drivers={drivers}
            trips={trips}
            kilometers={kilometers}
            health={health}
            riskMoney={riskMoney}
          />

          {/* Command deck — health & financial exposure */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PanelErrorBoundary name="health">
              <FleetHealthPanel health={health} loading={healthLoading} error={healthError} />
            </PanelErrorBoundary>
            <PanelErrorBoundary name="financial">
              <FinancialImpactPanel money={money} loading={moneyLoading} error={moneyError} />
            </PanelErrorBoundary>
          </div>

          {/* Operations — what needs attention & which vehicles */}
          <SectionHeader title="Operations" question="What requires attention right now?" />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-5">
              <PanelErrorBoundary name="action-center">
                <ActionCenter
                  utilization={utilization}
                  downtime={downtime}
                  money={money}
                  loading={moneyLoading || utilLoading || downLoading}
                />
              </PanelErrorBoundary>
            </div>
            <div className="xl:col-span-7">
              <PanelErrorBoundary name="vehicle-attention">
                <VehicleAttentionTable
                  money={money}
                  downtime={downtime}
                  utilization={utilization}
                  loading={moneyLoading || downLoading}
                />
              </PanelErrorBoundary>
            </div>
          </div>

          {/* Efficiency — utilization & downtime risk */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PanelErrorBoundary name="utilization">
              <UtilizationPanel utilization={utilization} loading={utilLoading} />
            </PanelErrorBoundary>
            <PanelErrorBoundary name="downtime">
              <DowntimePanel
                downtime={downtime}
                totalVehicles={vehicles?.total || 0}
                loading={downLoading}
              />
            </PanelErrorBoundary>
          </div>

          {/* Live tracking */}
          <SectionHeader title="Live Tracking" question="Real-time positions" />
          <LiveVehicleMap />

          {/* Analytics — secondary detail */}
          <AnalyticsSection
            fuel={fuel}
            fuelAnalytics={fuelAnalytics}
            financials={financials}
            driverPerformance={driverPerformance}
          />
        </div>
      )}
    </PageShell>
  );
};

export default OverviewPage;
