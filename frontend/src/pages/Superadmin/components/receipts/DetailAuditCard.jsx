import { User, Phone } from 'lucide-react';
import { fmtDate, fmtRelativeTime } from './receiptFormat';

const DetailAuditCard = ({ submitter, draft }) => (
  <div className="ra-section-card" style={{ marginTop: 16 }}>
    <div className="ra-section-card__title">
      <User size={15} /> Submitter &amp; Audit Trail
    </div>
    <div className="ra-grid-props">
      <div className="ra-prop">
        <span className="ra-prop__label">Submitted by (Driver)</span>
        <span className="ra-prop__val">{submitter}</span>
      </div>
      <div className="ra-prop">
        <span className="ra-prop__label">WhatsApp Contact</span>
        <span className="ra-prop__val font-mono">
          <Phone size={11} style={{ marginRight: 3, display: 'inline' }} />
          {draft?.phoneE164 || draft?.waId || '—'}
        </span>
      </div>
      <div className="ra-prop">
        <span className="ra-prop__label">Submission Received</span>
        <span className="ra-prop__val">
          {fmtDate(draft?.createdAt)} ({fmtRelativeTime(draft?.createdAt)})
        </span>
      </div>
      <div className="ra-prop">
        <span className="ra-prop__label">Organization</span>
        <span className="ra-prop__val">{draft?.orgId?.companyName || '—'}</span>
      </div>
      {draft?.status === 'PUBLISHED' && (
        <div className="ra-prop ra-prop--full">
          <span className="ra-prop__label">Audit: Published by</span>
          <span className="ra-prop__val" style={{ color: 'var(--emerald-500, #10B981)' }}>
            {[draft?.publishedBy?.firstName, draft?.publishedBy?.lastName]
              .filter(Boolean)
              .join(' ') || 'Admin'}{' '}
            on {fmtDate(draft?.publishedAt)}. Log ID: {draft?.publishedFuelLogId || 'Created'}
          </span>
        </div>
      )}
      {draft?.status === 'REJECTED' && (
        <div className="ra-prop ra-prop--full">
          <span className="ra-prop__label">Audit: Rejection Reason</span>
          <span className="ra-prop__val" style={{ color: 'var(--rose-500, #EF4444)' }}>
            {draft?.rejectReason || 'No reason specified'}
          </span>
        </div>
      )}
      {draft?.status === 'CLEARED' && (
        <div className="ra-prop ra-prop--full">
          <span className="ra-prop__label">Audit: Cleared Note</span>
          <span className="ra-prop__val">{draft?.clearNote || 'Cleared from inbox'}</span>
        </div>
      )}
    </div>
  </div>
);

export default DetailAuditCard;
