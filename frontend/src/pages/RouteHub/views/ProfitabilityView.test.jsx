import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RouteHubService from '../../../services/RouteHubService';
import ProfitabilityView from './ProfitabilityView';

vi.mock('../../../services/RouteHubService', () => ({
  default: { getAutoTripRunningCost: vi.fn(), getMoney: vi.fn() },
}));

it('renders the cost report while cash indicators are still loading', async () => {
  RouteHubService.getAutoTripRunningCost.mockResolvedValue({ disclaimer: 'Costs are ready.' });
  RouteHubService.getMoney.mockImplementation(() => new Promise(() => {}));
  render(<ProfitabilityView toast={vi.fn()} />);
  expect(await screen.findByText('Costs are ready.')).toBeInTheDocument();
  const [costRange] = RouteHubService.getAutoTripRunningCost.mock.calls[0];
  expect(RouteHubService.getMoney).toHaveBeenCalledWith(costRange, expect.any(AbortSignal));
});
