import { describe, expect, it } from 'vitest';
import { erpPlanTracking } from './erpPlanTracking';

describe('ERP tracking explanations', () => {
  it('distinguishes unavailable detection from a truck that has not moved', () => {
    expect(erpPlanTracking({ source: 'ERP', trackingReason: 'PICKUP_NOT_TRACKED' })).toBe(
      'Pickup not tracked by trip detection',
    );
    expect(erpPlanTracking({ source: 'ERP', trackingReason: 'WAITING_GPS' })).toBe(
      'Waiting for GPS evidence',
    );
  });
  it('explains conflicts, queued jobs, and manual suppression', () => {
    for (const reason of ['LINK_CONFLICT', 'WAITING_START', 'AUTO_MATCH_DISABLED']) {
      expect(erpPlanTracking({ source: 'ERP', trackingReason: reason })).not.toBe(reason);
    }
    expect(erpPlanTracking({ source: 'MANUAL' })).toBe('');
  });
});
