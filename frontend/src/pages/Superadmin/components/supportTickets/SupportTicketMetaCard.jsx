import { Link } from 'react-router-dom';
import SupportSelect from '../../../../components/support/SupportSelect';
import { label } from '../../../../lib/vocabulary';
import {
  SUPPORT_PRIORITIES,
  SUPPORT_STATUSES,
  formatDay,
  formatWhen,
} from '../../../../lib/supportTicket';

const STATUS_OPTIONS = SUPPORT_STATUSES.map((s) => ({
  value: s,
  label: label('supportStatusAdmin', s),
}));
const PRIORITY_OPTIONS = SUPPORT_PRIORITIES.map((p) => ({
  value: p,
  label: label('supportPriority', p),
}));

const metaRow = (name, value) => (
  <div className="sat-meta-row">
    <dt>{name}</dt>
    <dd>{value || '—'}</dd>
  </div>
);

/** Right-hand panel of a ticket: who raised it, from where, and the status/priority controls. */
export default function SupportTicketMetaCard({ ticket, locked, saving, onChange }) {
  const person = ticket.requesterUser || {};
  const requesterName =
    [person.firstName, person.lastName].filter(Boolean).join(' ') || ticket.requester?.name;
  const context = ticket.context || {};

  let purgeRow = null;
  if (ticket.purgedAt) purgeRow = metaRow('Conversation deleted', formatDay(ticket.purgedAt));
  else if (ticket.purgeAt) purgeRow = metaRow('Conversation deletes', formatDay(ticket.purgeAt));

  return (
    <aside className="sat-meta">
      <section className="sat-meta-section">
        <h3>Ticket</h3>
        <div className="sat-meta-controls">
          <div className="sat-meta-control">
            <span>Status</span>
            <SupportSelect
              value={ticket.status}
              onChange={(status) => status && onChange({ status })}
              options={STATUS_OPTIONS}
              ariaLabel="Status"
              className="w-full"
              disabled={locked || saving}
            />
          </div>
          <div className="sat-meta-control">
            <span>Priority</span>
            <SupportSelect
              value={ticket.priority}
              onChange={(priority) => priority && onChange({ priority })}
              options={PRIORITY_OPTIONS}
              ariaLabel="Priority"
              className="w-full"
              disabled={locked || saving}
            />
          </div>
        </div>
        <dl>
          {metaRow('Category', label('supportCategory', ticket.category))}
          {metaRow('Vehicle', ticket.vehicle?.registrationNumber)}
          {metaRow('Created', formatWhen(ticket.createdAt))}
          {metaRow('Last activity', formatWhen(ticket.lastActivityAt))}
          {ticket.solvedAt ? metaRow('Solved', formatWhen(ticket.solvedAt)) : null}
          {purgeRow}
        </dl>
      </section>

      <section className="sat-meta-section">
        <h3>Organization</h3>
        <dl>
          {metaRow(
            'Name',
            ticket.org ? (
              <Link to={`/superadmin/organizations/${ticket.orgId}`}>{ticket.org.companyName}</Link>
            ) : null,
          )}
          {metaRow('Owner email', ticket.org?.ownerEmail)}
        </dl>
      </section>

      <section className="sat-meta-section">
        <h3>Requester</h3>
        <dl>
          {metaRow('Name', requesterName)}
          {metaRow('Role', label('role', person.role || ticket.requester?.role, ''))}
          {metaRow('Email', person.email || ticket.requester?.email)}
          {metaRow('Mobile', person.mobileNumber || ticket.requester?.mobile)}
          {person.status && person.status !== 'ACTIVE'
            ? metaRow('Account', label('userStatus', person.status))
            : null}
        </dl>
      </section>

      {context.pageUrl || context.userAgent ? (
        <section className="sat-meta-section">
          <h3>Raised from</h3>
          <dl>
            {metaRow('Page', context.pageUrl ? <code>{context.pageUrl}</code> : null)}
            {metaRow(
              'Browser',
              context.userAgent ? (
                <span className="sat-ua" title={context.userAgent}>
                  {context.userAgent}
                </span>
              ) : null,
            )}
          </dl>
        </section>
      ) : null}
    </aside>
  );
}
