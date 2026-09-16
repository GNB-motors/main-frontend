import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import useApi from '../../hooks/useApi';
import FleetDataService from '../../services/FleetDataService';
import { VehicleService } from '../Profile/VehicleService.jsx';
import BulkUploadVehiclesResultSummary from '../Profile/bulkUploadVehiclesResultSummary.jsx';
import EmptyState from '../../components/cluster/EmptyState';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import NewButton from '../../components/ui/NewButton';
import { useConfirm } from '../../components/ui/confirmContext';
import { activeFilterCount, footerSummary } from '../../lib/tableState';
import { humanise } from '../../lib/vocabulary';
import { formatNum, formatPct } from '../../utils/formatters';
import { formatDateIST } from '../../utils/dateUtils';
import { getToken, getProfileField, getUserRole } from '../../utils/session.js';
import {
  ADD_TO_FLEET_ROLES,
  isAddableRegistration,
  toVehiclePayload,
  edgeRowKey,
  selectedRowsFrom,
} from './fleetCoverageActions.js';

function StatTile({ label, value, tone }) {
  return (
    <div className="cluster-inset flex flex-col gap-1 p-4">
      <span className="cluster-eyebrow">{label}</span>
      <span className="num text-xl font-bold" style={{ color: tone }}>
        {value}
      </span>
    </div>
  );
}

function TableShell({ title, caption, actions = null, children }) {
  return (
    <div className="cluster-panel overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-2">
        <div className="min-w-0">
          <h2 className="cluster-title text-sm">{title}</h2>
          {caption ? <p className="text-dim mt-1 text-xs leading-relaxed">{caption}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

// Column defs — key matches the row field for both display and export.
const masterColumns = [
  {
    key: 'registrationNumber',
    label: 'Vehicle',
    render: (v) => <span className="reg-plate">{v.registrationNumber}</span>,
  },
  { key: 'model', label: 'Model', render: (v) => v.model || '—' },
  { key: 'manufacturer', label: 'Manufacturer', render: (v) => v.manufacturer || '—' },
  { key: 'statusLabel', label: 'Status', render: (v) => v.statusLabel },
  {
    key: 'fleetEdgeRegistration',
    label: 'FleetEdge reg.',
    render: (v) => v.fleetEdgeRegistration || '—',
  },
];

export default function FleetCoveragePage() {
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
      await VehicleService.addVehicle(businessRefId, toVehiclePayload(row), getToken());
      toast.success(`${row.registrationNumber} added to fleet`);
      refetch();
    } catch (err) {
      const msg =
        err?.detail || err?.errors?.[0]?.error || err?.message || 'Could not add this vehicle.';
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
        getToken(),
      );
      const result = resp?.data ?? resp;
      setBulkResult(result);
      toast.success(
        `Added ${result?.createdCount ?? 0} vehicle(s), ${result?.errors?.length ?? 0} error(s)`,
      );
      setSelectedKeys(new Set());
      refetch();
    } catch (err) {
      toast.error(err?.detail || err?.message || 'Bulk add failed.');
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
      title="FleetEdge Coverage"
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
              hint="Link a FleetEdge account (Settings → FleetEdge accounts) and its vehicle directory appears here."
            />
          </div>
        ) : noDirectory ? (
          <div className="cluster-panel">
            <EmptyState
              title="No FleetEdge directory data"
              hint="Link a FleetEdge account (Settings → FleetEdge accounts) and its vehicle directory appears here."
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

            <div className="mt-4 space-y-4">
              <TableShell
                title="On FleetEdge, not in your fleet"
                caption="These vehicles stream data to your FleetEdge account, but they are invisible to mileage, trips and alerts until you add them to your fleet."
                actions={
                  <div className="flex items-center gap-2">
                    {canAddVehicles && selectedKeys.size > 0 ? (
                      <NewButton
                        variant="primary"
                        size="sm"
                        text={`Add ${selectedKeys.size} to fleet`}
                        loading={bulkAdding}
                        onClick={handleAddSelected}
                      />
                    ) : null}
                    <ExportButton
                      rows={onlyEdgeFiltered}
                      columns={EDGE_EXPORT_COLUMNS}
                      filename="fleet-coverage-fleetedge-only"
                      meta={{
                        filters: [
                          { label: 'Search', value: q.trim() || '—' },
                          { label: 'List', value: 'On FleetEdge, not in your fleet' },
                        ],
                        generatedAt: new Date(),
                      }}
                    />
                  </div>
                }
              >
                {onlyEdgeFiltered.length === 0 ? (
                  <div className="px-4 pb-4">
                    <EmptyState
                      title={searching ? 'No vehicles match your search' : 'No gap here'}
                      hint={
                        searching
                          ? 'Try a different registration number, model or manufacturer.'
                          : 'Every vehicle on your FleetEdge account is already in your fleet master.'
                      }
                    />
                  </div>
                ) : (
                  <DataTable
                    columns={edgeColumns}
                    rows={onlyEdgeFiltered}
                    rowKey={edgeRowKey}
                    showing={onlyEdgeFiltered.length}
                    total={onlyEdge.length}
                    activeFilters={activeFilterCount({ q })}
                    emptyTitle="No vehicles match your search"
                    selectable={canAddVehicles}
                    selectedKeys={selectedKeys}
                    onSelectionChange={setSelectedKeys}
                    isRowSelectable={(v) => isAddableRegistration(v.registrationNumber)}
                  />
                )}
                {bulkResult ? (
                  <div className="px-4 pb-4">
                    <BulkUploadVehiclesResultSummary result={bulkResult} />
                    <button
                      type="button"
                      className="text-dim mt-2 text-xs underline"
                      onClick={() => setBulkResult(null)}
                    >
                      Dismiss
                    </button>
                  </div>
                ) : null}
              </TableShell>

              <TableShell
                title="In fleet master, not on FleetEdge"
                caption="These vehicles exist in your fleet master but your FleetEdge account doesn't report them. Check the registration number or the device mapping."
                actions={
                  <ExportButton
                    rows={onlyMasterRows}
                    columns={masterColumns}
                    filename="fleet-coverage-master-only"
                    meta={{
                      filters: [
                        { label: 'Search', value: q.trim() || '—' },
                        { label: 'List', value: 'In fleet master, not on FleetEdge' },
                      ],
                      generatedAt: new Date(),
                    }}
                  />
                }
              >
                {onlyMasterFiltered.length === 0 ? (
                  <div className="px-4 pb-4">
                    <EmptyState
                      title={searching ? 'No vehicles match your search' : 'No gap here'}
                      hint={
                        searching
                          ? 'Try a different registration number, model or manufacturer.'
                          : 'Every vehicle in your fleet master is reporting through FleetEdge.'
                      }
                    />
                  </div>
                ) : (
                  <DataTable
                    columns={masterColumns}
                    rows={onlyMasterRows}
                    rowKey={(v) => v.registrationNumber}
                    showing={onlyMasterRows.length}
                    total={onlyMaster.length}
                    activeFilters={activeFilterCount({ q })}
                    emptyTitle="No vehicles match your search"
                  />
                )}
              </TableShell>

              <p className="text-dim text-xs">
                {formatNum(linkedCount)} vehicle{linkedCount === 1 ? '' : 's'} linked and reporting
                normally.
              </p>
            </div>
          </>
        )}
      </PanelErrorBoundary>
    </PageShell>
  );
}
