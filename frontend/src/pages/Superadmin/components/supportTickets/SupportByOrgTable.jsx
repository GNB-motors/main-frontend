import DataTable from '../../../../components/ui/DataTable';
import { relativeTime } from '../../../../lib/supportTicket';

const count = (key, tone) => ({
  key,
  align: 'right',
  render: (row) =>
    row[key] > 0 ? (
      <span className={`sat-count sat-count--${tone}`}>{row[key]}</span>
    ) : (
      <span className="sat-zero">0</span>
    ),
});

const COLUMNS = [
  {
    key: 'companyName',
    label: 'Organization',
    render: (row) => <strong>{row.companyName}</strong>,
  },
  { ...count('unread', 'unread'), label: 'Unread' },
  { ...count('open', 'open'), label: 'Open' },
  { ...count('awaitingCustomer', 'awaiting'), label: 'Awaiting customer' },
  { ...count('solved', 'solved'), label: 'Solved' },
  { key: 'all', label: 'All', align: 'right' },
  {
    key: 'lastActivityAt',
    label: 'Last activity',
    render: (row) => relativeTime(row.lastActivityAt),
  },
];

/** One row per organization with ticket counts; clicking a row opens its tickets. */
export default function SupportByOrgTable({ query, onSelectOrg }) {
  const rows = query.data || [];
  return (
    <DataTable
      columns={COLUMNS}
      rows={rows}
      rowKey={(row) => row.orgId}
      loading={query.loading}
      error={query.error}
      onRetry={query.refetch}
      showing={rows.length}
      total={rows.length}
      onRowClick={(row) => onSelectOrg(row.orgId)}
      emptyTitle="No organization has raised a ticket"
      emptyHint="Tickets raised from the headset icon in the app show up here, grouped by organization."
    />
  );
}
