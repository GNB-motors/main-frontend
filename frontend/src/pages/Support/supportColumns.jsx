import StatusChip from '../../components/ui/StatusChip';
import { label } from '../../lib/vocabulary';
import { formatDay, priorityTone, relativeTime, statusTone } from '../../lib/supportTicket';

/** DataTable columns for the org's request list. */
export default function supportColumns() {
  return [
    {
      key: 'subject',
      label: 'Subject',
      render: (row) => (
        <div className="sp-subject-cell">
          {row.unreadForOrg ? (
            <span className="sp-unread-dot" title="New reply from support" aria-label="New reply" />
          ) : null}
          <div className="min-w-0">
            <div className={`sp-subject${row.unreadForOrg ? ' sp-subject--unread' : ''}`}>
              {row.subject}
            </div>
            <div className="sp-subject-sub">
              {row.ticketNumber}
              {row.requester?.name ? ` · ${row.requester.name}` : ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => label('supportCategory', row.category),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusChip group="supportStatus" value={row.status} tone={statusTone(row.status)} />
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => (
        <StatusChip
          group="supportPriority"
          value={row.priority}
          tone={priorityTone(row.priority)}
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      sortKey: 'createdAt',
      render: (row) => formatDay(row.createdAt),
    },
    {
      key: 'lastActivityAt',
      label: 'Last activity',
      sortable: true,
      sortKey: 'lastActivityAt',
      render: (row) => (
        <span title={row.lastActivityBy === 'SUPPORT' ? 'GNB Support replied' : undefined}>
          {relativeTime(row.lastActivityAt)}
          {row.lastActivityBy === 'SUPPORT' ? ' · support' : ''}
        </span>
      ),
    },
  ];
}
