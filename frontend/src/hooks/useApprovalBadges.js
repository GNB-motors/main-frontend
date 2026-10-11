import { useEffect, useState } from 'react';
import ApprovalService from '../pages/ErpApprovals/ApprovalService';
import BillApprovalsService from '../pages/ErpBillApprovals/BillApprovalsService';

const POLL_MS = 30000;
const NONE = { approvals: 0, bills: 0 };

/**
 * Sidebar badge counts: pending ERP approvals and pending driver bills,
 * polled every 30 s while `enabled`. A failed poll keeps the last value; the
 * next tick retries. Each poll cancels the one before it, and unmount aborts.
 */
export default function useApprovalBadges(enabled) {
  const [counts, setCounts] = useState(NONE);

  useEffect(() => {
    if (!enabled) {
      setCounts(NONE);
      return undefined;
    }
    let controller = null;
    const poll = async () => {
      controller?.abort();
      controller = new AbortController();
      const { signal } = controller;
      const [summary, bills] = await Promise.allSettled([
        ApprovalService.getSummary({ signal }),
        BillApprovalsService.list({ status: 'PENDING', limit: 1 }, { signal }),
      ]);
      if (signal.aborted) return;
      setCounts((prev) => ({
        approvals:
          summary.status === 'fulfilled' ? summary.value?.data?.total || 0 : prev.approvals,
        bills: bills.status === 'fulfilled' ? bills.value?.total || 0 : prev.bills,
      }));
    };
    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      clearInterval(interval);
      controller?.abort();
    };
  }, [enabled]);

  return counts;
}
