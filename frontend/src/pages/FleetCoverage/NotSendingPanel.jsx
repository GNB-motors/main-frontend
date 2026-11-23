import { useMemo } from 'react';
import EmptyState from '../../components/cluster/EmptyState';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import TableShell from './TableShell.jsx';
import {
  DASH,
  SIGNAL_REASONS,
  accountLabel,
  formatFixRate,
  formatLastFix,
  groupRowsByReason,
  reasonLabel,
  signalRowKey,
} from './notSendingLogic.js';

/** Reg, reason, last fix, fixes/day against the org's own normal, account. */
const buildColumns = (asOf) => [
  { key: 'registrationNumber', label: 'Reg. No.', render: (row) => row.registrationNumber || DASH },
  { key: 'reason', label: 'Reason', render: (row) => reasonLabel(row.reason) },
  { key: 'lastFixAt', label: 'Last fix', render: (row) => formatLastFix(row.lastFixAt, asOf) },
  { key: 'fixesPerDay7d', label: 'Fixes/day', render: (row) => formatFixRate(row) },
  { key: 'account', label: 'Account', render: (row) => accountLabel(row.account) },
];

// The exporter reads raw row fields (key -> value), so the export carries
// flattened columns rather than the render functions above.
const EXPORT_COLUMNS = [
  { key: 'registrationNumber', label: 'Registration Number' },
  { key: 'reason', label: 'Reason' },
  { key: 'lastFixAt', label: 'Last Fix At', type: 'date' },
  { key: 'fixesPerDay7d', label: 'Fixes per day (7d)', type: 'number' },
  { key: 'orgP10', label: 'Org normal (p10)', type: 'number' },
  { key: 'accountName', label: 'Account' },
];

const exportRows = (rows) =>
  rows.map((row) => ({
    ...row,
    reason: reasonLabel(row.reason),
    accountName: accountLabel(row.account),
  }));

export default function NotSendingPanel({ signal }) {
  const asOf = signal?.asOf ?? null;
  const counts = signal?.counts ?? {};
  const rows = useMemo(() => signal?.rows ?? [], [signal]);
  const groups = useMemo(() => groupRowsByReason(rows), [rows]);
  const columns = useMemo(() => buildColumns(asOf), [asOf]);

  // Nothing has come back yet — the page's own skeleton covers the wait.
  if (!signal) return null;

  const faultCount = SIGNAL_REASONS.filter((reason) => reason.key !== 'LIVE').reduce(
    (sum, reason) => sum + (counts[reason.key] ?? 0),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="cluster-panel px-4 py-4">
        <h2 className="cluster-title text-sm">Trucks not sending</h2>
        <p className="text-dim mt-1 text-xs leading-relaxed">
          Every truck your telematics accounts report on, split by why it went quiet.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SIGNAL_REASONS.map((reason) => (
            <span
              key={reason.key}
              className="cluster-inset inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
            >
              <span className="text-dim">{reason.label}</span>
              <span className="num font-bold">{counts[reason.key] ?? 0}</span>
            </span>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="cluster-panel">
          <EmptyState
            title={faultCount > 0 ? 'Truck details are still loading' : 'Every truck is sending'}
            hint={
              faultCount > 0
                ? 'The counts above are known, but the truck details have not come back yet.'
                : 'No truck in your fleet is missing fixes right now. This list fills as soon as one goes quiet.'
            }
          />
        </div>
      ) : (
        groups.map((group) => (
          <TableShell
            key={group.key}
            title={`${group.label} (${group.rows.length})`}
            caption={group.meaning}
            actions={
              <ExportButton
                rows={exportRows(group.rows)}
                columns={EXPORT_COLUMNS}
                filename={`fleet-coverage-not-sending-${group.key.toLowerCase()}`}
                meta={{
                  filters: [{ label: 'Reason', value: group.label }],
                  generatedAt: new Date(),
                }}
              />
            }
          >
            <p className="px-4 pb-2 text-xs" style={{ color: 'var(--ds-ink2)' }}>
              What to do: {group.action}
            </p>
            <DataTable
              columns={columns}
              rows={group.rows}
              rowKey={signalRowKey}
              showing={group.rows.length}
              total={group.rows.length}
              activeFilters={0}
              emptyTitle="No trucks in this group"
              selectable={false}
            />
          </TableShell>
        ))
      )}
    </div>
  );
}
