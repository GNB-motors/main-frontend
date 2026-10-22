import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, it, expect, beforeEach } from 'vitest';
import SapMatchReview from './SapMatchReview';
import SapService from '../../services/SapService';
vi.mock('../../utils/session', () => ({ getUserRole: () => 'OWNER', getPref: () => null }));
vi.mock('../../services/SapService', () => ({
  default: { matchReview: vi.fn(), alias: vi.fn(), lanes: vi.fn() },
}));
beforeEach(() => {
  vi.clearAllMocks();
  SapService.matchReview.mockResolvedValue({
    plants: [
      {
        label: 'OCL',
        laneCount: 10,
        suggestions: [
          { orgSiteId: 'p1', name: 'Plant A', score: 0.7 },
          { orgSiteId: 'p1', name: 'Plant A', score: 0.9 },
        ],
      },
    ],
    drops: [
      {
        orgSiteId: 'd1',
        name: 'First town',
        tripCount: 20,
        suggestions: [{ label: 'FIRST', score: 0.9 }],
      },
      {
        orgSiteId: 'd2',
        name: 'Second town',
        tripCount: 10,
        suggestions: [{ label: 'SECOND', score: 0.8 }],
      },
    ],
  });
  SapService.alias.mockResolvedValue({});
});
it('confirms a suggestion for the selected drop, including after searching', async () => {
  render(
    <MemoryRouter>
      <SapMatchReview />
    </MemoryRouter>,
  );
  await screen.findByRole('button', { name: 'Confirm' });
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search SAP links' }), {
    target: { value: 'Second' },
  });
  await screen.findByText('SECOND');
  expect(screen.queryByText('FIRST')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
  await waitFor(() =>
    expect(SapService.alias).toHaveBeenCalledWith(
      { kind: 'DROP', label: 'SECOND', orgSiteId: 'd2', status: 'CONFIRMED' },
      expect.anything(),
    ),
  );
  expect(screen.getByRole('link', { name: /Set SAP km manually/ }).getAttribute('href')).toContain(
    'dropSiteId=d2',
  );
});
it('shows each suggested plant once and links the selected place ID', async () => {
  render(
    <MemoryRouter>
      <SapMatchReview />
    </MemoryRouter>,
  );
  await screen.findByRole('button', { name: 'Confirm' });
  fireEvent.click(screen.getByRole('button', { name: /Sheet plants/ }));
  const buttons = await screen.findAllByRole('button', { name: 'Confirm suggested place' });
  expect(buttons).toHaveLength(1);
  fireEvent.click(buttons[0]);
  await waitFor(() =>
    expect(SapService.alias).toHaveBeenCalledWith(
      { kind: 'PLANT', label: 'OCL', orgSiteId: 'p1', status: 'CONFIRMED' },
      expect.anything(),
    ),
  );
});
