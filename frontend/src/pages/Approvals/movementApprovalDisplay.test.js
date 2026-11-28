import { expect, it } from 'vitest';
import { approvalWindow, approvalValidity, approvalPlace } from './movementApprovalDisplay';

it('shows named places and exact IST time windows', () => {
  const a = {
    placeName: 'Dalmia gate',
    window: { from: '2026-11-27T06:30:00Z', to: '2026-11-27T08:30:00Z' },
  };
  expect(approvalPlace(a)).toBe('Dalmia gate');
  expect(approvalWindow(a)).toContain('IST');
  expect(approvalWindow(a)).toMatch(/12:00/);
});
it('distinguishes stored activation from effective validity', () => {
  const a = {
    status: 'ACTIVE',
    window: { from: '2026-11-27T06:30:00Z', to: '2026-11-27T08:30:00Z' },
  };
  expect(approvalValidity(a, Date.parse('2026-11-27T06:00:00Z'))).toBe('UPCOMING');
  expect(approvalValidity(a, Date.parse('2026-11-27T07:00:00Z'))).toBe('ACTIVE');
  expect(approvalValidity(a, Date.parse('2026-11-27T08:30:00Z'))).toBe('EXPIRED');
  expect(approvalValidity({ ...a, status: 'REVOKED' })).toBe('REVOKED');
});
