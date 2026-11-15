import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ChallansPage from './ChallansPage';

const { fetchChallans, fetchChallanSummary, fetchChallansPerVehicle } = vi.hoisted(() => ({
  fetchChallans: vi.fn(),
  fetchChallanSummary: vi.fn(),
  fetchChallansPerVehicle: vi.fn(),
}));

vi.mock('../../services/challanService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchChallans,
    fetchChallanSummary,
    fetchChallansPerVehicle,
  };
});

/**
 * The challans page sits behind a "Coming Soon" overlay. A page nobody can
 * read must not keep asking the server for data — so no fetch runs while the
 * overlay is up.
 */
describe('ChallansPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not fetch while the Coming Soon overlay is up', async () => {
    render(<ChallansPage />);

    await waitFor(() => expect(screen.getByText('Coming Soon')).toBeInTheDocument());
    expect(fetchChallans).not.toHaveBeenCalled();
    expect(fetchChallanSummary).not.toHaveBeenCalled();
    expect(fetchChallansPerVehicle).not.toHaveBeenCalled();
  });
});
