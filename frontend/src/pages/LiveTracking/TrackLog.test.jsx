import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import trackFixture from '../../test/fixtures/redesign/track.json';
import TrackLog from './TrackLog';

describe('TrackLog', () => {
  it('filters the replay log by place or event text and restores it when cleared', () => {
    const { rerender } = render(<TrackLog track={trackFixture} query="Mohania" />);
    expect(screen.getByText('Mohania Dhaba')).toBeInTheDocument();
    expect(screen.queryByText(/Over 60 km\/h/)).not.toBeInTheDocument();
    rerender(<TrackLog track={trackFixture} query="No such location" />);
    expect(screen.getByText('No matching journey records.')).toBeInTheDocument();
    rerender(<TrackLog track={trackFixture} query="" />);
    expect(screen.getByText(/Over 60 km\/h/)).toBeInTheDocument();
  });

  it('marks the first stop as Start without duplicating it and keeps same-time clicks distinct', () => {
    const at = '2026-11-17T01:00:00Z';
    const track = {
      points: [
        { t: at, speedKmh: 0 },
        { t: '2026-11-17T02:00:00Z', speedKmh: 0 },
      ],
      stops: [
        { startAt: at, endAt: '2026-11-17T01:20:00Z', durationMin: 20, place: { name: 'Depot' } },
      ],
      events: [{ kind: 'GPS_GAP', at, endAt: '2026-11-17T02:00:00Z', text: 'No GPS for 60 min' }],
    };
    function Replay() {
      const [time, seek] = useState(at);
      return <TrackLog track={track} playheadTime={time} onSeek={seek} />;
    }
    render(<Replay />);
    const cards = screen.getAllByRole('button');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('Start');
    expect(cards[0]).toHaveTextContent('Stop');
    expect(cards[0]).toHaveTextContent('20 min');
    expect(screen.getAllByText('Depot')).toHaveLength(1);
    expect(cards[0]).toHaveTextContent('Depot');
    expect(cards[0]).toHaveAttribute('aria-current', 'step');
    fireEvent.click(cards[0]);
    expect(cards[0]).toHaveAttribute('aria-current', 'step');
    fireEvent.click(cards[1]);
    expect(cards[1]).toHaveAttribute('aria-current', 'step');
    expect(cards[0]).not.toHaveAttribute('aria-current');
  });

  it('retains a separate Start card when the first event happens later', () => {
    render(
      <TrackLog
        track={{
          points: [
            { t: '2026-11-17T01:00:00Z', speedKmh: 0 },
            { t: '2026-11-17T02:00:00Z', speedKmh: 0 },
          ],
          stops: [
            { startAt: '2026-11-17T01:30:00Z', durationMin: 30, place: { name: 'Later stop' } },
          ],
        }}
      />,
    );
    const cards = screen.getAllByRole('button');
    expect(cards[0]).toHaveTextContent('Starting point');
    expect(cards[0]).not.toHaveTextContent('Later stop');
    expect(cards[1]).toHaveTextContent('Later stop');
  });

  it('uses each backend place name as the stop title and keeps the Stop badge', () => {
    const onSeek = vi.fn();
    render(
      <TrackLog
        track={{
          stops: [
            {
              startAt: '2026-11-17T01:00:00Z',
              place: { name: '  Mohania Dhaba  ' },
              durationMin: 20,
            },
            { startAt: '2026-11-17T03:00:00Z', place: { name: 'Kharagpur Yard' }, durationMin: 30 },
          ],
        }}
        onSeek={onSeek}
      />,
    );
    expect(screen.getByText('Mohania Dhaba')).toBeInTheDocument();
    expect(screen.getByText('Kharagpur Yard')).toBeInTheDocument();
    expect(screen.getAllByText('Stop')).toHaveLength(2);
    fireEvent.click(screen.getByText('Kharagpur Yard'));
    expect(onSeek).toHaveBeenCalledWith('2026-11-17T03:00:00Z');
  });

  it.each([null, { name: '' }, { name: '   ' }])(
    'shows an honest fallback when the backend place is %j',
    (place) => {
      render(
        <TrackLog
          track={{ stops: [{ startAt: '2026-11-17T01:00:00Z', place, durationMin: 20 }] }}
        />,
      );
      expect(screen.getByText('Place not identified')).toBeInTheDocument();
      expect(screen.getAllByText('Stop')).toHaveLength(1);
    },
  );

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
    expect(stoppedCards.length).toBe(1);
    expect(screen.getAllByText(/Parked · 295\.5 km recorded/).length).toBeGreaterThanOrEqual(1);

    fireEvent.click(stoppedCards[stoppedCards.length - 1]);
    expect(onSeek).toHaveBeenCalledWith('2026-11-17T20:19:00Z');
  });

  it('uses supplied historical moving-point locations without changing the Moving badge or seek time', () => {
    const onSeek = vi.fn();
    render(
      <TrackLog
        track={{
          points: [
            { t: '2026-11-17T10:00:00Z', speedKmh: 50, place: { name: 'Kharagpur' } },
            { t: '2026-11-17T14:00:00Z', speedKmh: 58, address: 'Kolkata' },
          ],
        }}
        onSeek={onSeek}
      />,
    );
    expect(screen.getAllByText('Kharagpur')).toHaveLength(1);
    expect(screen.getByText('Kolkata')).toBeInTheDocument();
    expect(screen.getAllByText('Moving')).toHaveLength(2);
    fireEvent.click(screen.getByText('Kolkata'));
    expect(onSeek).toHaveBeenCalledWith('2026-11-17T14:00:00Z');
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

    expect(screen.getAllByText('Place not identified')).toHaveLength(2);
    expect(screen.getByText(/58 km\/h/)).toBeInTheDocument();
  });
});

it('opens the naming action for an unidentified moving GPS position', () => {
  const onOpenPlace = vi.fn();
  const points = [
    { t: '2026-11-17T10:00:00Z', lat: 22, lng: 88, speedKmh: 40 },
    { t: '2026-11-17T11:00:00Z', lat: 23, lng: 89, speedKmh: 40 },
  ];
  render(<TrackLog track={{ points }} onOpenPlace={onOpenPlace} />);
  fireEvent.click(screen.getAllByText('Place not identified')[0]);
  expect(onOpenPlace).not.toHaveBeenCalled();
  fireEvent.click(screen.getAllByRole('button', { name: 'Name this place' })[0]);
  expect(onOpenPlace).toHaveBeenCalledWith(
    expect.objectContaining({ fixAt: points[0].t, lat: 22, lng: 88, unidentified: true }),
  );
});
