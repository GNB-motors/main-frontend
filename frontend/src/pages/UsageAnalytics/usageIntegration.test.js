import { expect, it } from 'vitest';
import { calendarTrend, navLabels, visibleUsageRows } from './usageModel';
it('fills calendar gaps rather than displaying distant active days as consecutive days', () => {
  const days = calendarTrend(
    [
      { day: '2026-10-19', views: 10 },
      { day: '2026-10-21', views: 5 },
    ],
    '2026-10-21',
    3,
  );
  expect(days.map((day) => day.views)).toEqual([10, 0, 5]);
  expect(days.map((day) => day.day)).toEqual(['2026-10-19', '2026-10-20', '2026-10-21']);
});
it('uses authorized navigation labels and never creates a link to an unknown path', () => {
  const labels = navLabels([
    { type: 'group', children: [{ to: '/reports', label: 'Fleet Reports' }] },
  ]);
  const rows = visibleUsageRows(
    [
      { surfaceKey: '/reports', evidence: { views: 10 } },
      { surfaceKey: '//example.com', evidence: {} },
    ],
    labels,
  );
  expect(rows[0]).toMatchObject({ label: 'Fleet Reports', canOpen: true });
  expect(rows[1].canOpen).toBe(false);
});
