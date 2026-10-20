import { Inbox } from 'lucide-react';
import CountBadgeNavLink from '../CountBadgeNavLink';
import { ENQUIRIES_CHANGED_EVENT, EnquiryAdminService } from './EnquiryAdminService';

/** Sidebar entry for Contact-page enquiries; the badge counts ones nobody has picked up. */
export default function EnquiriesNavLink({ onNavigate }) {
  return (
    <CountBadgeNavLink
      to="/superadmin/enquiries"
      icon={<Inbox size={20} />}
      label="Enquiries"
      countLabel="new"
      fetchCount={EnquiryAdminService.newCount}
      refreshEvent={ENQUIRIES_CHANGED_EVENT}
      onNavigate={onNavigate}
    />
  );
}
