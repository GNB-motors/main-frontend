import { Check } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import { Button } from '../../components/ui/button';
import { formatDateTimeIST } from '../../utils/dateUtils';
import { SOURCE_LABELS, sinceLabel, subjectTitle } from './inboxModel';

export default function AlertInboxTable({ items, total, pending, onSelect, onReview }) {
  const columns = [
    {
      key: 'subject',
      label: 'Vehicle / subject',
      width: 170,
      render: (item) => (
        <button
          type="button"
          className="ai-table-subject"
          aria-label={`View details for ${subjectTitle(item.subjectLabel)}: ${item.label}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(item);
          }}
        >
          {subjectTitle(item.subjectLabel)}
        </button>
      ),
    },
    {
      key: 'issue',
      label: 'Issue and next step',
      render: (item) => (
        <div className="ai-table-issue">
          <strong>{item.label}</strong>
          <p>{item.wants || 'Check the reports below and confirm with your team.'}</p>
          <span>
            {[
              ...new Set(
                (item.sources || []).map(
                  (source) => SOURCE_LABELS[source.source] || 'Other source',
                ),
              ),
            ].join(' · ')}
          </span>
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      width: 125,
      render: (item) => (
        <span className={`ai-priority ai-priority--${item.severity}`}>
          {item.severity === 'critical'
            ? 'Critical'
            : item.severity === 'caution'
              ? 'Needs review'
              : 'Info'}
        </span>
      ),
    },
    {
      key: 'reported',
      label: 'Last reported',
      width: 140,
      render: (item) => (
        <div
          className="ai-table-time"
          title={item.lastSeenAt ? formatDateTimeIST(item.lastSeenAt) : undefined}
        >
          <span>{sinceLabel(item.lastSeenAt)}</span>
          {item.lastSeenAt ? <small>{formatDateTimeIST(item.lastSeenAt)}</small> : null}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Review',
      width: 170,
      render: (item) => (
        <div className="ai-table-actions">
          {item.status === 'OPEN' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ai-mark-reviewed"
              title="Use after checking this alert. Moves it to Reviewed without resolving the issue."
              disabled={pending.has(item.id)}
              onClick={(event) => {
                event.stopPropagation();
                onReview(item.id);
              }}
            >
              <Check size={14} aria-hidden="true" />
              {pending.has(item.id) ? 'Saving…' : 'Mark as reviewed'}
            </Button>
          ) : (
            <span className="ai-table-reviewed">
              <Check size={14} aria-hidden="true" />
              Reviewed
            </span>
          )}
        </div>
      ),
    },
  ];
  return (
    <DataTable
      className="ai-table"
      columns={columns}
      rows={items}
      rowKey={(item) => item.id}
      total={total}
      showing={items.length}
      rowClassName={(item) => (item.status === 'ACKNOWLEDGED' ? 'ai-table-row--reviewed' : '')}
      onRowClick={onSelect}
      toolbarExtra={
        <span className="ai-table-hint">Click an issue to view its reports and next step</span>
      }
    />
  );
}
