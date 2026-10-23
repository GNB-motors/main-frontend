import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PageHeader } from '../../../Drivers/Component';
import { Button } from '../../../../components/ui/button';
import StatusChip from '../../../../components/ui/StatusChip';
import MessageBubble from '../../../../components/support/MessageBubble';
import ReplyComposer from '../../../../components/support/ReplyComposer';
import SupportSelect from '../../../../components/support/SupportSelect';
import TicketPurgeNotice from '../../../../components/support/TicketPurgeNotice';
import { useApi } from '../../../../hooks/useApi';
import { useMutation } from '../../../../hooks/useMutation';
import { label } from '../../../../lib/vocabulary';
import {
  SUPPORT_STATUSES,
  buildReplyForm,
  priorityTone,
  purgeState,
  statusTone,
} from '../../../../lib/supportTicket';
import { getUserRole } from '../../../../utils/session';
import SupportTicketMetaCard from './SupportTicketMetaCard';
import { SupportAdminService } from './SupportAdminService';
import './SupportTickets.css';

const REPLY_STATUS_OPTIONS = SUPPORT_STATUSES.map((s) => ({
  value: s,
  label: `Then set: ${label('supportStatusAdmin', s)}`,
}));

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

/** One ticket for the support desk: the thread, a reply box that also sets status, and the meta panel. */
export default function SupportTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fetched = useApi((signal) => SupportAdminService.get(id, { signal }), [id]);
  // The ticket the last reply/update returned; fresher than the first load.
  const [latest, setLatest] = useState(null);
  const [replyStatus, setReplyStatus] = useState('AWAITING_CUSTOMER');
  const replying = useMutation((payload, { signal }) =>
    SupportAdminService.reply(payload, { signal }),
  );
  const updating = useMutation((payload, { signal }) =>
    SupportAdminService.update(payload, { signal }),
  );

  useEffect(() => {
    if (getUserRole() !== 'SUPER_ADMIN') navigate('/profile');
  }, [navigate]);

  const ticket = latest?._id === id ? latest : fetched.data;

  const reloadAfterConflict = (err) => {
    if (err?.status === 409) {
      setLatest(null);
      fetched.refetch();
    }
  };

  const send = async (body, files) => {
    try {
      const next = await replying.mutate({
        id,
        form: buildReplyForm(body, files, { status: replyStatus }),
      });
      if (next) {
        setLatest(next);
        setReplyStatus('AWAITING_CUSTOMER');
        toast.success('Reply sent');
      }
    } catch (err) {
      reloadAfterConflict(err);
      throw err;
    }
  };

  const change = async (changes) => {
    try {
      const next = await updating.mutate({ id, changes });
      if (next) {
        setLatest(next);
        toast.success('Ticket updated');
      }
    } catch (err) {
      reloadAfterConflict(err);
      toast.error(err?.displayMessage || 'Could not update the ticket');
    }
  };

  if (!ticket) {
    return (
      <div className="sat-page">
        <PageHeader
          backLabel="Support Tickets"
          backPath="/superadmin/support-tickets"
          title="Support ticket"
          description=""
        />
        <div className="sat-state" role={fetched.error ? 'alert' : undefined}>
          {fetched.error ? (
            <>
              <p>{fetched.error.displayMessage || 'Could not load this ticket.'}</p>
              <Button variant="outline" size="sm" onClick={fetched.refetch}>
                Try again
              </Button>
            </>
          ) : (
            'Loading ticket…'
          )}
        </div>
      </div>
    );
  }

  const locked = purgeState(ticket).kind === 'purged';

  return (
    <div className="sat-page">
      <PageHeader
        backLabel="Support Tickets"
        backPath="/superadmin/support-tickets"
        currentLabel={ticket.ticketNumber}
        title={ticket.subject}
        description={`${ticket.org?.companyName || 'Organization'} · ${label('supportCategory', ticket.category)}`}
      />

      <div className="sat-detail">
        <div className="sat-detail-main">
          <div className="sat-chips">
            <StatusChip
              group="supportStatusAdmin"
              value={ticket.status}
              tone={statusTone(ticket.status)}
            />
            <StatusChip
              group="supportPriority"
              value={ticket.priority}
              tone={priorityTone(ticket.priority)}
            />
            <span className="sat-sub">{ticket.messageCount || 0} replies</span>
          </div>

          <TicketPurgeNotice ticket={ticket} audience="support" />

          {locked ? null : (
            <>
              <div className="sp-thread">
                <MessageBubble message={requestAsMessage(ticket)} viewer="support" />
                {(ticket.messages || []).map((message) => (
                  <MessageBubble key={message._id} message={message} viewer="support" />
                ))}
              </div>
              <ReplyComposer
                onSend={send}
                sending={replying.loading}
                error={replying.error}
                placeholder="Reply as GNB Support…"
                extra={
                  <SupportSelect
                    value={replyStatus}
                    onChange={(value) => setReplyStatus(value || 'AWAITING_CUSTOMER')}
                    options={REPLY_STATUS_OPTIONS}
                    ariaLabel="Status after reply"
                    className="min-w-[220px]"
                  />
                }
              />
            </>
          )}
        </div>

        <SupportTicketMetaCard
          ticket={ticket}
          locked={locked}
          saving={updating.loading}
          onChange={change}
        />
      </div>
    </div>
  );
}
