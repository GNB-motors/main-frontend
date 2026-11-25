import { expect, it } from 'vitest';
import { gradeRange, scoreTone, summarizeDna } from './drivingDnaModel';

const rows = [
  {
    registrationNumber: 'A',
    grade: 'D',
    drivingScore: 40,
    idleScore: 30,
    speedingScore: 60,
    overRevScore: null,
    idleExcessMinutes: 300,
    idleRupees: 2000,
    movingSamples: 100,
    overspeedSamples: 20,
    canSamples: 0,
    overRevSamples: 0,
  },
  {
    registrationNumber: 'B',
    grade: 'A',
    drivingScore: 90,
    idleScore: 90,
    speedingScore: 80,
    overRevScore: 70,
    idleExcessMinutes: 60,
    idleRupees: 500,
    movingSamples: 300,
    overspeedSamples: 10,
    canSamples: 50,
    overRevSamples: 5,
  },
];

it('works out the fleet figures from the per-truck profiles', () => {
  const summary = summarizeDna(rows);
  expect(summary.avgScore).toBe(65);
  expect(summary.grades).toEqual({ A: 1, B: 0, C: 0, D: 1 });
  expect(summary.weakest).toMatchObject({ label: 'Idling', score: 60 });
  expect(summary.lowest.registrationNumber).toBe('A');
  expect(summary.idleHours).toBe(6);
  expect(summary.idleRupees.value).toBe(2500);
  expect(summary.speeding).toEqual({ pct: 7.5, hits: 30, of: 400, trucks: 2 });
  // Only truck B sends rpm, so over-revving is read over its readings alone.
  expect(summary.overRev).toEqual({ pct: 10, hits: 5, of: 50, trucks: 1 });
});

it('keeps unknown fleet figures unknown', () => {
  const summary = summarizeDna([{ registrationNumber: 'C' }]);
  expect(summary.avgScore).toBeNull();
  expect(summary.weakest).toBeNull();
  expect(summary.speeding.pct).toBeNull();
  expect(summary.idleHours).toBeNull();
});

it('reads tones and grade ranges from the grade lines', () => {
  expect(scoreTone(72)).toBe('ok');
  expect(scoreTone(55)).toBe('warn');
  expect(scoreTone(null)).toBeNull();
  expect(gradeRange('B', { a: 85, b: 70, c: 50 })).toBe('Score 70–84');
});
