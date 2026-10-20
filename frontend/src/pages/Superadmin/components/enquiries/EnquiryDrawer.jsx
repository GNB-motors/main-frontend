import { useState } from 'react';
import { Mail, Phone, X } from 'lucide-react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../../../components/ui/sheet';
import { label } from '../../../../lib/vocabulary';
import { ENQUIRY_STATUSES, fleetSizeLabel, topicLabel } from '../../../../lib/enquiry';
import { formatWhen } from '../../../../lib/supportTicket';
import { EnquiryAdminService } from './EnquiryAdminService';

function Row({ title, children }) {
  return (
    <div className="enq-row">
      <dt>{title}</dt>
      <dd>{children || <span className="sat-sub">Not given</span>}</dd>
    </div>
  );
}

/** Everything the prospect sent, with call/email shortcuts and the status switch. */
export default function EnquiryDrawer({ enquiry, onClose, onUpdated }) {
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');

  const setStatus = async (status) => {
    if (!enquiry || status === enquiry.status || saving) return;
    setSaving(status);
    setError('');
    try {
      onUpdated(await EnquiryAdminService.updateStatus({ id: enquiry._id, status }));
    } catch (err) {
      setError(err?.displayMessage || 'Could not change the status.');
    } finally {
      setSaving('');
    }
  };

  return (
    <Sheet
      open={Boolean(enquiry)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-full !max-w-[460px] gap-0 p-0">
        <SheetHeader className="shrink-0 items-start gap-3">
          <div className="min-w-0 flex flex-col gap-1.5">
            <SheetTitle>{enquiry?.name || '—'}</SheetTitle>
            <SheetDescription className="text-xs">
              {enquiry?.company || 'No company given'} · received {formatWhen(enquiry?.createdAt)}
            </SheetDescription>
          </div>
          <SheetClose className="enq-icon-btn" aria-label="Close">
            <X size={16} />
          </SheetClose>
        </SheetHeader>

        {enquiry ? (
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
            <div className="enq-actions">
              {enquiry.phone ? (
                <a className="enq-action enq-action--primary" href={`tel:${enquiry.phone}`}>
                  <Phone size={15} aria-hidden="true" /> Call {enquiry.phone}
                </a>
              ) : null}
              {enquiry.email ? (
                <a
                  className={`enq-action${enquiry.phone ? '' : ' enq-action--primary'}`}
                  href={`mailto:${enquiry.email}?subject=${encodeURIComponent('Your enquiry to GNB')}`}
                >
                  <Mail size={15} aria-hidden="true" /> Email
                </a>
              ) : null}
            </div>

            <section>
              <div className="enq-section-title" id="enq-status-label">
                Status
              </div>
              <div className="enq-status" role="group" aria-labelledby="enq-status-label">
                {ENQUIRY_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={enquiry.status === status}
                    className={enquiry.status === status ? 'is-active' : ''}
                    disabled={Boolean(saving)}
                    onClick={() => setStatus(status)}
                  >
                    {saving === status ? 'Saving…' : label('enquiryStatus', status)}
                  </button>
                ))}
              </div>
              {enquiry.statusChangedBy?.name ? (
                <div className="sat-sub enq-status-meta">
                  Last changed by {enquiry.statusChangedBy.name},{' '}
                  {formatWhen(enquiry.statusChangedAt)}
                </div>
              ) : null}
              {error ? (
                <div className="enq-error" role="alert">
                  {error}
                </div>
              ) : null}
            </section>

            <section>
              <div className="enq-section-title">Details</div>
              <dl className="enq-details">
                <Row title="Email">{enquiry.email}</Row>
                <Row title="Phone">{enquiry.phone}</Row>
                <Row title="Fleet size">{fleetSizeLabel(enquiry.fleetSize)}</Row>
                <Row title="Operates in">{enquiry.region}</Row>
                <Row title="Wants to talk about">
                  {enquiry.topics?.length ? enquiry.topics.map(topicLabel).join(', ') : null}
                </Row>
              </dl>
            </section>

            <section>
              <div className="enq-section-title">Message</div>
              {enquiry.message ? (
                <p className="enq-message">{enquiry.message}</p>
              ) : (
                <p className="sat-sub">No message.</p>
              )}
            </section>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
