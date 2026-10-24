import { useState } from 'react';
import { Headset, Mail, Phone, X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '../../components/ui/dialog';
import SupportRequestsView from './SupportRequestsView';
import TicketThread from './TicketThread';
import NewRequestDialog from './NewRequestDialog';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from './supportContact';
import './SupportPortal.css';

/**
 * Full-screen Support Portal, opened from the headset icon in the header.
 * Built on Dialog for focus trapping, Esc and stacking above the app shell.
 */
export default function SupportPortal({ open, onOpenChange, onActivity, initialTicketId = null }) {
  const [view, setView] = useState(
    initialTicketId ? { kind: 'ticket', id: initialTicketId } : { kind: 'list' },
  );
  // null | { subject } — the "Submit a request" dialog and its prefill.
  const [compose, setCompose] = useState(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sp-portal">
        <header className="sp-portal-header">
          <div className="sp-portal-brand">
            <span className="sp-portal-logo" aria-hidden="true">
              <Headset size={20} />
            </span>
            <div className="min-w-0">
              <DialogTitle className="sp-portal-name">GNB Support</DialogTitle>
              <div className="sp-portal-contact">
                <a href={`tel:${SUPPORT_PHONE}`}>
                  <Phone size={13} aria-hidden="true" />
                  {SUPPORT_PHONE}
                </a>
                <a href={`mailto:${SUPPORT_EMAIL}`}>
                  <Mail size={13} aria-hidden="true" />
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
          </div>
          <DialogClose className="sp-portal-close" aria-label="Close support">
            <X size={20} />
          </DialogClose>
        </header>

        <div className="sp-portal-body">
          {view.kind === 'list' ? (
            <SupportRequestsView
              onOpenTicket={(id) => setView({ kind: 'ticket', id })}
              onNewRequest={() => setCompose({ subject: '' })}
            />
          ) : (
            <TicketThread
              key={view.id}
              ticketId={view.id}
              onBack={() => setView({ kind: 'list' })}
              onRaiseFollowUp={(subject) => setCompose({ subject })}
              onActivity={onActivity}
            />
          )}
        </div>

        {compose ? (
          <NewRequestDialog
            initialSubject={compose.subject}
            onClose={() => setCompose(null)}
            onCreated={(ticket) => {
              setCompose(null);
              setView({ kind: 'ticket', id: ticket._id });
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
