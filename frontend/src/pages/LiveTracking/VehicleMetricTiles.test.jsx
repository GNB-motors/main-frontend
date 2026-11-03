import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import VehicleReadingTiles from './VehicleReadingTiles';

/**
 * The reading tiles are where the redesign's hardest promise lives: a value
 * from September must never look like a value from now, and a value we do
 * not have must never look like zero.
 */
const now = {
  registrationNumber: 'WB11L8862',
  view: { speedKmh: 26, freshness: 'live', lastFixAt: '2026-11-02T20:48:00Z' },
  readings: {
    fuel: {
      litres: { value: 356.5, at: '2026-11-02T20:48:00Z', ageMin: 0, freshness: 'live' },
      pct: { value: 98, at: '2026-11-02T20:48:00Z', ageMin: 0, freshness: 'live' },
      tankL: 365,
    },
    def: {
      pct: { value: 60.8, at: '2026-11-02T20:48:00Z', ageMin: 0, freshness: 'live' },
      litres: { value: 14.6, at: '2026-11-02T20:48:00Z', ageMin: 0, freshness: 'live' },
      tankL: 24,
      tankSource: 'VENDOR',
    },
    odometerKm: { value: 43478, at: '2026-11-02T20:48:00Z', ageMin: 0, freshness: 'live' },
  },
};

describe('VehicleReadingTiles', () => {
  it('shows fuel in litres with the tank underneath', () => {
    render(<VehicleReadingTiles now={now} />);
    expect(screen.getByText('356.5 L')).toBeInTheDocument();
    expect(screen.getByText('of 365 L · 98%')).toBeInTheDocument();
  });

  it('shows DEF as a percentage with the litres underneath', () => {
    render(<VehicleReadingTiles now={now} />);
    expect(screen.getByText('60.8%')).toBeInTheDocument();
    expect(screen.getByText('14.6 L of 24 L')).toBeInTheDocument();
  });

  it('shows the odometer', () => {
    render(<VehicleReadingTiles now={now} />);
    expect(screen.getByText('43,478 km')).toBeInTheDocument();
  });

  it('shows the speed', () => {
    render(<VehicleReadingTiles now={now} />);
    expect(screen.getByText('26 km/h')).toBeInTheDocument();
  });

  it('says a value it never received was not received', () => {
    const without = {
      ...now,
      readings: {
        ...now.readings,
        fuel: { litres: null, pct: null, tankL: null },
        def: { pct: null, litres: null, tankL: null, tankSource: null },
        odometerKm: null,
      },
    };
    render(<VehicleReadingTiles now={without} />);
    expect(screen.getAllByText('Not received').length).toBe(3);
  });

  it('dates a stale value instead of showing it as live', () => {
    const stale = {
      ...now,
      readings: {
        ...now.readings,
        def: {
          pct: { value: 60.8, at: '2026-09-09T03:40:00Z', ageMin: 50000, freshness: 'stale' },
          litres: null,
          tankL: null,
          tankSource: null,
        },
      },
    };
    render(<VehicleReadingTiles now={stale} />);
    expect(screen.getByText('last known 9 Sep, 9:10 am')).toBeInTheDocument();
  });

  it('says when the DEF litres are learned rather than reported', () => {
    const learned = {
      ...now,
      readings: {
        ...now.readings,
        def: {
          pct: { value: 60.8, at: '2026-11-02T20:48:00Z', ageMin: 0, freshness: 'live' },
          litres: { value: 14.6, at: '2026-11-02T20:48:00Z', ageMin: 0, freshness: 'live' },
          tankL: null,
          tankSource: 'LEARNED',
        },
      },
    };
    render(<VehicleReadingTiles now={learned} />);
    expect(screen.getByText('Litres after the first DEF top-up')).toBeInTheDocument();
  });
});
