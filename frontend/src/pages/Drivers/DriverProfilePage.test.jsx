import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import DriverProfilePage from './DriverProfilePage';
import Service from './DriverProfileService';
import { useDriverColumns } from './useDriverColumns';
vi.mock('./DriverProfileService', () => ({
  default: {
    employee: vi.fn(),
    assignments: vi.fn(),
    documents: vi.fn(),
    trips: vi.fn(),
    weeklyEvents: vi.fn(),
  },
}));
vi.mock('@/api/performance', () => ({ default: { driver: async () => ({ dna: null }) } }));
vi.mock('@/utils/session', async (original) => ({
  ...(await original()),
  getUserRole: () => 'OWNER',
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));
function Edit() {
  const location = useLocation();
  return <p>Edit form for {location.state?.editingDriver?.name}</p>;
}
beforeEach(() => {
  vi.clearAllMocks();
  Service.employee.mockResolvedValue({
    _id: 'd1',
    firstName: 'Ramesh',
    lastName: 'Yadav',
    role: 'DRIVER',
  });
  Service.assignments.mockResolvedValue([
    {
      _id: 'a1',
      vehicleId: { registrationNumber: 'WB11T0662' },
      startDate: '2026-11-01T00:00:00Z',
    },
  ]);
  Service.documents.mockResolvedValue([
    {
      _id: 'doc1',
      docType: 'DRIVING_LICENSE',
      files: [{ publicUrl: 'https://example.com/license.jpg' }],
    },
  ]);
  Service.trips.mockResolvedValue([]);
  Service.weeklyEvents.mockResolvedValue([]);
});
const mount = () =>
  render(
    <MemoryRouter initialEntries={['/drivers/d1']}>
      <Routes>
        <Route path="/drivers/:id" element={<DriverProfilePage />} />
        <Route path="/drivers/add" element={<Edit />} />
      </Routes>
    </MemoryRouter>,
  );
it('opens a read-only employee profile with assignments, weekly charts, trips and documents', async () => {
  mount();
  expect(await screen.findByRole('heading', { name: 'Ramesh Yadav' })).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: 'WB11T0662' })).toHaveAttribute(
    'href',
    '/vehicles/WB11T0662',
  );
  expect(screen.getByRole('figure', { name: 'Idling per week' })).toBeInTheDocument();
  expect(screen.getByText('Driving licence')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /this driver.*idling/ })).toHaveAttribute(
    'href',
    expect.stringContaining('driver=d1'),
  );
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Edit employee' }));
  expect(await screen.findByText('Edit form for Ramesh Yadav')).toBeInTheDocument();
});
it('shows a retry for failed documents while keeping the profile available', async () => {
  Service.documents.mockRejectedValue(new Error('Documents offline'));
  mount();
  await screen.findByRole('heading', { name: 'Ramesh Yadav' });
  await waitFor(() => expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument());
  expect(screen.queryByText('No employee documents have been uploaded.')).not.toBeInTheDocument();
});
it('distinguishes View details from Edit in the employee row', () => {
  const view = vi.fn(),
    edit = vi.fn();
  function Actions() {
    const columns = useDriverColumns({ onView: view, onEdit: edit });
    return columns.find((column) => column.key === 'actions').render({ id: 'd1', name: 'Ramesh' });
  }
  render(<Actions />);
  fireEvent.click(screen.getByTitle('View details'));
  expect(view).toHaveBeenCalledWith(expect.objectContaining({ id: 'd1' }));
  expect(edit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByTitle('Edit employee'));
  expect(edit).toHaveBeenCalled();
});

it('does not load another employee context when the requested profile is absent', async () => {
  Service.employee.mockResolvedValue(null);
  mount();
  expect(await screen.findByText('Employee not found in this location.')).toBeInTheDocument();
  expect(Service.assignments).not.toHaveBeenCalled();
  expect(Service.documents).not.toHaveBeenCalled();
});
