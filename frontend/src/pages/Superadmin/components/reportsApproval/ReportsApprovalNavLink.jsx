import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import CountBadgeNavLink from '../CountBadgeNavLink';
import {
  REPORTS_APPROVAL_CHANGED_EVENT,
  ReportsApprovalAdminService,
} from './ReportsApprovalAdminService';

/** Sidebar entry for Super Admin Reports Approval; the badge counts reports pending review. */
export default function ReportsApprovalNavLink({ onNavigate }) {
  return (
    <CountBadgeNavLink
      to="/superadmin/reports-approval"
      icon={<ClipboardCheck size={20} />}
      label="Reports Approval"
      countLabel="pending"
      fetchCount={ReportsApprovalAdminService.unreadCount}
      refreshEvent={REPORTS_APPROVAL_CHANGED_EVENT}
      onNavigate={onNavigate}
    />
  );
}

