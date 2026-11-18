import { useEffect, useState } from 'react';
import ApprovalService from '../pages/ErpApprovals/ApprovalService';
import BillApprovalsService from '../pages/ErpBillApprovals/BillApprovalsService';

const POLL_MS = 30000;
const NONE = { approvals: 0, bills: 0 };

// requireFeature answers 404 for a module the org has not enabled. Flags are read
// once per page load, so a tab opened before a module was switched off kept
// polling a 404 every 30 s; a 404 now retires that feed until the next load.
const isGone = (result) => result.status === 'rejected' && result.reason?.status === 404;

/** New count on success, 0 once the feed is gone, otherwise keep the last value. */
function nextCount(result, feedGone, previous, read) {
  if (result.status === 'fulfilled' && result.value) return read(result.value);
  return feedGone ? 0 : previous;
}

/**
 * Sidebar badge counts: pending ERP approvals and pending driver bills,
 * polled every 30 s while `enabled`. A failed poll keeps the last value; the
 * next tick retries. Each poll cancels the one before it, and unmount aborts.
 *
 * The poll stops while the tab is hidden — a background tab costs a request
 * every 30 s for a badge nobody is looking at — and reads once when the tab
 * comes back into view.
 */
export default function useApprovalBadges(enabled) {
  const [counts, setCounts] = useState(NONE);

  useEffect(() => {
    if (!enabled) {
      setCounts(NONE);
      return undefined;
    }
    let controller = null;
    let interval = null;
    const gone = { approvals: false, bills: false };
    const poll = async () => {
      controller?.abort();
      controller = new AbortController();
      const { signal } = controller;
      const [summary, bills] = await Promise.allSettled([
        gone.approvals ? Promise.resolve(null) : ApprovalService.getSummary({ signal }),
        gone.bills
          ? Promise.resolve(null)
          : BillApprovalsService.list({ status: 'PENDING', limit: 1 }, { signal }),
      ]);
      if (signal.aborted) return;
      if (isGone(summary)) gone.approvals = true;
      if (isGone(bills)) gone.bills = true;
      if (gone.approvals && gone.bills) clearInterval(interval);
      setCounts((prev) => ({
        approvals: nextCount(summary, gone.approvals, prev.approvals, (v) => v.data?.total || 0),
        bills: nextCount(bills, gone.bills, prev.bills, (v) => v.total || 0),
      }));
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const startPolling = () => {
      if (interval) return;
      interval = setInterval(() => {
        // A hidden tab is nobody's business: nobody reads the badge.
        if (document.hidden) return;
        poll();
      }, POLL_MS);
    };
    // Back in view: the tab may have been asleep for minutes, so the badge
    // catches up with one read before the old cadence resumes.
    const onVisibility = () => {
      if (document.hidden) {
        stopPolling();
        return;
      }
      poll();
      startPolling();
    };

    if (!document.hidden) {
      poll();
      startPolling();
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibility);
      controller?.abort();
    };
  }, [enabled]);

  return counts;
}
