import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ApprovalsPage from './ApprovalsPage';
import MovementApprovalService from '../../services/MovementApprovalService';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';

vi.mock('../../hooks/usePageLayout', () => ({ useFullPageLayout: vi.fn() }));
vi.mock('../../contexts/FeatureFlagsContext', () => ({ useFeatureFlags: vi.fn() }));
vi.mock('../../utils/session', async (importOriginal) => ({
  ...(await importOriginal()),
  getUserRole: () => 'OWNER',
}));
vi.mock('../Superadmin/components/ReceiptApprovalPage', () => ({
  default: () => <p>WhatsApp queue</p>,
}));
vi.mock('./OfficeBillApprovals', () => ({ default: () => <p>Office queue</p> }));
vi.mock('./FieldAgentApprovals', () => ({ default: () => <p>Field agent queue</p> }));
vi.mock('./ApprovalsService', () => ({
  ApprovalsService: { getWhatsAppPendingCount: vi.fn().mockResolvedValue(0) },
}));
vi.mock('../../services/billPhotoService', () => ({
  default: { listBillCaptures: vi.fn().mockResolvedValue({ total: 0 }) },
}));
vi.mock('../FieldAgentFuel/FieldAgentFuelService', () => ({
  FieldAgentFuelService: { approvalCounts: vi.fn().mockResolvedValue({ PENDING: 0 }) },
}));
vi.mock('../../services/MovementApprovalService', () => ({
  default: { list: vi.fn(), revoke: vi.fn() },
}));
vi.mock('../../services/vehicleListService', () => ({
  getVehicleList: vi.fn().mockResolvedValue([{ _id: 'truck1', registrationNumber: 'WB11R7062' }]),
}));
vi.mock('../AutoTrips/AutoTripsService', () => ({
  AutoTripsService: { listEmployees: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../AutoTrips/ApprovalCreateDialog', () => ({
  default: ({ open, onCreated }) =>
    open ? <button onClick={onCreated}>Save new approval</button> : null,
}));

const rows = [
  {
    _id: 'a1',
    vehicleId: 'truck1',
    status: 'ACTIVE',
    placeSpec: { kind: 'ANY_WORKSHOP' },
    kind: 'PRE',
  },
  {
    _id: 'a2',
    vehicleId: 'truck1',
    status: 'REVOKED',
    placeSpec: { kind: 'TYPE', type: 'LOADING' },
    kind: 'STANDING',
  },
];
const open = () =>
  render(
    <MemoryRouter initialEntries={['/approvals?type=trips']}>
      <ApprovalsPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  useFeatureFlags.mockReturnValue({ isEnabled: () => true });
  MovementApprovalService.list.mockImplementation(async (params) => {
    const items = rows.filter((row) => !params.status || row.status === params.status);
    return { items, total: items.length };
  });
  MovementApprovalService.revoke.mockResolvedValue({});
});

it('opens trip approvals as the fourth hub tab without a separate page header', async () => {
  open();
  const tabs = within(screen.getByRole('tablist', { name: 'Approval type' })).getAllByRole('tab');
  expect(tabs).toHaveLength(4);
  expect(tabs[3]).toHaveTextContent('Trip approvals');
  expect(tabs[3]).toHaveAttribute('aria-selected', 'true');
  expect(tabs[3].querySelector('.apv-type__count')).toBeNull();
  expect(await screen.findByRole('button', { name: 'Revoke' })).toBeInTheDocument();
  expect(await screen.findAllByText('WB11R7062')).toHaveLength(2);
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Approvals');
  fireEvent.click(screen.getByRole('tab', { name: 'Revoked', exact: true }));
  await waitFor(() =>
    expect(MovementApprovalService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'REVOKED', page: 1 }),
      expect.anything(),
    ),
  );
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: 'Revoke' })).not.toBeInTheDocument(),
  );
});

it('keeps creation and revocation working inside the hub', async () => {
  open();
  fireEvent.click(await screen.findByRole('button', { name: 'Revoke' }));
  await waitFor(() =>
    expect(MovementApprovalService.revoke).toHaveBeenCalledWith({ id: 'a1' }, expect.anything()),
  );
  await waitFor(() => expect(MovementApprovalService.list).toHaveBeenCalledTimes(2));
  fireEvent.click(screen.getByRole('button', { name: 'New trip approval' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save new approval' }));
  await waitFor(() => expect(MovementApprovalService.list).toHaveBeenCalledTimes(3));
  expect(screen.queryByRole('button', { name: 'Save new approval' })).not.toBeInTheDocument();
});

it('hides the trip tab and makes no trip requests when autoTrips is disabled', async () => {
  useFeatureFlags.mockReturnValue({ isEnabled: () => false });
  open();
  expect(screen.queryByRole('tab', { name: 'Trip approvals' })).not.toBeInTheDocument();
  expect(await screen.findByText('WhatsApp queue')).toBeInTheDocument();
  expect(MovementApprovalService.list).not.toHaveBeenCalled();
});
