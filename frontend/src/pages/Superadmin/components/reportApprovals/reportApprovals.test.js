import { describe, it, expect, beforeEach } from 'vitest';
import { ReportApprovalService } from './ReportApprovalService';

describe('Superadmin Report Approval Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lists report approvals with status counts and pagination', async () => {
    // Seed sample reports into local storage
    const sampleReports = [
      {
        _id: 'rep-1',
        name: 'Fuel Consumption Tracker',
        status: 'PENDING',
        dataset: 'fuel_transactions',
        fields: ['fuelQuantity', 'fuelAmount'],
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'rep-2',
        name: 'Driver Mileage Summary',
        status: 'APPROVED',
        dataset: 'driver_summary',
        fields: ['driverName', 'mileage'],
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem('gnb_saved_custom_reports', JSON.stringify(sampleReports));

    const res = await ReportApprovalService.listApprovals();
    expect(res.status).toBe('success');
    expect(res.data.length).toBe(2);
    expect(res.counts.all).toBe(2);
    expect(res.counts.pending).toBe(1);
    expect(res.counts.approved).toBe(1);
    expect(res.counts.rejected).toBe(0);
  });

  it('filters report approvals by status (PENDING)', async () => {
    const sampleReports = [
      { _id: 'rep-1', name: 'Pending Report', status: 'PENDING' },
      { _id: 'rep-2', name: 'Approved Report', status: 'APPROVED' },
    ];
    localStorage.setItem('gnb_saved_custom_reports', JSON.stringify(sampleReports));

    const res = await ReportApprovalService.listApprovals({ status: 'PENDING' });
    expect(res.data.length).toBe(1);
    expect(res.data[0].name).toBe('Pending Report');
  });

  it('approves a report and updates its status to APPROVED', async () => {
    const sampleReports = [
      { _id: 'rep-10', name: 'Fleet Report', status: 'PENDING' },
    ];
    localStorage.setItem('gnb_saved_custom_reports', JSON.stringify(sampleReports));

    const updated = await ReportApprovalService.approve('rep-10', {
      adminComments: 'Looks great for operations',
    });
    expect(updated.status).toBe('APPROVED');
    expect(updated.adminComments).toBe('Looks great for operations');

    const counts = await ReportApprovalService.getCounts();
    expect(counts.approved).toBe(1);
    expect(counts.pending).toBe(0);
  });

  it('rejects a report with feedback reason', async () => {
    const sampleReports = [
      { _id: 'rep-20', name: 'Improper Query', status: 'PENDING' },
    ];
    localStorage.setItem('gnb_saved_custom_reports', JSON.stringify(sampleReports));

    const rejected = await ReportApprovalService.reject('rep-20', {
      rejectionReason: 'Too many high-cardinality fields requested',
    });
    expect(rejected.status).toBe('REJECTED');
    expect(rejected.rejectionReason).toBe('Too many high-cardinality fields requested');

    const counts = await ReportApprovalService.getCounts();
    expect(counts.rejected).toBe(1);
    expect(counts.pending).toBe(0);
  });

  it('lists field requests and supports approve/reject actions', async () => {
    const sampleFields = [
      {
        _id: 'freq-1',
        fieldName: 'Odometer Telemetry Timestamp',
        module: 'VEHICLE',
        status: 'SUBMITTED',
      },
    ];
    localStorage.setItem('gnb_custom_field_requests', JSON.stringify(sampleFields));

    const listRes = await ReportApprovalService.listFieldRequests();
    expect(listRes.status).toBe('success');
    expect(listRes.data.length).toBe(1);
    expect(listRes.counts.submitted).toBe(1);

    const approved = await ReportApprovalService.approveFieldRequest('freq-1', {
      adminComments: 'Field added to catalog',
    });
    expect(approved.status).toBe('APPROVED');

    const rejected = await ReportApprovalService.rejectFieldRequest('freq-1', {
      rejectionReason: 'Not available from CAN bus',
    });
    expect(rejected.status).toBe('REJECTED');
  });
});

