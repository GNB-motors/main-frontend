import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DrivingDnaPage from './DrivingDnaPage';
import { DrivingDnaService } from './DrivingDnaService';

vi.mock('./DrivingDnaService', () => ({
  DrivingDnaService: { getProfiles: vi.fn() },
}));

describe('Driving DNA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // U07 — the panel printed the raw error and offered no way out.
  it('says a failure in plain words and offers a retry', async () => {
    DrivingDnaService.getProfiles.mockRejectedValue({
      status: 500,
      message: 'Request failed with status code 500',
      response: { data: { message: 'driving-dna sweep failed' } },
    });
    render(<DrivingDnaPage />);

    expect(await screen.findByText("Couldn't load this.")).toBeInTheDocument();
    // The transport and validation detail never reaches the owner.
    expect(screen.queryByText(/Request failed with status code/)).not.toBeInTheDocument();
    expect(screen.queryByText(/driving-dna sweep failed/)).not.toBeInTheDocument();

    const retry = screen.getByRole('button', { name: /retry/i });
    DrivingDnaService.getProfiles.mockResolvedValue({
      success: true,
      profiles: [],
      summary: { count: 0, avgScore: 0 },
    });
    fireEvent.click(retry);
    await waitFor(() => expect(DrivingDnaService.getProfiles).toHaveBeenCalledTimes(2));
  });
});
