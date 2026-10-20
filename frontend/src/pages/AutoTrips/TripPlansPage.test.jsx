import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TripPlansPage from './TripPlansPage';

const { items } = vi.hoisted(() => ({
  items: [
    {
      _id: 'erp-plan',
      source: 'ERP',
      erpTripId: 'erp1',
      erpTripNumber: 'TRP-101',
      status: 'PLANNED',
      trackingReason: 'WAITING_START',
      registrationNumber: 'WB01A1111',
    },
  ],
}));
vi.mock('../../hooks/useApi', () => ({ useApi: () => ({ data: { items }, refetch: vi.fn() }) }));
vi.mock('../../hooks/useMutation', () => ({ useMutation: () => ({ mutate: vi.fn() }) }));
vi.mock('../../components/ui/confirmContext', () => ({ useConfirm: () => vi.fn() }));
vi.mock('./TripPlanDialog', () => ({ default: () => null }));
vi.mock('./LinkTripDialog', () => ({ default: () => null }));
vi.mock('../../components/ui/DataTable', () => ({
  default: ({ columns, rows }) => (
    <div>
      {rows.map((row) => (
        <div key={row._id}>
          {columns.map((column) => (
            <div key={column.key}>{column.render?.(row)}</div>
          ))}
        </div>
      ))}
    </div>
  ),
}));

describe('ERP plans in scheduled trips', () => {
  it('links to ERP, explains queued tracking, and permits GPS correction without commercial cancellation', () => {
    render(
      <MemoryRouter>
        <TripPlansPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'ERP · TRP-101' }).getAttribute('href')).toBe(
      '/erp/trips/erp1',
    );
    expect(screen.getByText('Queued in ERP — waiting to start')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Link trip' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
  });
});
