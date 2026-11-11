import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import trackFixture from '../../test/fixtures/redesign/track.json';
import TrackTimeline from './TrackTimeline';

function renderTimeline(overrides = {}) {
  const props = {
    track: trackFixture,
    points: trackFixture.points,
    playheadIndex: 0,
    isPlaying: false,
    speed: 1,
    onTogglePlay: vi.fn(),
    onSpeedChange: vi.fn(),
    onSeek: vi.fn(),
    onApplyRange: vi.fn(),
    onExit: vi.fn(),
    from: new Date('2026-11-01T13:00:00Z'),
    to: new Date('2026-11-01T19:30:00Z'),
    ...overrides,
  };
  render(<TrackTimeline {...props} />);
  return props;
}

describe('TrackTimeline', () => {
  it('keeps a boundary stop inside the recorded timeline when the chosen range is wider', () => {
    renderTimeline({
      track: {
        ...trackFixture,
        stops: [
          {
            startAt: '2026-11-01T12:00:00Z',
            endAt: '2026-11-01T20:00:00Z',
            durationMin: 480,
            place: { name: 'Boundary stop' },
          },
        ],
      },
      from: new Date('2026-11-01T12:00:00Z'),
      to: new Date('2026-11-01T20:00:00Z'),
    });
    expect(screen.getByRole('button', { name: /Boundary stop/ })).toHaveStyle({ left: '0%' });
    expect(screen.getByTitle('Boundary stop · 8 h')).toHaveStyle({ left: '0%', width: '100%' });
  });

  it('omits stop markers when the stop does not overlap the recorded drive', () => {
    renderTimeline({
      track: {
        ...trackFixture,
        stops: [
          {
            startAt: '2026-11-01T11:00:00Z',
            endAt: '2026-11-01T12:00:00Z',
            durationMin: 60,
            place: { name: 'Earlier stop' },
          },
        ],
      },
    });
    expect(screen.queryByRole('button', { name: /Earlier stop/ })).not.toBeInTheDocument();
    expect(screen.queryByTitle('Earlier stop · 1 h')).not.toBeInTheDocument();
  });

  it('offers play and pause', () => {
    const props = renderTimeline();
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(props.onTogglePlay).toHaveBeenCalled();
  });

  it('offers the four speeds and says which one is on', () => {
    const props = renderTimeline({ speed: 10 });
    fireEvent.click(screen.getByRole('button', { name: '40×' }));
    expect(props.onSpeedChange).toHaveBeenCalledWith(40);
    expect(screen.getByRole('button', { name: '10×' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the summary of the drive', () => {
    renderTimeline();
    expect(screen.getByText(/360\.8 km/)).toBeInTheDocument();
    expect(screen.getByText(/5 h 12 min driving/)).toBeInTheDocument();
  });

  it('offers a way out of Track mode', () => {
    const props = renderTimeline();
    fireEvent.click(screen.getByRole('button', { name: 'Leave Track mode' }));
    expect(props.onExit).toHaveBeenCalled();
  });

  it('warns the owner when the range is long and the path is simplified', () => {
    renderTimeline({
      from: new Date('2026-01-01T00:00:00Z'),
      to: new Date('2026-11-01T00:00:00Z'),
    });
    expect(screen.getByText(/Long range: the path is simplified/)).toBeInTheDocument();
  });

  it('does not warn about a normal range', () => {
    renderTimeline();
    expect(screen.queryByText(/Long range/)).not.toBeInTheDocument();
  });

  it('jumps to an event when its tick is clicked', () => {
    const props = renderTimeline();
    const tick = screen.getAllByRole('button', { name: /Over 60 km\/h/ })[0];
    fireEvent.click(tick);
    expect(props.onSeek).toHaveBeenCalled();
  });
});
