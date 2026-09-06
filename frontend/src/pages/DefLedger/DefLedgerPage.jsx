import { useMemo, useState } from 'react';
import useApi from '../../hooks/useApi';
import FleetDataService from '../../services/FleetDataService';
import SlideOver from '../../components/cluster/SlideOver';
import EmptyState from '../../components/cluster/EmptyState';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import FreshnessBadge from '../../components/cluster/FreshnessBadge';
import PageShell from '../../components/ui/PageShell';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import { formatLitres, formatNum } from '../../utils/formatters';
import { formatDateTimeIST } from '../../utils/dateUtils';

const EXPORT_COLUMNS = [
  { key: 'registrationNumber', label: 'Vehicle' },
  { key: 'claimedAdblueL', label: 'Claimed L', type: 'number' },
  { key: 'telemetryDefL', label: 'Consumed L', type: 'number' },
  { key: 'expectedBalanceL', label: 'Balance L', type: 'number' },
  { key: 'flagCount', label: 'Flags', type: 'number' },
];

function humanizeFlagType(type) {
  if (!type) return 'Flag';
  const s = String(type).toLowerCase().replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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

function FlagsDrawer({ vehicle, onClose }) {
  const flags = vehicle?.flags || [];
  return (
    <SlideOver
      open={Boolean(vehicle)}
      onClose={onClose}
      title={vehicle ? `DEF flags — ${vehicle.registrationNumber}` : ''}
      subtitle={
        vehicle
          ? `${formatNum(vehicle.flagCount ?? flags.length)} flag${(vehicle.flagCount ?? flags.length) === 1 ? '' : 's'} · balance ${formatLitres(vehicle.expectedBalanceL)}`
          : ''
      }
    >
      {flags.length === 0 ? (
        <EmptyState
          title="No flags on this vehicle"
          hint="Claimed DEF and measured consumption are in line. Flags appear here when a persistent gap shows up."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {flags.map((f, i) => (
            <div key={`${f.type}-${f.at}-${i}`} className="cluster-inset flex flex-col gap-1.5 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="lamp lamp--caution">{humanizeFlagType(f.type)}</span>
                {f.litres != null ? (
                  <span className="num text-xs font-semibold">{formatLitres(f.litres)}</span>
                ) : null}
              </div>
              <p className="text-sm leading-relaxed">{f.message}</p>
              <span className="num text-dim text-[11px]">{formatDateTimeIST(f.at)}</span>
            </div>
          ))}
        </div>
      )}
    </SlideOver>
  );
}

export default function DefLedgerPage() {
  const [selected, setSelected] = useState(null);

  const { data, loading, error, refetch } = useApi(
    (signal) => FleetDataService.getDefLedger(signal),
    [],
  );

  const vehicles = useMemo(() => data?.vehicles || [], [data]);
  const totals = data?.totals || {};

  const columns = [
    {
      key: 'registrationNumber',
      label: 'Vehicle',
      render: (v) => <span className="reg-plate">{v.registrationNumber}</span>,
    },
    {
      key: 'claimedAdblueL',
      label: 'Claimed',
      align: 'right',
      render: (v) => formatLitres(v.claimedAdblueL),
    },
    {
      key: 'telemetryDefL',
      label: 'Consumed',
      align: 'right',
      render: (v) => formatLitres(v.telemetryDefL),
    },
    {
      key: 'expectedBalanceL',
      label: 'Balance',
      align: 'right',
      render: (v) => {
        const balance = v.expectedBalanceL;
        const balanceTone = balance != null && balance < 0 ? 'var(--critical)' : 'var(--ok)';
        return (
          <span className="font-semibold" style={{ color: balanceTone }}>
            {formatLitres(balance)}
          </span>
        );
      },
    },
    {
      key: 'flags',
      label: 'Flags',
      render: (v) => {
        const flagCount = v.flagCount ?? (v.flags || []).length;
        return flagCount > 0 ? (
          <span className="lamp lamp--caution">
            {formatNum(flagCount)} flag{flagCount === 1 ? '' : 's'}
          </span>
        ) : (
          <span className="lamp lamp--ok">clear</span>
        );
      },
    },
    {
      key: 'lastComputedAt',
      label: 'Computed',
      render: (v) => <FreshnessBadge at={v.lastComputedAt} always prefix="Computed" />,
    },
  ];

  return (
    <div className="cluster-page">
      <PageShell
        title="AdBlue / DEF Ledger"
        subtitle="Claimed (billed) DEF vs what the vehicles actually consumed. A persistent gap is where tamper shows up."
        count={totals.vehicles ?? vehicles.length}
        actions={
          <ExportButton
            rows={vehicles}
            columns={EXPORT_COLUMNS}
            filename="def-ledger"
            disabled={!vehicles.length}
          />
        }
        footer="Balance is claimed minus consumed. A negative balance means the vehicle used more DEF than was billed — please review those vehicles first."
      >
        <PanelErrorBoundary name="def-ledger">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Vehicles"
              value={formatNum(totals.vehicles ?? vehicles.length)}
              tone="var(--cluster-text)"
            />
            <StatTile
              label="Flagged"
              value={formatNum(totals.flagged ?? 0)}
              tone="var(--caution)"
            />
            <StatTile
              label="Claimed"
              value={formatLitres(totals.claimedAdblueL)}
              tone="var(--cluster-text)"
            />
            <StatTile
              label="Consumed"
              value={formatLitres(totals.telemetryDefL)}
              tone="var(--cluster-text)"
            />
          </div>

          <div className="mt-4">
            <DataTable
              columns={columns}
              rows={vehicles}
              rowKey={(v) => v.vehicleId || v.registrationNumber}
              loading={loading}
              error={error && !data ? error : null}
              onRetry={refetch}
              showing={vehicles.length}
              total={totals.vehicles ?? vehicles.length}
              onRowClick={(v) => setSelected(v)}
              emptyTitle="No DEF data yet"
              emptyHint="The ledger fills in as DEF bills and CAN consumption data arrive."
            />
          </div>
        </PanelErrorBoundary>
      </PageShell>

      <FlagsDrawer vehicle={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
