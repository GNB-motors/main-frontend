import { Clock3, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { formatDay, purgeState } from '../../lib/supportTicket';
import './support.css';

/**
 * Solved tickets lose their conversation after a grace period. Before that the
 * notice says when; after it, the thread is gone and the notice replaces it.
 */
export default function TicketPurgeNotice({ ticket, audience = 'org', onRaiseFollowUp = null }) {
  const state = purgeState(ticket);
  if (state.kind === 'none') return null;

  if (state.kind === 'scheduled') {
    return (
      <div className="sp-notice sp-notice--scheduled" role="status">
        <Clock3 size={16} aria-hidden="true" />
        <span>
          {audience === 'org'
            ? `Solved. This conversation will be deleted on ${formatDay(state.purgeAt)}. Reply before then to reopen it.`
            : `Solved. The conversation and its files are deleted on ${formatDay(state.purgeAt)} unless the customer replies.`}
        </span>
      </div>
    );
  }

  return (
    <div className="sp-notice sp-notice--purged">
      <Trash2 size={20} aria-hidden="true" />
      <span className="sp-notice-title">Conversation deleted</span>
      <span>
        Solved on {formatDay(state.solvedAt)}. The messages and attachments were deleted on{' '}
        {formatDay(state.purgedAt)}.
      </span>
      {onRaiseFollowUp ? (
        <Button variant="outline" size="sm" onClick={onRaiseFollowUp}>
          Raise a new request
        </Button>
      ) : null}
    </div>
  );
}
