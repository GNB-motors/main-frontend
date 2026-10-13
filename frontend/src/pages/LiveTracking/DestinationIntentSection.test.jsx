import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import DestinationIntentSection from './DestinationIntentSection';

vi.mock('./LiveTrackingService', () => ({
  LiveTrackingService: {
    getIntents: vi.fn(async () => [
      {
        registrationNumber: 'WB01AB1234',
        candidates: [{ ref: { name: 'Dankuni yard' }, kind: 'WAREHOUSE', p: 0.82 }],
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
  });

  it('says there is no prediction for another vehicle', async () => {
    render(<DestinationIntentSection registrationNumber="WB 09 ZZ 0001" />);
    expect(await screen.findByText(/No destination prediction/)).toBeInTheDocument();
  });
});
