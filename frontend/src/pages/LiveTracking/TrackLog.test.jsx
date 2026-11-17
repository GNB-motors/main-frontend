import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import trackFixture from '../../test/fixtures/redesign/track.json';
import TrackLog from './TrackLog';

describe('TrackLog', () => {
  it('lists the stops and the events', () => {
    render(<TrackLog track={trackFixture} />);
    expect(screen.getByRole('heading', { name: 'Trip log' })).toBeInTheDocument();
    expect(screen.getByText('Mohania Dhaba')).toBeInTheDocument();
    expect(screen.getByText(/Over 60 km\/h/)).toBeInTheDocument();
  });

  it('shows how long each stop lasted', () => {
    render(<TrackLog track={trackFixture} />);
    expect(screen.getByText('40 min')).toBeInTheDocument();
  });

  it('seeks the playhead when a row is clicked', () => {
    const onSeek = vi.fn();
    render(<TrackLog track={trackFixture} onSeek={onSeek} />);
    fireEvent.click(screen.getByText('Mohania Dhaba'));
    expect(onSeek).toHaveBeenCalled();
  });

  it('says the drive was empty when nothing was recorded', () => {
    render(<TrackLog track={{ stops: [], events: [], points: [] }} />);
    expect(screen.getByText('Nothing was recorded on this drive.')).toBeInTheDocument();
  });

  it('displays active moving and final status when track continues past last event', () => {
    const onSeek = vi.fn();
    const trackWithExtendedDrive = {
      stops: [
        {
          startAt: '2026-11-17T02:22:00Z',
          durationMin: 6,
          place: { name: 'Halt Point' },
          reason: 'REST',
        },
      ],
      events: [
        {
          kind: 'GPS_GAP',
          at: '2026-11-17T02:28:00Z',
          endAt: '2026-11-17T15:21:00Z',
          durationMin: 773,
          text: 'No GPS for 773 min',
        },
      ],
      points: [
        { t: '2026-11-16T20:31:00Z', lat: 23.2, lng: 87.8, speedKmh: 0 },
        { t: '2026-11-17T15:21:00Z', lat: 24.1, lng: 87.9, speedKmh: 45 },
        { t: '2026-11-17T20:19:00Z', lat: 24.6, lng: 87.8, speedKmh: 0 },
      ],
      summary: { km: 295.5, driveMin: 475, stopMin: 63, avgKmh: 37.3, maxKmh: 73.5 },
    };

    render(<TrackLog track={trackWithExtendedDrive} onSeek={onSeek} />);

    expect(screen.getAllByText('Moving').length).toBeGreaterThanOrEqual(1);
    const stoppedCards = screen.getAllByText('Stopped · Engine OFF');
    expect(stoppedCards.length).toBe(2);
    expect(screen.getAllByText(/Parked · 295\.5 km recorded/).length).toBeGreaterThanOrEqual(1);

    fireEvent.click(stoppedCards[stoppedCards.length - 1]);
    expect(onSeek).toHaveBeenCalledWith('2026-11-17T20:19:00Z');
  });

  it('displays Moving status with speed when vehicle is in motion at the end of track', () => {
    const trackMovingAtEnd = {
      stops: [],
      events: [],
      points: [
        { t: '2026-11-17T10:00:00Z', lat: 23.2, lng: 87.8, speedKmh: 50 },
        { t: '2026-11-17T14:00:00Z', lat: 24.1, lng: 87.9, speedKmh: 58 },
      ],
      summary: { km: 200, driveMin: 240, stopMin: 0, avgKmh: 50, maxKmh: 65 },
    };

    render(<TrackLog track={trackMovingAtEnd} />);

    expect(screen.getByText('Moving · 58 km/h')).toBeInTheDocument();
  });
});
