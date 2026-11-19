import { OwnerAlertsService } from './OwnerAlertsService';
import { getBranchId, getOrgId } from '../../utils/session';

/**
 * One owner-alert feed for everything that needs it.
 *
 * The bell (the unread critical count) and the live alert list want the same
 * answer — the open alerts of the last day — and each used to read it
 * separately: two requests, one answer, and the server building the feed
 * twice. The store keeps the read in flight and hands the same answer to
 * everyone who asks while it runs.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** The open alerts of the last 24 h (the feed's page cap is 100). */
export const openAlertsParams = (now = Date.now()) => ({
  acknowledged: false,
  from: new Date(now - DAY_MS).toISOString(),
  limit: 100,
});

/** The scope a read belongs to: another branch is another answer. */
const sessionScope = () => `${getOrgId() || ''}|${getBranchId() || ''}`;

let inFlight = null; // { scope, promise }

export const ownerAlertsFeed = {
  /**
   * The one read for the open alerts.
   *
   * The caller that arrives while a read is running joins it instead of
   * starting another. `scope` says whose answer this is (a branch switch is
   * another answer); `force` asks for a fresh read anyway.
   */
  load({ scope = null, now = Date.now(), signal, force = false } = {}) {
    const key = scope ?? sessionScope();
    if (!force && inFlight && inFlight.scope === key) return inFlight.promise;
    const promise = OwnerAlertsService.getAlerts(openAlertsParams(now), signal)
      .then((data) => {
        if (inFlight?.promise === promise) inFlight = null;
        return data;
      })
      .catch((error) => {
        if (inFlight?.promise === promise) inFlight = null;
        throw error;
      });
    inFlight = { scope: key, promise };
    return promise;
  },

  /** Forget the read in flight (a sign-out, or a test). */
  reset() {
    inFlight = null;
  },
};

export default ownerAlertsFeed;
