import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FieldRequestsView from './FieldRequestsView';
import CustomReportsPage from './CustomReportsPage';
import { ReportsService } from '../../ReportsService';
import ReportsApprovalPage from '@/pages/Superadmin/components/reportsApproval/ReportsApprovalPage';
import ReportReviewDetailPage from '@/pages/Superadmin/components/reportsApproval/ReportReviewDetailPage';
import ReportReviewModal from '@/pages/Superadmin/components/reportsApproval/ReportReviewModal';
import { ReportsApprovalAdminService } from '@/pages/Superadmin/components/reportsApproval/ReportsApprovalAdminService';

const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/superadmin/reports-approval', state: null }),
  useParams: () => ({ id: 'sub-1' }),
}));

// Mock user session
vi.mock('../../../../utils/session', () => ({
  getUserRole: () => 'SUPER_ADMIN',
  getStorageItem: vi.fn(),
  setStorageItem: vi.fn(),
  getPref: vi.fn(),
  setPref: vi.fn(),
}));

describe('Customer Portal: Submitted Reports Status & Feedback View', () => {
  const mockSavedReports = [
    {
      _id: 'report-1',
      name: 'Monthly Diesel Analytics',
      category: 'FUEL',
      dataset: 'fuel_transactions',
      fields: ['fuelDate', 'fuelQuantity', 'fuelAmount'],
      status: 'PENDING',
      createdAt: '2026-11-13T10:00:00.000Z',
    },
    {
      _id: 'report-2',
      name: 'West Bengal Compliance Audit',
      category: 'COMPLIANCE',
      dataset: 'vehicle_compliance',
      fields: ['vehicleNumber', 'rcStatus', 'fitnessStatus'],
      status: 'APPROVED',
      adminComments: 'Verified and approved for corporate safety audit.',
      createdAt: '2026-11-12T10:00:00.000Z',
      reviewedAt: '2026-11-12T14:30:00.000Z',
    },
    {
      _id: 'report-3',
      name: 'Unfiltered Speed Violations',
      category: 'GENERAL',
      dataset: 'fuel_transactions',
      fields: ['driverName'],
      status: 'REJECTED',
      rejectionReason: 'Missing vehicle number and mandatory date filters. Please re-configure.',
      createdAt: '2026-11-11T09:00:00.000Z',
      reviewedAt: '2026-11-11T16:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(ReportsService, 'getSavedCustomReports').mockResolvedValue(mockSavedReports);
    vi.spyOn(ReportsService, 'getFieldRequests').mockResolvedValue([]);
  });

  it('renders submitted reports sub-tab and shows status badges correctly', async () => {
    render(<FieldRequestsView userRole="USER" />);

    // Shows Sub-tabs
    expect(screen.getByText('Submitted Custom Reports')).toBeDefined();
    expect(screen.getByText('Requested Fields')).toBeDefined();

    // Wait for reports to load
    await waitFor(() => {
      expect(screen.getByText('Monthly Diesel Analytics')).toBeDefined();
      expect(screen.getByText('West Bengal Compliance Audit')).toBeDefined();
      expect(screen.getByText('Unfiltered Speed Violations')).toBeDefined();
    });

    // PENDING report status
    expect(screen.getByText('Pending Super Admin Review')).toBeDefined();

    // APPROVED report status & note
    expect(screen.getByText('Approved by Super Admin')).toBeDefined();
    expect(screen.getByText('Verified and approved for corporate safety audit.')).toBeDefined();

    // REJECTED report status & feedback
    expect(screen.getByText('Rejected')).toBeDefined();
    expect(
      screen.getByText(
        'Missing vehicle number and mandatory date filters. Please re-configure.',
      ),
    ).toBeDefined();
  });

  it('does not render Run Report button on approved report and displays approved status', async () => {
    render(<FieldRequestsView userRole="USER" />);

    await waitFor(() => {
      expect(screen.getByText('West Bengal Compliance Audit')).toBeDefined();
    });

    // Run Report button should be removed
    const runBtn = screen.queryByRole('button', { name: /Run Report/i });
    expect(runBtn).toBeNull();
    // Approved badge is visible
    expect(screen.getByText('Approved by Super Admin')).toBeDefined();
  });

  it('triggers Edit & Resubmit callback when user clicks on rejected report', async () => {
    const handleLoadReport = vi.fn();
    render(<FieldRequestsView userRole="USER" onLoadReport={handleLoadReport} />);

    await waitFor(() => {
      expect(screen.getByText('Unfiltered Speed Violations')).toBeDefined();
    });

    const editResubmitBtn = screen.getByRole('button', { name: /Edit & Resubmit/i });
    expect(editResubmitBtn).toBeDefined();
    fireEvent.click(editResubmitBtn);

    expect(handleLoadReport).toHaveBeenCalledTimes(1);
    expect(handleLoadReport).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'report-3', status: 'REJECTED' }),
      false, // autoRun = false
    );
  });
});

describe('Super Admin: Reports Approval Module', () => {
  const mockSubmissions = [
    {
      _id: 'sub-1',
      name: 'Weekly Fuel High Spenders',
      category: 'FUEL',
      dataset: 'fuel_transactions',
      fields: ['fuelDate', 'vehicleNumber', 'fuelAmount'],
      status: 'PENDING',
      orgId: { _id: 'org-1', companyName: 'Acme Logistics' },
      createdBy: { _id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@acme.com' },
      createdAt: '2026-11-13T11:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(ReportsApprovalAdminService, 'list').mockResolvedValue({
      items: mockSubmissions,
      pagination: { total: 1, page: 1, totalPages: 1, limit: 15 },
    });
    vi.spyOn(ReportsApprovalAdminService, 'summary').mockResolvedValue({
      total: 10,
      pending: 3,
      approved: 5,
      rejected: 2,
    });
  });

  it('renders Super Admin reports approval dashboard with KPI cards and table', async () => {
    render(<ReportsApprovalPage />);

    expect(screen.getByText('Custom Reports Approval')).toBeDefined();

    // Wait for submissions table row to load
    expect(await screen.findByText('Weekly Fuel High Spenders')).toBeDefined();
    expect(screen.getByText('Acme Logistics')).toBeDefined();
    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('john@acme.com')).toBeDefined();

    // KPI cards loaded
    expect(screen.getAllByText('Pending Review').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Approved/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Rejected/i).length).toBeGreaterThan(0);

    // Click Review navigates to new review detail page
    const reviewBtn = screen.getByRole('button', { name: /Review Weekly Fuel High Spenders/i });
    fireEvent.click(reviewBtn);
    expect(mockNavigate).toHaveBeenCalledWith(
      '/superadmin/reports-approval/sub-1',
      expect.anything(),
    );
  });

  it('renders ReportReviewDetailPage and allows approving report', async () => {
    vi.spyOn(ReportsApprovalAdminService, 'get').mockResolvedValue(mockSubmissions[0]);
    const reviewSpy = vi.spyOn(ReportsApprovalAdminService, 'review').mockResolvedValue({
      _id: 'sub-1',
      status: 'APPROVED',
      adminComments: 'Looks great!',
    });

    render(<ReportReviewDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Weekly Fuel High Spenders/i })).toBeDefined();
    });

    expect(screen.getByText('Acme Logistics')).toBeDefined();
    expect(screen.getByText('fuel_transactions')).toBeDefined();

    // Type comment
    const commentInput = screen.getByLabelText(/Super Admin Review Notes \/ Rejection Reason/i);
    fireEvent.change(commentInput, { target: { value: 'Looks great!' } });

    // Click Approve button
    const approveBtns = screen.getAllByRole('button', { name: /Approve Report/i });
    fireEvent.click(approveBtns[0]);

    await waitFor(() => {
      expect(reviewSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sub-1',
          status: 'APPROVED',
          comments: 'Looks great!',
        }),
      );
    });
  });

  it('opens review modal fallback and allows approving or rejecting report', async () => {
    const reviewSpy = vi.spyOn(ReportsApprovalAdminService, 'review').mockResolvedValue({
      _id: 'sub-1',
      status: 'APPROVED',
      adminComments: 'Looks great!',
    });

    const handleUpdated = vi.fn();
    const handleClose = vi.fn();

    render(
      <ReportReviewModal
        report={mockSubmissions[0]}
        isOpen={true}
        onClose={handleClose}
        onUpdated={handleUpdated}
      />,
    );

    expect(screen.getByRole('heading', { name: /Weekly Fuel High Spenders/i })).toBeDefined();
    expect(screen.getByText('Acme Logistics')).toBeDefined();
    expect(screen.getByText('fuel_transactions')).toBeDefined();

    // Type comment
    const commentInput = screen.getByLabelText(/Super Admin Review Notes \/ Rejection Reason/i);
    fireEvent.change(commentInput, { target: { value: 'Looks great!' } });

    // Click Approve button
    const approveBtn = screen.getByRole('button', { name: /Approve Report/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(reviewSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sub-1',
          status: 'APPROVED',
          comments: 'Looks great!',
        }),
      );
      expect(handleUpdated).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
