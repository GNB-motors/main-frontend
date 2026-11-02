import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import DestinationIntentSection from './DestinationIntentSection';

vi.mock('./LiveTrackingService', () => ({
  LiveTrackingService: {
    getIntents: vi.fn(async () => [
      {
        registrationNumber: 'WB01AB1234',
        // The backend names candidates; the raw ref is an id that must never show (DC-28).
        candidates: [
          { ref: '66f1a2b3c4d5e6f7a8b9c0d1', name: 'Dankuni yard', kind: 'SITE', p: 0.82 },
        ],
        loadState: 'LADEN',
      },
    ]),
  },
}));

describe('DestinationIntentSection', () => {
  // Live Tracking rows carry the plate as the fleet wrote it, often with spaces.
  it('matches the prediction whatever the spacing of the plate', async () => {
    render(<DestinationIntentSection registrationNumber="WB 01 AB 1234" />);
    expect(await screen.findByText(/Dankuni yard/)).toBeInTheDocument();
    expect(screen.getByText('Laden')).toBeInTheDocument();
    expect(screen.queryByText(/66f1a2b3/)).not.toBeInTheDocument();
  });

  it('says there is no prediction for another vehicle', async () => {
    render(<DestinationIntentSection registrationNumber="WB 09 ZZ 0001" />);
    expect(await screen.findByText(/No prediction for this vehicle/)).toBeInTheDocument();
  });
});
