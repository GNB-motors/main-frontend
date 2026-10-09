import { describe, it, expect } from 'vitest';
import {
  formatPct,
  formatSpan,
  formatCadence,
  successSeverity,
  adherenceSeverity,
  busySeverity,
  sortKpis,
  summarizeTotals,
} from './jobKpis';

describe('formatPct', () => {
  it('renders one decimal and a dash for missing values', () => {
    expect(formatPct(0.9734)).toBe('97.3%');
    expect(formatPct(1)).toBe('100%');
    expect(formatPct(0)).toBe('0%');
    expect(formatPct(null)).toBe('—');
    expect(formatPct(undefined)).toBe('—');
  });
});

describe('formatSpan', () => {
  it('picks the unit by size', () => {
    expect(formatSpan(850)).toBe('850ms');
    expect(formatSpan(12400)).toBe('12.4s');
    expect(formatSpan(252000)).toBe('4m 12s');
    expect(formatSpan(3900000)).toBe('1h 05m');
    expect(formatSpan(null)).toBe('—');
  });
});

describe('formatCadence', () => {
  it('drops zero seconds and says on demand without an interval', () => {
    expect(formatCadence(60000)).toBe('every 1m');
    expect(formatCadence(3600000)).toBe('every 1h');
    expect(formatCadence(null)).toBe('on demand');
  });
});

describe('severities', () => {
  it('success rate: info at 99%+, warn below, error below 90%', () => {
    expect(successSeverity(1)).toBe('info');
    expect(successSeverity(0.95)).toBe('warn');
    expect(successSeverity(0.5)).toBe('error');
    expect(successSeverity(null)).toBeNull();
  });
  it('adherence: warn below 95%, error below 80%', () => {
    expect(adherenceSeverity(0.97)).toBe('info');
    expect(adherenceSeverity(0.9)).toBe('warn');
    expect(adherenceSeverity(0.5)).toBe('error');
  });
  it('busy share: quiet below 25%', () => {
    expect(busySeverity(0.1)).toBeNull();
    expect(busySeverity(0.3)).toBe('warn');
    expect(busySeverity(0.6)).toBe('error');
  });
});

describe('sortKpis', () => {
  const jobs = [
    { job: 'b', busyShare: 0.1, failed: 0, killed: 2, p95Ms: 100, scheduleAdherence: 0.5 },
    { job: 'a', busyShare: 0.4, failed: 1, killed: 0, p95Ms: null, scheduleAdherence: null },
    { job: 'c', busyShare: 0.1, failed: 0, killed: 0, p95Ms: 900, scheduleAdherence: 1 },
  ];
  it('busiest first, name breaks ties', () => {
    expect(sortKpis(jobs, 'busy').map((j) => j.job)).toEqual(['a', 'b', 'c']);
  });
  it('failures counts killed runs', () => {
    expect(sortKpis(jobs, 'failures').map((j) => j.job)).toEqual(['b', 'a', 'c']);
  });
  it('slowest p95 first, missing last', () => {
    expect(sortKpis(jobs, 'p95').map((j) => j.job)).toEqual(['c', 'b', 'a']);
  });
  it('most missed runs first, unscheduled last', () => {
    expect(sortKpis(jobs, 'adherence').map((j) => j.job)).toEqual(['b', 'c', 'a']);
  });
  it('does not mutate the input', () => {
    const before = jobs.map((j) => j.job);
    sortKpis(jobs, 'p95');
    expect(jobs.map((j) => j.job)).toEqual(before);
  });
});

describe('summarizeTotals', () => {
  it('adds killed into failures', () => {
    expect(
      summarizeTotals({
        jobs: 3,
        runs: 10,
        ok: 7,
        failed: 2,
        killed: 1,
        busyShare: 0.4,
        successRate: 0.7,
      }),
    ).toEqual({ jobs: 3, runs: 10, successRate: 0.7, failures: 3, killed: 1, busyShare: 0.4 });
  });
  it('is null without totals', () => {
    expect(summarizeTotals(undefined)).toBeNull();
  });
});
