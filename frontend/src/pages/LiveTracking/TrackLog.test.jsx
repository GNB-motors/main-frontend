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

  it('offers the CSV of the drive', () => {
    render(<TrackLog track={trackFixture} />);
    expect(screen.getByRole('button', { name: /Export CSV/ })).toBeInTheDocument();
  });
});
