import { CheckCircle2, RotateCcw, Clock3 } from 'lucide-react';
import { label } from '../../lib/vocabulary';
import { formatWhen } from '../../lib/supportTicket';
import AttachmentList from './AttachmentList';
import './support.css';

const SUPPORT_NAME = 'GNB Support';

function authorName(message, viewer, selfUserId) {
  if (message.authorType === 'SUPPORT') {
    return viewer === 'org' ? SUPPORT_NAME : `${message.author?.name || 'Support'} (support)`;
  }
  if (viewer === 'org' && selfUserId && message.author?.userId === selfUserId) return 'You';
  return message.author?.name || 'Customer';
}

function statusSentence(name, change, statusGroup) {
  if (change.to === 'SOLVED') return `${name} marked this solved`;
  if (change.from === 'SOLVED') return `${name} reopened this`;
  return `${name} set it to ${label(statusGroup, change.to)}`;
}

const STATUS_ICON = { SOLVED: CheckCircle2, OPEN: RotateCcw, AWAITING_CUSTOMER: Clock3 };

/**
 * One entry in a ticket thread. `viewer` decides which side is "mine" and how
 * support is named: the org sees "GNB Support", the support desk sees who replied.
 */
export default function MessageBubble({ message, viewer, selfUserId = null }) {
  const name = authorName(message, viewer, selfUserId);
  const statusGroup = viewer === 'org' ? 'supportStatus' : 'supportStatusAdmin';
  const change = message.statusChange;

  if (message.kind === 'STATUS' && change) {
    const Icon = STATUS_ICON[change.to] || Clock3;
    return (
      <div className="sp-system-line">
        <Icon size={13} aria-hidden="true" />
        <span>
          {statusSentence(name, change, statusGroup)} · {formatWhen(message.createdAt)}
        </span>
      </div>
    );
  }

  const mine =
    (viewer === 'org' && message.authorType === 'ORG') ||
    (viewer === 'support' && message.authorType === 'SUPPORT');

  return (
    <>
      <div className={`sp-msg ${mine ? 'sp-msg--mine' : 'sp-msg--theirs'}`}>
        <div className="sp-msg-meta">
          <span className="sp-msg-author">{name}</span>
          <span>{formatWhen(message.createdAt)}</span>
        </div>
        {message.body ? <div className="sp-msg-body">{message.body}</div> : null}
        <AttachmentList attachments={message.attachments} />
      </div>
      {change ? (
        <div className="sp-system-line">
          <span>{statusSentence(name, change, statusGroup)}</span>
        </div>
      ) : null}
    </>
  );
}
