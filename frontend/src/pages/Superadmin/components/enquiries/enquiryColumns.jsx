import StatusChip from '../../../../components/ui/StatusChip';
import { enquiryStatusTone, fleetSizeLabel, topicLabel } from '../../../../lib/enquiry';
import { formatWhen, relativeTime } from '../../../../lib/supportTicket';

/** DataTable columns for the super-admin enquiry inbox. */
export default function enquiryColumns() {
  return [
    {
      key: 'person',
      label: 'From',
      render: (row) => {
        const fresh = row.status === 'NEW';
        return (
          <div className="sat-ticket-cell">
            {fresh ? <span className="sat-unread-dot" title="Not picked up yet" /> : null}
            <div className="min-w-0">
              <div className={`sat-subject${fresh ? ' sat-subject--unread' : ''}`}>{row.name}</div>
              <div className="sat-sub">{row.company || 'No company given'}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (row) => (
        <div className="enq-contact">
          {row.email ? <div>{row.email}</div> : null}
          {row.phone ? <div className={row.email ? 'sat-sub' : ''}>{row.phone}</div> : null}
        </div>
      ),
    },
    {
      key: 'fleetSize',
      label: 'Fleet',
      render: (row) => fleetSizeLabel(row.fleetSize),
    },
    {
      key: 'topics',
      label: 'Wants to talk about',
      render: (row) =>
        row.topics?.length ? (
          <div className="enq-topics">
            {row.topics.map((t) => (
              <span key={t} className="enq-topic">
                {topicLabel(t)}
              </span>
            ))}
          </div>
        ) : (
          <span className="sat-sub">—</span>
        ),
    },
    {
      key: 'createdAt',
      label: 'Received',
      sortable: true,
      sortKey: 'createdAt',
      render: (row) => <span title={formatWhen(row.createdAt)}>{relativeTime(row.createdAt)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusChip group="enquiryStatus" value={row.status} tone={enquiryStatusTone(row.status)} />
      ),
    },
  ];
}
