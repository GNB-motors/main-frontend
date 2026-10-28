import { expect, it } from 'vitest';
import {
  calendarTrend,
  formatDay,
  navLabels,
  niceAxis,
  trendSummary,
  visibleUsageRows,
} from './usageModel';
it('rounds the chart axis up to whole, evenly spaced ticks', () => {
  expect(niceAxis(347)).toEqual({ max: 400, ticks: [0, 100, 200, 300, 400] });
  expect(niceAxis(3)).toEqual({ max: 3, ticks: [0, 1, 2, 3] });
  expect(niceAxis(0)).toEqual({ max: 1, ticks: [0, 1] });
});
it('summarises the period and labels rollup days without shifting them', () => {
  const days = calendarTrend(
    [
      { day: '2026-10-26', views: 30 },
      { day: '2026-10-27', views: 12 },
    ],
    '2026-10-27',
    3,
  );
  expect(trendSummary(days)).toEqual({ total: 42, average: 14, peak: days[1] });
  expect(trendSummary(calendarTrend([], '2026-10-27', 2)).peak).toBeNull();
  expect(formatDay('2026-10-27')).toBe('27 Oct');
});
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
