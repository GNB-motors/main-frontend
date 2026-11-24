import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../../utils/axiosConfig';
import Assignments from '../../services/DriverVehicleAssignmentService';
import DriversPage from './DriversPage.jsx';

vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));
vi.mock('../../utils/session.js', async (original) => ({
  ...(await original()),
  getToken: () => 'test-token',
  getProfileField: () => null,
  getUserRole: () => 'OWNER',
}));
vi.mock('../../services/vehicleListService', () => ({ getVehicleList: async () => [] }));
vi.mock('../../services/DriverVehicleAssignmentService', () => ({
  default: { getAllActiveAssignments: vi.fn() },
}));
vi.mock('./useDriverActions.js', () => ({ useDriverActions: () => ({}) }));
vi.mock('./useDriverColumns.jsx', () => ({ useDriverColumns: () => [] }));
vi.mock('./Component/EditDriverModal.jsx', () => ({ EditDriverModal: () => null }));
vi.mock('./Component/DriverConfirmModals.jsx', () => ({
  DeleteDriverModal: () => null,
  DeactivateDriverModal: () => null,
  MoveEmployeeModal: () => null,
}));
vi.mock('./BulkUploadDriversPanel.jsx', () => ({ default: () => null }));
vi.mock('./BulkAssignVehiclesPanel.jsx', () => ({ default: () => null }));
vi.mock('../../components/ui/ExportButton', () => ({ default: () => null }));
vi.mock('../../components/ui/PageShell', () => ({
  default: ({ title, count, children }) => (
    <main>
      <h1>{title}</h1>
      <output aria-label="Employee total">{count ?? '—'}</output>
      {children}
    </main>
  ),
}));
vi.mock('../../components/ui/DataTable', () => ({
  default: ({ rows, toolbarExtra, pagination, loading, error }) => (
    <>
      {toolbarExtra}
      {loading ? <p role="status">Loading employees</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      <ul aria-label="Employees">
        {rows.map((row) => (
          <li key={row.id}>{row.name}</li>
        ))}
      </ul>
      {pagination}
    </>
  ),
}));

const unassigned = Array.from({ length: 1000 }, (_, i) => ({
  _id: `unassigned-${i}`,
  firstName: 'Unassigned',
  lastName: String(i + 1),
  role: 'DRIVER',
}));
const assigned = Array.from({ length: 12 }, (_, i) => ({
  _id: `assigned-${i}`,
  firstName: 'Assigned',
  lastName: String(i + 1),
  role: 'DRIVER',
}));
const employees = [
  ...unassigned,
  ...assigned,
  { _id: 'manager', firstName: 'Manager One', role: 'MANAGER' },
];

beforeEach(() => {
  vi.clearAllMocks();
  Assignments.getAllActiveAssignments.mockResolvedValue(
    assigned.map((employee, i) => ({
      driverId: employee._id,
      vehicleId: { registrationNumber: `WB${i}` },
    })),
  );
  apiClient.get.mockImplementation(async (_url, { params }) => {
    const matches = employees.filter((row) => !params.role || row.role === params.role);
    return {
      data: {
        status: 'success',
        data: matches.slice((params.page - 1) * params.limit, params.page * params.limit),
        meta: { totalPages: Math.ceil(matches.length / params.limit) },
      },
    };
  });
});

function openPage() {
  return render(
    <MemoryRouter>
      <DriversPage />
    </MemoryRouter>,
  );
}

it('shows the API employee total rather than the ten-row page size', async () => {
  apiClient.get.mockResolvedValueOnce({
    data: {
      status: 'success',
      data: unassigned.slice(0, 10),
      meta: { total: 126, totalPages: 13 },
    },
  });
  openPage();
  await screen.findByText('Unassigned 1');
  expect(screen.getByLabelText('Employee total')).toHaveTextContent('126');
});

async function chooseFilter(label, optionName) {
  fireEvent.click(screen.getByRole('combobox', { name: label }));
  const search = await screen.findByRole('textbox', { name: 'Search options' });
  // These options and their search box are portalled outside the filter container.
  fireEvent.mouseDown(search);
  expect(screen.getByText('Filter Employees')).toBeInTheDocument();
  const option = screen.getByRole('option', { name: optionName });
  fireEvent.mouseDown(option);
  fireEvent.click(option);
  expect(screen.getByRole('button', { name: 'Apply Filters' })).toBeInTheDocument();
}

it('selects a role through the portal, applies it, and resets paging when cleared', async () => {
  openPage();
  await screen.findByText('Unassigned 1');
  fireEvent.click(screen.getByRole('button', { name: '2', exact: true }));
  await screen.findByText('Unassigned 11');
  fireEvent.click(screen.getByRole('button', { name: 'Filter employees' }));
  await chooseFilter('Role', 'Manager');
  // Selection remains a draft until Apply is clicked.
  expect(screen.getByText('Unassigned 11')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));
  await screen.findByText('Manager One');
  expect(screen.queryByText('Unassigned 11')).not.toBeInTheDocument();
  expect(apiClient.get).toHaveBeenLastCalledWith('/api/employees', {
    params: { page: 1, limit: 10, role: 'MANAGER' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Filter employees' }));
  fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));
  await screen.findByText('Unassigned 1');
  expect(screen.queryByText('Manager One')).not.toBeInTheDocument();
});

it('filters assignments across every employee API page before paginating the matches', async () => {
  openPage();
  await screen.findByText('Unassigned 1');
  fireEvent.click(screen.getByRole('button', { name: 'Filter employees' }));
  await chooseFilter('Vehicle Assignment', 'Has Vehicle');
  fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));
  await screen.findByText('Assigned 1');
  expect(screen.getByText('Assigned 10')).toBeInTheDocument();
  expect(screen.queryByText('Assigned 11')).not.toBeInTheDocument();
  expect(screen.queryByText('Unassigned 1')).not.toBeInTheDocument();
  expect(apiClient.get).toHaveBeenCalledWith('/api/employees', {
    params: { page: 2, limit: 1000 },
  });
  const calls = apiClient.get.mock.calls.length;
  fireEvent.click(screen.getByRole('button', { name: '2', exact: true }));
  expect(screen.getByText('Assigned 11')).toBeInTheDocument();
  expect(screen.getByText('Assigned 12')).toBeInTheDocument();
  expect(screen.queryByText('Assigned 1')).not.toBeInTheDocument();
  expect(apiClient.get).toHaveBeenCalledTimes(calls);
  fireEvent.click(screen.getByRole('button', { name: 'Filter employees' }));
  await chooseFilter('Vehicle Assignment', 'No Vehicle');
  fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));
  await screen.findByText('Unassigned 1');
  expect(screen.queryByText('Assigned 11')).not.toBeInTheDocument();
});

it('keeps a slower previous query from replacing the selected role', async () => {
  openPage();
  await screen.findByText('Unassigned 1');
  let finishPrevious;
  apiClient.get.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishPrevious = resolve;
      }),
  );
  fireEvent.click(screen.getByRole('button', { name: '2', exact: true }));
  await waitFor(() => expect(finishPrevious).toBeTypeOf('function'));
  fireEvent.click(screen.getByRole('button', { name: 'Filter employees' }));
  await chooseFilter('Role', 'Manager');
  fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));
  await screen.findByText('Manager One');
  await act(async () =>
    finishPrevious({
      data: {
        status: 'success',
        data: [unassigned[10]],
        meta: { totalPages: 102 },
      },
    }),
  );
  expect(screen.getByText('Manager One')).toBeInTheDocument();
  expect(screen.queryByText('Unassigned 11')).not.toBeInTheDocument();
});

it('still closes the filter when clicking outside it', async () => {
  openPage();
  await screen.findByText('Unassigned 1');
  fireEvent.click(screen.getByRole('button', { name: 'Filter employees' }));
  fireEvent.mouseDown(screen.getByRole('heading', { name: 'Employees' }));
  expect(screen.queryByText('Filter Employees')).not.toBeInTheDocument();
});
