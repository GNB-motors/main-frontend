import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VehicleJourneyPanel from './VehicleJourneyPanel';

const track = {
  stops: [
    {
      startAt: '2026-11-01T00:00:00Z',
      endAt: '2026-11-01T01:00:00Z',
      durationMin: 60,
      place: { name: 'Plant', lat: 22, lng: 88 },
    },
  ],
  landmarks: [{ id: 'pump', name: 'Pump', lat: 23, lng: 89 }],
};
describe('vehicle journey panel', () => {
  it('seeks recorded visits and focuses nearby landmarks without inventing a visit time', () => {
    const onSeek = vi.fn();
    const onFocus = vi.fn();
    render(
      <VehicleJourneyPanel journey={{ track }} tab="places" onSeek={onSeek} onFocus={onFocus} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Plant/ }));
    expect(onSeek).toHaveBeenCalledWith('2026-11-01T00:00:00Z');
    expect(onFocus).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Plant', lat: 22, lng: 88 }),
    );
    onSeek.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /Pump/ }));
    expect(onSeek).not.toHaveBeenCalled();
    expect(onFocus).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Pump' }));
  });
  it('shows route times, duration and distance separately and keeps route selection working', () => {
    const onFocus = vi.fn();
    const onSeek = vi.fn();
    const journey = {
      track: {
        segments: [
          { kind: 'LADEN', fromT: '2026-11-16T16:04:00Z', toT: '2026-11-16T21:19:00Z', km: 13.37 },
        ],
      },
    };
    render(
      <VehicleJourneyPanel journey={journey} tab="routes" onFocus={onFocus} onSeek={onSeek} />,
    );
    const row = screen.getByRole('button', { name: /Loaded running/ });
    expect(row).toHaveTextContent('16 Nov, 9:34 pm');
    expect(row).toHaveTextContent('17 Nov, 2:49 am');
    expect(screen.getByText('5 h 15 min')).toBeInTheDocument();
    expect(screen.getByText('13.37 km')).toBeInTheDocument();
    fireEvent.click(row);
    expect(onSeek).toHaveBeenCalledWith('2026-11-16T16:04:00Z');
    expect(onFocus).toHaveBeenCalledWith(expect.objectContaining({ title: 'Loaded running' }));
  });
  it('reports unavailable data and retries instead of showing an empty journey', () => {
    const retry = vi.fn();
    const { rerender } = render(<VehicleJourneyPanel journey={{ loading: true }} tab="places" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    rerender(
      <VehicleJourneyPanel journey={{ error: new Error('Failed'), refetch: retry }} tab="places" />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load');
    fireEvent.click(screen.getByRole('button', { name: 'Retry journey' }));
    expect(retry).toHaveBeenCalledOnce();
    rerender(<VehicleJourneyPanel journey={{ track }} tab="places" query="No such place" />);
    expect(screen.getByText('No matching results.')).toBeInTheDocument();
  });
});

it('opens an unidentified recorded stop without losing its real stop ID', () => {
  const open = vi.fn();
  render(
    <VehicleJourneyPanel
      journey={{
        track: {
          stops: [{ id: 'stop1', startAt: '2026-11-17T00:00:00Z', lat: 22, lng: 88, place: null }],
        },
      }}
      tab="places"
      onOpenPlace={open}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: /Place not identified/ }));
  expect(open).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Name this place' }));
  expect(open).toHaveBeenCalledWith(
    expect.objectContaining({ stopId: 'stop1', unidentified: true }),
  );
});
