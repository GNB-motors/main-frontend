import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
vi.mock('../../services/ExcursionService', () => ({
  default: {
    list: vi.fn(),
    get: vi.fn(),
    classify: vi.fn(),
    approveLate: vi.fn(),
    notADeviation: vi.fn(),
  },
}));
import ExcursionService from '../../services/ExcursionService';
import ExcursionsPage from './ExcursionsPage';
import ExcursionDetailPage from './ExcursionDetailPage';
const excursion = {
  _id: 'e1',
  registrationNumber: 'WB11T0662',
  status: 'APPROVED',
  openedAt: '2026-10-09T20:30:00Z',
  closedAt: '2026-10-09T21:30:00Z',
  visits: [{ visitId: 'v1', name: 'Workshop', arrivedAt: '2026-10-09T20:45:00Z' }],
};
beforeEach(() => {
  vi.clearAllMocks();
  ExcursionService.list.mockResolvedValue({ items: [excursion], total: 1 });
  ExcursionService.get.mockResolvedValue(excursion);
});
it('formats the excursion list in IST across midnight', async () => {
  render(
    <MemoryRouter>
      <ExcursionsPage />
    </MemoryRouter>,
  );
  expect(await screen.findByText('10 Oct, 02:00 AM')).toBeInTheDocument();
});
it('formats excursion opening, closing and visit timestamps in IST', async () => {
  render(
    <MemoryRouter initialEntries={['/excursions/e1']}>
      <Routes>
        <Route path="/excursions/:id" element={<ExcursionDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(
    await screen.findByText('10 Oct 2026, 02:00 AM → 10 Oct 2026, 03:00 AM'),
  ).toBeInTheDocument();
  expect(screen.getByText(/10 Oct 2026, 02:15 AM/)).toBeInTheDocument();
});
