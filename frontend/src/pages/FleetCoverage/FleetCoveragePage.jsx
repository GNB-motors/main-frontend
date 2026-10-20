import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import useApi from '../../hooks/useApi';
import FleetDataService from '../../services/FleetDataService';
import { VehicleService } from '../Profile/VehicleService.js';
import EmptyState from '../../components/cluster/EmptyState';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import NewButton from '../../components/ui/NewButton';
import { useConfirm } from '../../components/ui/confirmContext';
import { activeFilterCount, footerSummary } from '../../lib/tableState';
import { humanise } from '../../lib/vocabulary';
import { formatNum, formatPct } from '../../utils/formatters';
import { formatDateIST } from '../../utils/dateUtils';
import { getProfileField, getUserRole } from '../../utils/session.js';
import {
  ADD_TO_FLEET_ROLES,
  isAddableRegistration,
  toVehiclePayload,
  edgeRowKey,
  selectedRowsFrom,
} from './fleetCoverageActions.js';
import StatTile from './StatTile.jsx';
import CoverageTabs from './CoverageTabs.jsx';
import EdgeOnlyPanel from './EdgeOnlyPanel.jsx';
import MasterOnlyPanel from './MasterOnlyPanel.jsx';

export default function FleetCoveragePage() {
  const navigate = useNavigate();
  const location = useLocation();
  // Reached from Settings (or Vehicle 360) → go back there. Opened cold from a
  // bookmark/refresh there is no in-app history, so fall back to Settings,
  // where this page's entry point lives.
  const goBack = () =>
    location.key !== 'default' ? navigate(-1) : navigate('/settings?section=fleet-data');
  const { data, loading, error, refetch } = useApi(
    (signal) => FleetDataService.getFleetCoverage(signal),
    [],
  );
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [addingKey, setAddingKey] = useState(null);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [activeTab, setActiveTab] = useState('edge');

  const canAddVehicles = ADD_TO_FLEET_ROLES.includes(getUserRole());
  const businessRefId = getProfileField('business_ref_id') || null;

  const summary = data?.summary || {};
  const onlyEdge = useMemo(() => data?.onlyInFleetEdge || [], [data]);
  const onlyMaster = useMemo(() => data?.onlyInFleetMaster || [], [data]);
  const linkedCount = summary.linked ?? (data?.linked || []).length;

  // Both lists are fully loaded in one payload, so the search is client-side
  // and applies to both tables at once.
  const onlyEdgeFiltered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return onlyEdge;
    return onlyEdge.filter((v) =>
      [
        v.registrationNumber,
        v.vehicleModel,
        v.manufacturer,
        v.fuelType,
        v.emissionNorm,
        v.lobName,
        v.accountName,
      ].some((value) => value != null && String(value).toLowerCase().includes(needle)),
    );
  }, [onlyEdge, q]);

  const handleAddOne = async (row) => {
    const key = edgeRowKey(row, onlyEdgeFiltered.indexOf(row));
    setAddingKey(key);
    try {
      await VehicleService.addVehicle(businessRefId, toVehiclePayload(row));
      toast.success(`${row.registrationNumber} added to fleet`);
      refetch();
    } catch (err) {
      const msg = err?.body?.errors?.[0]?.error || err?.message || 'Could not add this vehicle.';
      toast.error(`${row.registrationNumber}: ${msg}`);
    } finally {
      setAddingKey(null);
    }
  };

  const handleAddSelected = async () => {
    const rowsToAdd = selectedRowsFrom(onlyEdgeFiltered, selectedKeys);
    if (rowsToAdd.length === 0) return;

    const ok = await confirm({
      title: `Add ${rowsToAdd.length} vehicle${rowsToAdd.length === 1 ? '' : 's'} to fleet?`,
      body: 'Each becomes a real vehicle record with a globally unique registration number — this cannot be undone as a batch.',
      confirmLabel: `Add ${rowsToAdd.length}`,
    });
    if (!ok) return;

    setBulkAdding(true);
    setBulkResult(null);
    try {
      const resp = await VehicleService.addBulkVehicles(
        businessRefId,
        rowsToAdd.map(toVehiclePayload),
        {},
      );
      const result = resp?.data ?? resp;
      setBulkResult(result);
      toast.success(
        `Added ${result?.createdCount ?? 0} vehicle(s), ${result?.errors?.length ?? 0} error(s)`,
      );
      setSelectedKeys(new Set());
      refetch();
    } catch (err) {
      toast.error(err?.message || 'Bulk add failed.');
    } finally {
      setBulkAdding(false);
    }
  };

  const edgeColumns = [
    {
      key: 'registrationNumber',
      label: 'Vehicle',
      render: (v) => <span className="reg-plate">{v.registrationNumber || 'NA'}</span>,
    },
    { key: 'vehicleModel', label: 'Model', render: (v) => v.vehicleModel || '—' },
    { key: 'manufacturer', label: 'Manufacturer', render: (v) => v.manufacturer || '—' },
    { key: 'fuelType', label: 'Fuel', render: (v) => v.fuelType || '—' },
    { key: 'emissionNorm', label: 'Emission', render: (v) => v.emissionNorm || '—' },
    { key: 'lobName', label: 'LOB', render: (v) => v.lobName || '—' },
    { key: 'accountName', label: 'Account', render: (v) => v.accountName || '—' },
    {
      key: 'lastSeenAt',
      label: 'Last seen',
      type: 'date',
      render: (v) => formatDateIST(v.lastSeenAt),
    },
    ...(canAddVehicles
      ? [
          {
            key: '_add',
            label: '',
            render: (v, i) => {
              const addable = isAddableRegistration(v.registrationNumber);
              return (
                <NewButton
                  variant="tertiary"
                  size="xs"
                  text="Add to fleet"
                  disabled={!addable}
                  loading={addingKey === edgeRowKey(v, i)}
                  title={
                    addable
                      ? undefined
                      : 'FleetEdge reported no registration number for this vehicle'
                  }
                  onClick={() => handleAddOne(v)}
                />
              );
            },
          },
        ]
      : []),
  ];

  const EDGE_EXPORT_COLUMNS = edgeColumns.filter((c) => c.key !== '_add');

  const onlyMasterFiltered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return onlyMaster;
    return onlyMaster.filter((v) =>
      [v.registrationNumber, v.model, v.manufacturer, v.status, v.fleetEdgeRegistration].some(
        (value) => value != null && String(value).toLowerCase().includes(needle),
      ),
    );
  }, [onlyMaster, q]);

  // Fleet-master status is an UPPER_SNAKE enum — humanise it once so neither
  // the table nor the export ever renders it raw.
  const onlyMasterRows = useMemo(
    () => onlyMasterFiltered.map((v) => ({ ...v, statusLabel: humanise(v.status) || '—' })),
    [onlyMasterFiltered],
  );

  const coveragePct =
    summary.inFleetEdge > 0 ? (100 * (summary.linked ?? 0)) / summary.inFleetEdge : null;
  const noDirectory = !loading && !error && data && summary.inFleetEdge === 0;

  const skeleton = (
    <div className="flex flex-col gap-2 p-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="cluster-inset h-10 animate-pulse" />
      ))}
    </div>
  );

  const searching = q.trim() !== '';

  return (
    <PageShell
      className="cluster-page"
      title={
        <span className="inline-flex items-center gap-2.5">
          <button
            type="button"
            onClick={goBack}
            className="cluster-inset inline-flex items-center justify-center rounded-lg p-1.5 text-xs transition hover:opacity-75"
            style={{ color: 'var(--cluster-text-dim)' }}
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </button>
          <span>FleetEdge Coverage</span>
        </span>
      }
      subtitle="Vehicles your FleetEdge account reports vs vehicles in your fleet master."
      filters={
        <FilterBar
          searchValue={q}
          onSearchChange={setQ}
          searchPlaceholder="Search registration, model, manufacturer…"
          activeCount={activeFilterCount({ q })}
          onClear={() => setQ('')}
        />
      }
      footer={`${footerSummary({
        showing: onlyEdgeFiltered.length + onlyMasterFiltered.length,
        total: onlyEdge.length + onlyMaster.length,
        activeFilters: activeFilterCount({ q }),
      })} · search filters both lists`}
    >
      <PanelErrorBoundary name="fleet-coverage">
        {loading && !data ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="cluster-inset h-20 animate-pulse" />
              ))}
            </div>
            <div className="cluster-panel mt-4">{skeleton}</div>
          </>
        ) : error && !data ? (
          <div className="cluster-panel">
            <EmptyState
              title="Coverage data unavailable"
              hint="Connect FleetEdge from the GNB Edge Chrome extension and its vehicle directory appears here."
            />
          </div>
        ) : noDirectory ? (
          <div className="cluster-panel">
            <EmptyState
              title="No FleetEdge directory data"
              hint="Connect FleetEdge from the GNB Edge Chrome extension and its vehicle directory appears here."
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Linked" value={formatNum(linkedCount)} tone="var(--ok)" />
              <StatTile
                label="Only in FleetEdge"
                value={formatNum(summary.onlyFleetEdge ?? onlyEdge.length)}
                tone="var(--caution)"
              />
              <StatTile
                label="Only in fleet master"
                value={formatNum(summary.onlyFleetMaster ?? onlyMaster.length)}
                tone="var(--inert)"
              />
              <StatTile
                label="Coverage"
                value={coveragePct == null ? '—' : formatPct(coveragePct)}
                tone="var(--cluster-text)"
              />
            </div>

            <div className="mt-6 space-y-4">
              <CoverageTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onlyEdgeFiltered={onlyEdgeFiltered}
                onlyMasterFiltered={onlyMasterFiltered}
              />

              {activeTab === 'edge' ? (
                <EdgeOnlyPanel
                  q={q}
                  searching={searching}
                  canAddVehicles={canAddVehicles}
                  selectedKeys={selectedKeys}
                  setSelectedKeys={setSelectedKeys}
                  bulkAdding={bulkAdding}
                  handleAddSelected={handleAddSelected}
                  bulkResult={bulkResult}
                  setBulkResult={setBulkResult}
                  onlyEdge={onlyEdge}
                  onlyEdgeFiltered={onlyEdgeFiltered}
                  edgeColumns={edgeColumns}
                  EDGE_EXPORT_COLUMNS={EDGE_EXPORT_COLUMNS}
                />
              ) : (
                <MasterOnlyPanel
                  q={q}
                  searching={searching}
                  onlyMaster={onlyMaster}
                  onlyMasterFiltered={onlyMasterFiltered}
                  onlyMasterRows={onlyMasterRows}
                />
              )}

              <p className="text-dim text-xs">
                {formatNum(linkedCount)} vehicle{linkedCount === 1 ? '' : 's'} linked and reporting
                normally.
                {summary.staleFleetEdge > 0
                  ? ` ${formatNum(summary.staleFleetEdge)} older FleetEdge record${summary.staleFleetEdge === 1 ? '' : 's'} not counted — the account was unlinked or FleetEdge hasn't reported ${summary.staleFleetEdge === 1 ? 'it' : 'them'} for 7 days.`
                  : ''}
              </p>
            </div>
          </>
        )}
      </PanelErrorBoundary>
    </PageShell>
  );
}
