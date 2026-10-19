import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import { Button } from '../../components/ui/button';
import StatusChip from '../../components/ui/StatusChip';
import MessageBubble from '../../components/support/MessageBubble';
import ReplyComposer from '../../components/support/ReplyComposer';
import TicketPurgeNotice from '../../components/support/TicketPurgeNotice';
import { label } from '../../lib/vocabulary';
import {
  PURGE_AFTER_DAYS,
  buildReplyForm,
  followUpSubject,
  formatWhen,
  priorityTone,
  purgeState,
  statusTone,
} from '../../lib/supportTicket';
import { getUserId } from '../../utils/session';
import { SupportService } from './SupportService';

/** The request itself, shown as the first entry of the thread. */
const requestAsMessage = (ticket) => ({
  _id: `${ticket._id}-request`,
  kind: 'REPLY',
  authorType: 'ORG',
  author: ticket.requester,
  body: ticket.description,
  attachments: ticket.attachments,
  statusChange: null,
  createdAt: ticket.createdAt,
});

/** One ticket inside the portal: its conversation, the reply box, and "mark as solved". */
export default function TicketThread({ ticketId, onBack, onRaiseFollowUp, onActivity }) {
  const fetched = useApi((signal) => SupportService.get(ticketId, { signal }), [ticketId]);
  // The ticket a reply/solve returned; fresher than the first load.
  const [latest, setLatest] = useState(null);
  const [confirmingSolve, setConfirmingSolve] = useState(false);
  const replying = useMutation((payload, { signal }) => SupportService.reply(payload, { signal }));
  const solving = useMutation((id, { signal }) => SupportService.solve(id, { signal }));

  const ticket = latest || fetched.data;
  const selfUserId = getUserId();

  // Opening the thread marks support's replies read; the header badge should follow.
  useEffect(() => {
    if (fetched.data) onActivity?.();
  }, [fetched.data, onActivity]);

  const reloadAfterConflict = (err) => {
    if (err?.status === 409) {
      setLatest(null);
      fetched.refetch();
    }
  };

  const send = async (body, files) => {
    try {
      const next = await replying.mutate({ id: ticketId, form: buildReplyForm(body, files) });
      if (next) setLatest(next);
    } catch (err) {
      reloadAfterConflict(err);
      throw err;
    }
  };

  const solve = async () => {
    try {
      const next = await solving.mutate(ticketId);
      if (next) setLatest(next);
      setConfirmingSolve(false);
    } catch (err) {
      reloadAfterConflict(err);
    }
  };

  if (!ticket) {
    return (
      <div className="sp-view sp-thread-view">
        <button type="button" className="sp-back" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          All requests
        </button>
        {fetched.error ? (
          <div className="sp-state" role="alert">
            <p>{fetched.error.displayMessage || 'Could not load this request.'}</p>
            <Button variant="outline" size="sm" onClick={fetched.refetch}>
              Try again
            </Button>
          </div>
        ) : (
          <div className="sp-state">Loading request…</div>
        )}
      </div>
    );
  }

  const purged = purgeState(ticket).kind === 'purged';
  const canSolve = !purged && ticket.status !== 'SOLVED';

  return (
    <div className="sp-view sp-thread-view">
      <button type="button" className="sp-back" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        All requests
      </button>

      <header className="sp-ticket-head">
        <div className="min-w-0">
          <div className="sp-ticket-number">
            {ticket.ticketNumber} · {label('supportCategory', ticket.category)}
          </div>
          <h2 className="sp-title sp-ticket-subject">{ticket.subject}</h2>
          <div className="sp-ticket-chips">
            <StatusChip
              group="supportStatus"
              value={ticket.status}
              tone={statusTone(ticket.status)}
            />
            <StatusChip
              group="supportPriority"
              value={ticket.priority}
              tone={priorityTone(ticket.priority)}
            />
          </div>
          <div className="sp-ticket-meta">
            Raised by {ticket.requester?.name || 'a teammate'} on {formatWhen(ticket.createdAt)}
            {ticket.vehicle?.registrationNumber ? ` · ${ticket.vehicle.registrationNumber}` : ''}
          </div>
        </div>

        {canSolve && !confirmingSolve ? (
          <Button variant="outline" onClick={() => setConfirmingSolve(true)}>
            <CheckCircle2 size={16} aria-hidden="true" />
            Mark as solved
          </Button>
        ) : null}
        {canSolve && confirmingSolve ? (
          <div className="sp-confirm" role="group" aria-label="Confirm mark as solved">
            <span>
              Mark this solved? The conversation and its files are deleted {PURGE_AFTER_DAYS} days
              later unless someone replies.
            </span>
            <div className="sp-confirm-actions">
              <Button variant="ghost" size="sm" onClick={() => setConfirmingSolve(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={solve} disabled={solving.loading}>
                {solving.loading ? 'Saving…' : 'Yes, mark solved'}
              </Button>
            </div>
            {solving.error ? (
              <p className="sp-field-errors" role="alert">
                {solving.error.displayMessage || 'Could not update the request.'}
              </p>
            ) : null}
          </div>
        ) : null}
      </header>

      <TicketPurgeNotice
        ticket={ticket}
        audience="org"
        onRaiseFollowUp={purged ? () => onRaiseFollowUp(followUpSubject(ticket)) : null}
      />

      {purged ? null : (
        <>
          <div className="sp-thread">
            <MessageBubble
              message={requestAsMessage(ticket)}
              viewer="org"
              selfUserId={selfUserId}
            />
            {(ticket.messages || []).map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                viewer="org"
                selfUserId={selfUserId}
              />
            ))}
          </div>
          <ReplyComposer
            onSend={send}
            sending={replying.loading}
            error={replying.error}
            placeholder={
              ticket.status === 'SOLVED'
                ? 'Reply to reopen this request…'
                : 'Write a reply to GNB Support…'
            }
          />
        </>
      )}
    </div>
  );
}
