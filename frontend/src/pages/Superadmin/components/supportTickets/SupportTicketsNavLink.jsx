import { LifeBuoy } from 'lucide-react';
import CountBadgeNavLink from '../CountBadgeNavLink';
import { SupportAdminService } from './SupportAdminService';

/** Sidebar entry for the support inbox; the badge counts tickets support hasn't read. */
export default function SupportTicketsNavLink({ onNavigate }) {
  return (
    <CountBadgeNavLink
      to="/superadmin/support-tickets"
      icon={<LifeBuoy size={20} />}
      label="Support Tickets"
      countLabel="unread"
      fetchCount={SupportAdminService.unreadCount}
      onNavigate={onNavigate}
    />
  );
}
