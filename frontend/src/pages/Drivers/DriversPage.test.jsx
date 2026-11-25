import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getAllDrivers, sendFile } = vi.hoisted(() => ({
  getAllDrivers: vi.fn(),
  sendFile: vi.fn(),
}));

vi.mock('./DriverService.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    DriverService: {
      ...actual.DriverService,
      getAllDrivers,
      withAssignedVehicles: vi.fn(async (list) => list),
    },
  };
});

vi.mock('../../services/vehicleListService', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getVehicleList: vi.fn(async () => []) };
});

vi.mock('../../utils/session.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getToken: () => 'test-token',
  getProfileField: () => null,
  getUserRole: () => 'OWNER',
  getUserEmail: () => 'owner@gnb.com',
}));

vi.mock('../../services/ReportEmailService', () => ({
  ReportEmailService: {
    sendServerReport: vi.fn(),
    sendFile,
    getStatus: vi.fn(),
  },
}));

vi.mock('@/components/LottieLoader.jsx', () => ({ default: () => <p>Loading</p> }));

// Only the export toolbar is under test: the table, the panels and the
// columns are stubbed out.
vi.mock('../../components/ui/DataTable', () => ({
  default: ({ toolbarExtra }) => <div>{toolbarExtra}</div>,
}));
vi.mock('../../components/ui/PageShell', () => ({
  default: ({ actions, children }) => (
    <div>
      <div>{actions}</div>
      <div>{children}</div>
    </div>
  ),
}));
vi.mock('./Component/DriverFilter.jsx', () => ({ default: () => <div>filters</div> }));
vi.mock('./Component/EditDriverModal.jsx', () => ({
  EditDriverModal: () => null,
}));
vi.mock('./Component/DriverConfirmModals.jsx', () => ({
  DeleteDriverModal: () => null,
  DeactivateDriverModal: () => null,
  MoveEmployeeModal: () => null,
}));
vi.mock('./BulkUploadDriversPanel.jsx', () => ({ default: () => null }));
vi.mock('./BulkAssignVehiclesPanel.jsx', () => ({ default: () => null }));
vi.mock('./useDriverColumns.jsx', () => ({
  useDriverColumns: () => [{ key: 'name', label: 'Name' }],
}));

const DriversPage = (await import('./DriversPage')).default;

const asha = {
  id: 'd1',
  name: 'Asha Rao',
  role: 'DRIVER',
  mobileNumber: '9000000001',
  email: 'asha@gnb.com',
  licenseNumber: 'DL-1',
  status: 'ACTIVE',
};
const vikram = {
  id: 'd2',
  name: 'Vikram Singh',
  role: 'DRIVER',
  mobileNumber: '9000000002',
  email: 'vikram@gnb.com',
  licenseNumber: 'DL-2',
  status: 'ACTIVE',
};

const mount = () =>
  render(
    <MemoryRouter>
      <DriversPage />
    </MemoryRouter>,
  );

/** The rows of a workbook, as one string. */
const readWorkbook = async (blob) => {
  const buffer = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsArrayBuffer(blob);
  });
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return Object.values(sheet)
    .map((cell) => cell.v)
    .join(' ');
};

describe('DriversPage — the employees report it mails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The page shows one employee; the export asks for every employee.
    getAllDrivers.mockImplementation(async (_ref, params) =>
      params.limit === 1000
        ? { data: [asha, vikram], meta: { totalPages: 1 } }
        : { data: [asha], meta: { totalPages: 1 } },
    );
    sendFile.mockResolvedValue({ id: 'r1', status: 'queued' });
  });

  it('spec 5: the mailed file is uploaded, and it carries every employee', async () => {
    mount();

    const trigger = await screen.findByRole('button', { name: /Export/ });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('menuitem', { name: /Email/ }));

    fireEvent.click(await screen.findByRole('button', { name: 'Send' }));

    await waitFor(() => expect(sendFile).toHaveBeenCalledTimes(1));
    const [{ blob, filename, to, reportLabel }] = sendFile.mock.calls[0];
    expect(filename).toMatch(/^employees-\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(to).toEqual(['owner@gnb.com']);
    expect(reportLabel).toBe('Employees report');

    // Every employee is in the file, not only the one on screen.
    const cells = await readWorkbook(blob);
    expect(cells).toContain('Asha Rao');
    expect(cells).toContain('Vikram Singh');
  });
});
