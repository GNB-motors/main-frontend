import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import SpeedChart from './SpeedChart.jsx';

const from = new Date('2026-11-09T00:00:00Z');
const at = (minutes) => new Date(from.getTime() + minutes * 60000).toISOString();
const interval = (start, end, speedKmh, quality = 'GOOD') => ({
  startAt: at(start),
  endAt: at(end),
  speedKmh,
  quality,
});
const chart = (series, events = []) =>
  render(
    <SpeedChart series={series} events={events} threshold={60} from={from} to={new Date(at(10))} />,
  );

it('plots interval averages as steps, leaving gaps where GPS intervals were rejected', () => {
  chart([interval(0, 1, 80), interval(1, 2, 80), interval(4, 5, 75)]);
  const path = screen.getByLabelText('Ground speed').getAttribute('d');
  expect(path).toBe('M36.0 51.2 L131.6 51.2 L131.6 51.2 L227.2 51.2 M418.4 61.5 L514.0 61.5');
});

it('distinguishes uncertain long-gap averages from good intervals', () => {
  chart([interval(0, 1, 80), interval(1, 7, 70, 'LOW'), interval(7, 8, 80)]);
  expect(screen.getByLabelText('Low-quality ground speed')).toHaveAttribute(
    'stroke-dasharray',
    '5 4',
  );
  expect(screen.getByLabelText('Low-quality ground speed').getAttribute('d')).toMatch(/^M/);
  expect(screen.getByLabelText('Ground speed').getAttribute('d').match(/M/g)).toHaveLength(2);
});

it('expands the speed axis above 100 so different high peaks remain distinguishable', () => {
  chart(
    [interval(0, 1, 110), interval(1, 2, 130)],
    [{ startAt: at(0), endAt: at(2), maxSpeedKmh: 130 }],
  );
  expect(screen.getByText('160')).toBeInTheDocument();
  const path = screen.getByLabelText('Ground speed').getAttribute('d');
  const values = [...path.matchAll(/[ML][\d.]+ ([\d.]+)/g)].map((match) => Number(match[1]));
  expect(values[0]).toBeGreaterThan(values.at(-1));
  expect(values.at(-1)).toBeGreaterThan(10);
});
