import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { replayTolls, tollCoverageText } from './trackTollsModel';
import TrackTollStatus from './TrackTollStatus';
import TrackTollLayers from './TrackTollLayers';

vi.mock('@react-google-maps/api', () => ({
  MarkerF: ({ title, onClick, icon }) => (
    <button title={title} data-fill={icon.fillColor} onClick={onClick}>
      {title}
    </button>
  ),
  InfoWindowF: ({ children }) => <section aria-label="Toll details">{children}</section>,
}));
const passes = [
  {
    id: 'out',
    name: 'Dankuni',
    at: '2026-11-03T05:00:00Z',
    lat: 22,
    lng: 88,
    evidence: 'ROAD',
    inferred: false,
  },
  {
    id: 'back',
    name: 'Dankuni',
    at: '2026-11-03T08:00:00Z',
    lat: 22,
    lng: 88,
    evidence: 'GPS',
    inferred: true,
  },
];

describe('replay tolls', () => {
  it('preserves return passes and resets crossing state when seeking backwards', () => {
    expect(replayTolls(passes, '2026-11-03T09:00:00Z').map((p) => p.passed)).toEqual([true, true]);
    expect(replayTolls(passes, '2026-11-03T06:00:00Z').map((p) => p.passed)).toEqual([true, false]);
    expect(replayTolls(passes, '2026-11-03T04:00:00Z').every((p) => !p.passed)).toBe(true);
  });
  it('keeps fallback and stop evidence honest and drops invalid geometry', () => {
    const result = replayTolls(
      [...passes, { ...passes[0], id: 'stop', evidence: 'STOP' }, { ...passes[0], lat: null }],
      '2026-11-03T09:00:00Z',
    );
    expect(result.map((p) => p.action)).toEqual([
      'Toll crossed',
      'Crossing inferred',
      'Stopped at toll plaza',
    ]);
  });
  it('never describes missing or partial coverage as no crossings', () => {
    expect(tollCoverageText({ status: 'NOT_COMPUTED', passes: [] })).toMatch(/not been computed/);
    expect(tollCoverageText({ status: 'PARTIAL', passes: [] })).toMatch(/incomplete/);
    expect(tollCoverageText({ status: 'READY', passes: [] })).toMatch(/No toll crossings detected/);
  });
  it('draws markers on load and updates their popup and fill with the playhead', () => {
    const { rerender } = render(
      <TrackTollLayers passes={passes} playheadTime="2026-11-03T04:00:00Z" />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getAllByRole('button')[0]).toHaveAttribute('data-fill', '#ffffff');
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByLabelText('Toll details')).toHaveTextContent('Upcoming in replay');
    rerender(<TrackTollLayers passes={passes} playheadTime="2026-11-03T06:00:00Z" />);
    expect(screen.getAllByRole('button')[0]).toHaveAttribute('data-fill', '#0f766e');
    expect(screen.getByLabelText('Toll details')).toHaveTextContent('Toll crossed');
  });
  it('shows the latest reached crossing without repeating notifications', () => {
    render(
      <TrackTollStatus data={{ status: 'READY', passes }} playheadTime="2026-11-03T09:00:00Z" />,
    );
    expect(screen.getByLabelText('Replay toll crossings')).toHaveTextContent('2/2 reached');
    expect(screen.getByLabelText('Replay toll crossings')).toHaveTextContent('crossing inferred');
  });
  it('offers an independent retry on failure', () => {
    const retry = vi.fn();
    render(<TrackTollStatus error={new Error('offline')} onRetry={retry} />);
    expect(screen.getByRole('status')).toHaveTextContent('Replay is still available');
    fireEvent.click(screen.getByRole('button', { name: 'Retry tolls' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
