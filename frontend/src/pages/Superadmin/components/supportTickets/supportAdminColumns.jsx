import StatusChip from '../../../../components/ui/StatusChip';
import { label } from '../../../../lib/vocabulary';
import { formatDay, priorityTone, relativeTime, statusTone } from '../../../../lib/supportTicket';

/** DataTable columns for the super-admin ticket inbox. */
export default function supportAdminColumns() {
  return [
    {
      key: 'ticket',
      label: 'Ticket',
      render: (row) => (
        <div className="sat-ticket-cell">
          {row.unreadForSupport ? (
            <span className="sat-unread-dot" title="Unread customer activity" aria-label="Unread" />
          ) : null}
          <div className="min-w-0">
            <div className={`sat-subject${row.unreadForSupport ? ' sat-subject--unread' : ''}`}>
              {row.subject}
            </div>
            <div className="sat-sub">{row.ticketNumber}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'org',
      label: 'Organization',
      render: (row) => row.org?.companyName || '—',
    },
    {
      key: 'requester',
      label: 'Requester',
      render: (row) => (
        <div>
          <div>{row.requester?.name || '—'}</div>
          <div className="sat-sub">{label('role', row.requester?.role, '')}</div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => label('supportCategory', row.category),
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
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusChip group="supportStatusAdmin" value={row.status} tone={statusTone(row.status)} />
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
      render: (row) =>
        `${relativeTime(row.lastActivityAt)} · ${row.lastActivityBy === 'SUPPORT' ? 'support' : 'customer'}`,
    },
  ];
}
