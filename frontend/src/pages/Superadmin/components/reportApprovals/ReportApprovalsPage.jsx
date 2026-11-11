import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Check,
  X,
  Building2,
  Calendar,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { ReportApprovalService } from './ReportApprovalService';
import { getUserRole } from '../../../../utils/session';
import { formatInIST } from '../../../../utils/dateUtils';
import './ReportApprovals.css';

export default function ReportApprovalsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('REPORTS'); // 'REPORTS' | 'FIELDS'

  // Reports state
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportCounts, setReportCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [reportTab, setReportTab] = useState('PENDING'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [reportSearch, setReportSearch] = useState('');
  const [reportPage, setReportPage] = useState(1);
  const [reportPagination, setReportPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  // Field requests state
  const [fieldRequests, setFieldRequests] = useState([]);
  const [fieldLoading, setFieldLoading] = useState(true);
  const [fieldCounts, setFieldCounts] = useState({
    all: 0,
    submitted: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    implemented: 0,
  });
  const [fieldTab, setFieldTab] = useState('SUBMITTED'); // 'ALL' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED'
  const [fieldSearch, setFieldSearch] = useState('');
  const [fieldPage, setFieldPage] = useState(1);
  const [fieldPagination, setFieldPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  // Modals state
  const [selectedItem, setSelectedItem] = useState(null); // Report or Field Request object
  const [inspectType, setInspectType] = useState('REPORT'); // 'REPORT' | 'FIELD'
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingItem, setRejectingItem] = useState(null); // { id, name, type: 'REPORT'|'FIELD' }
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    const role = getUserRole();
    if (role && role !== 'SUPER_ADMIN') {
      navigate('/profile');
    }
  }, [navigate]);

  // Load custom reports
  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const params = {
        page: reportPage,
        limit: 20,
        status: reportTab === 'ALL' ? undefined : reportTab,
        search: reportSearch.trim() || undefined,
      };
      const res = await ReportApprovalService.listApprovals(params);
      setReports(res.data || []);
      if (res.pagination) setReportPagination(res.pagination);
      if (res.counts) setReportCounts(res.counts);
    } catch (err) {
      toast.error(err?.message || 'Failed to load report approvals');
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  }, [reportTab, reportSearch, reportPage]);

  // Load field requests
  const loadFields = useCallback(async () => {
    setFieldLoading(true);
    try {
      const params = {
        page: fieldPage,
        limit: 20,
        status: fieldTab === 'ALL' ? undefined : fieldTab,
        search: fieldSearch.trim() || undefined,
      };
      const res = await ReportApprovalService.listFieldRequests(params);
      setFieldRequests(res.data || []);
      if (res.pagination) setFieldPagination(res.pagination);
      if (res.counts) setFieldCounts(res.counts);
    } catch (err) {
      toast.error(err?.message || 'Failed to load field requests');
      setFieldRequests([]);
    } finally {
      setFieldLoading(false);
    }
  }, [fieldTab, fieldSearch, fieldPage]);

  useEffect(() => {
    if (activeSection === 'REPORTS') {
      loadReports();
    } else {
      loadFields();
    }
  }, [activeSection, loadReports, loadFields]);

  // Also prefetch both counts on mount
  useEffect(() => {
    ReportApprovalService.listApprovals({ limit: 1 }).then((r) => {
      if (r?.counts) setReportCounts(r.counts);
    }).catch(() => {});
    ReportApprovalService.listFieldRequests({ limit: 1 }).then((r) => {
      if (r?.counts) setFieldCounts(r.counts);
    }).catch(() => {});
  }, []);

  const handleRefresh = () => {
    if (activeSection === 'REPORTS') loadReports();
    else loadFields();
  };

  // Report Actions
  const handleApproveReport = async (id, name) => {
    setActionBusy(true);
    try {
      await ReportApprovalService.approve(id, { adminComments: 'Approved by Superadmin' });
      toast.success(`Report "${name || 'Custom Report'}" approved successfully!`);
      loadReports();
    } catch (err) {
      toast.error(err?.message || 'Failed to approve report');
    } finally {
      setActionBusy(false);
    }
  };

  // Field Request Actions
  const handleApproveField = async (id, name) => {
    setActionBusy(true);
    try {
      await ReportApprovalService.approveFieldRequest(id, {
        adminComments: 'Approved by Superadmin',
      });
      toast.success(`Field Request "${name || 'Field'}" approved successfully!`);
      loadFields();
    } catch (err) {
      toast.error(err?.message || 'Failed to approve field request');
    } finally {
      setActionBusy(false);
    }
  };

  const handleOpenReject = (item, type = 'REPORT') => {
    setRejectingItem({
      id: item._id || item.id,
      name: item.name || item.fieldName || 'Item',
      type,
    });
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingItem) return;
    setActionBusy(true);
    try {
      const reason = rejectionReason.trim() || 'Does not meet organization reporting criteria';
      if (rejectingItem.type === 'REPORT') {
        await ReportApprovalService.reject(rejectingItem.id, {
          rejectionReason: reason,
        });
        toast.info('Report marked as rejected');
        loadReports();
      } else {
        await ReportApprovalService.rejectFieldRequest(rejectingItem.id, {
          rejectionReason: reason,
        });
        toast.info('Field request marked as rejected');
        loadFields();
      }
      setShowRejectModal(false);
      setRejectingItem(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to reject item');
    } finally {
      setActionBusy(false);
    }
  };

  const isLoading = activeSection === 'REPORTS' ? reportsLoading : fieldLoading;

  return (
    <div className="ra-page">
      {/* Page Header */}
      <div className="ra-header">
        <div>
          <h2>
            <FileCheck size={24} className="text-blue-600" />
            <span>Reports Approval</span>
          </h2>
          <p>
            Review, approve, or reject custom report definitions and field requests submitted by organization users across the platform.
          </p>
        </div>
        <button
          type="button"
          className="ra-btn-action ra-btn-view"
          onClick={handleRefresh}
          disabled={isLoading}
          title="Refresh List"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Primary Section Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeSection === 'REPORTS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
          onClick={() => setActiveSection('REPORTS')}
        >
          <FileSpreadsheet size={16} />
          <span>Custom Reports</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeSection === 'REPORTS' ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {reportCounts.pending || 0} pending
          </span>
        </button>

        <button
          type="button"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeSection === 'FIELDS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
          onClick={() => setActiveSection('FIELDS')}
        >
          <MessageSquare size={16} />
          <span>Field Requests</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeSection === 'FIELDS' ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {fieldCounts.submitted || 0} new
          </span>
        </button>
      </div>

      {/* ================= SECTION 1: CUSTOM REPORTS ================= */}
      {activeSection === 'REPORTS' && (
        <>
          {/* KPI Cards */}
          <div className="ra-kpi-grid">
            <button
              type="button"
              aria-label="Filter by pending approval reports"
              className={`ra-kpi-card text-left ${reportTab === 'PENDING' ? 'is-active' : ''}`}
              onClick={() => {
                setReportTab('PENDING');
                setReportPage(1);
              }}
            >
              <div className="ra-kpi-icon pending">
                <Clock size={22} />
              </div>
              <div className="ra-kpi-content">
                <div className="ra-kpi-value">{reportCounts.pending || 0}</div>
                <div className="ra-kpi-label">Pending Approval</div>
              </div>
            </button>

            <button
              type="button"
              aria-label="Filter by approved reports"
              className={`ra-kpi-card text-left ${reportTab === 'APPROVED' ? 'is-active' : ''}`}
              onClick={() => {
                setReportTab('APPROVED');
                setReportPage(1);
              }}
            >
              <div className="ra-kpi-icon approved">
                <CheckCircle size={22} />
              </div>
              <div className="ra-kpi-content">
                <div className="ra-kpi-value">{reportCounts.approved || 0}</div>
                <div className="ra-kpi-label">Approved Reports</div>
              </div>
            </button>

            <button
              type="button"
              aria-label="Filter by rejected reports"
              className={`ra-kpi-card text-left ${reportTab === 'REJECTED' ? 'is-active' : ''}`}
              onClick={() => {
                setReportTab('REJECTED');
                setReportPage(1);
              }}
            >
              <div className="ra-kpi-icon rejected">
                <XCircle size={22} />
              </div>
              <div className="ra-kpi-content">
                <div className="ra-kpi-value">{reportCounts.rejected || 0}</div>
                <div className="ra-kpi-label">Rejected Reports</div>
              </div>
            </button>

            <button
              type="button"
              aria-label="Show all report submissions"
              className={`ra-kpi-card text-left ${reportTab === 'ALL' ? 'is-active' : ''}`}
              onClick={() => {
                setReportTab('ALL');
                setReportPage(1);
              }}
            >
              <div className="ra-kpi-icon all">
                <FileSpreadsheet size={22} />
              </div>
              <div className="ra-kpi-content">
                <div className="ra-kpi-value">{reportCounts.all || 0}</div>
                <div className="ra-kpi-label">Total Submissions</div>
              </div>
            </button>
          </div>

          {/* Content Card with Toolbar & Table */}
          <div className="ra-card">
            <div className="ra-toolbar">
              <div className="ra-tabs" role="tablist" aria-label="Status filter">
                <button
                  type="button"
                  className={`ra-tab-btn ${reportTab === 'PENDING' ? 'is-active' : ''}`}
                  onClick={() => {
                    setReportTab('PENDING');
                    setReportPage(1);
                  }}
                >
                  <span>Pending</span>
                  <span className="ra-tab-badge">{reportCounts.pending || 0}</span>
                </button>
                <button
                  type="button"
                  className={`ra-tab-btn ${reportTab === 'APPROVED' ? 'is-active' : ''}`}
                  onClick={() => {
                    setReportTab('APPROVED');
                    setReportPage(1);
                  }}
                >
                  <span>Approved</span>
                  <span className="ra-tab-badge">{reportCounts.approved || 0}</span>
                </button>
                <button
                  type="button"
                  className={`ra-tab-btn ${reportTab === 'REJECTED' ? 'is-active' : ''}`}
                  onClick={() => {
                    setReportTab('REJECTED');
                    setReportPage(1);
                  }}
                >
                  <span>Rejected</span>
                  <span className="ra-tab-badge">{reportCounts.rejected || 0}</span>
                </button>
                <button
                  type="button"
                  className={`ra-tab-btn ${reportTab === 'ALL' ? 'is-active' : ''}`}
                  onClick={() => {
                    setReportTab('ALL');
                    setReportPage(1);
                  }}
                >
                  <span>All</span>
                  <span className="ra-tab-badge">{reportCounts.all || 0}</span>
                </button>
              </div>

              <div className="ra-search-bar">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  className="ra-search-input"
                  placeholder="Search reports or organizations..."
                  aria-label="Search reports or organizations"
                  value={reportSearch}
                  onChange={(e) => {
                    setReportSearch(e.target.value);
                    setReportPage(1);
                  }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {reportsLoading ? (
                <div className="p-12 text-center text-slate-500 text-sm">
                  Loading report approval submissions...
                </div>
              ) : reports.length === 0 ? (
                <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-3">
                  <FileCheck size={40} className="text-slate-300" />
                  <div className="text-base font-semibold text-slate-700">No report submissions found</div>
                  <p className="text-xs text-slate-400 max-w-sm">
                    {reportTab === 'PENDING'
                      ? 'All submitted custom reports have been reviewed. There are no pending approvals at this time.'
                      : 'No custom reports match the current filter criteria.'}
                  </p>
                </div>
              ) : (
                <table className="ra-table">
                  <thead>
                    <tr>
                      <th>Organization</th>
                      <th>Report Details</th>
                      <th>Dataset &amp; Fields</th>
                      <th>Submitted By</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((row) => {
                      const id = row._id || row.id;
                      const orgName = row.orgId?.companyName || row.orgId?.ownerEmail || 'Organization';
                      const reqUser = row.createdBy
                        ? `${row.createdBy.firstName || ''} ${row.createdBy.lastName || ''}`.trim() ||
                          row.createdBy.email ||
                          'User'
                        : 'Fleet Member';
                      const reportStatus = row.status || 'PENDING';

                      return (
                        <tr key={id}>
                          {/* Organization */}
                          <td>
                            <div className="flex items-center gap-2">
                              <Building2 size={16} className="text-slate-400 flex-shrink-0" />
                              <span className="font-semibold text-slate-900">{orgName}</span>
                            </div>
                          </td>

                          {/* Report Details */}
                          <td>
                            <div>
                              <span className="ra-cell-title">{row.name}</span>
                              {row.description && <div className="ra-cell-sub">{row.description}</div>}
                              <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-700">
                                {row.category || 'GENERAL'}
                              </span>
                            </div>
                          </td>

                          {/* Dataset & Fields */}
                          <td aria-label="Dataset and fields">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                {(row.dataset || 'fuel_transactions').replace('_', ' ')}
                              </span>
                              <div className="ra-field-pills">
                                {(row.fields || []).slice(0, 3).map((f) => (
                                  <span key={f} className="ra-field-pill">
                                    {f}
                                  </span>
                                ))}
                                {(row.fields || []).length > 3 && (
                                  <span className="ra-field-pill bg-slate-200">
                                    +{(row.fields || []).length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Submitted By */}
                          <td aria-label="Submitted by">
                            <div>
                              <div className="font-medium text-slate-800">{reqUser}</div>
                              <div className="ra-cell-sub">{row.createdBy?.role || 'User'}</div>
                            </div>
                          </td>

                          {/* Date */}
                          <td>
                            <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                              <Calendar size={13} className="text-slate-400" />
                              <span>{formatInIST(row.createdAt, 'DD MMM YYYY, hh:mm A')}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td>
                            {reportStatus === 'APPROVED' ? (
                              <span className="ra-status-badge approved">
                                <CheckCircle size={12} />
                                <span>Approved</span>
                              </span>
                            ) : reportStatus === 'REJECTED' ? (
                              <span className="ra-status-badge rejected">
                                <XCircle size={12} />
                                <span>Rejected</span>
                              </span>
                            ) : (
                              <span className="ra-status-badge pending">
                                <Clock size={12} />
                                <span>Pending</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div className="ra-actions justify-end">
                              <button
                                type="button"
                                className="ra-btn-action ra-btn-view"
                                title="Inspect Configuration"
                                aria-label="Inspect Configuration"
                                onClick={() => {
                                  setSelectedItem(row);
                                  setInspectType('REPORT');
                                }}
                              >
                                <Eye size={13} />
                                <span>Inspect</span>
                              </button>

                              {reportStatus === 'PENDING' && (
                                <>
                                  <button
                                    type="button"
                                    className="ra-btn-action ra-btn-approve"
                                    disabled={actionBusy}
                                    title="Approve Report"
                                    aria-label="Approve Report"
                                    onClick={() => handleApproveReport(id, row.name)}
                                  >
                                    <Check size={13} />
                                    <span>Approve</span>
                                  </button>

                                  <button
                                    type="button"
                                    className="ra-btn-action ra-btn-reject"
                                    disabled={actionBusy}
                                    title="Reject Report"
                                    aria-label="Reject Report"
                                    onClick={() => handleOpenReject(row, 'REPORT')}
                                  >
                                    <X size={13} />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {reportPagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  Showing page {reportPagination.page} of {reportPagination.totalPages} ({reportPagination.total} reports)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary-action !py-1 !px-2.5 !text-xs"
                    disabled={reportPage <= 1}
                    onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-action !py-1 !px-2.5 !text-xs"
                    disabled={reportPage >= reportPagination.totalPages}
                    onClick={() => setReportPage((p) => Math.min(reportPagination.totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= SECTION 2: FIELD REQUESTS ================= */}
      {activeSection === 'FIELDS' && (
        <>
          {/* KPI Cards */}
          <div className="ra-kpi-grid">
            <button
              type="button"
              aria-label="Filter by submitted field requests"
              className={`ra-kpi-card text-left ${fieldTab === 'SUBMITTED' ? 'is-active' : ''}`}
              onClick={() => {
                setFieldTab('SUBMITTED');
                setFieldPage(1);
              }}
            >
              <div className="ra-kpi-icon pending">
                <Clock size={22} />
              </div>
              <div className="ra-kpi-content">
                <div className="ra-kpi-value">{fieldCounts.submitted || 0}</div>
                <div className="ra-kpi-label">New Requests</div>
              </div>
            </button>

            <button
              type="button"
              aria-label="Filter by under review field requests"
              className={`ra-kpi-card text-left ${fieldTab === 'UNDER_REVIEW' ? 'is-active' : ''}`}
              onClick={() => {
                setFieldTab('UNDER_REVIEW');
                setFieldPage(1);
              }}
            >
              <div className="ra-kpi-icon all">
                <Layers size={22} />
              </div>
              <div className="ra-kpi-content">
                <div className="ra-kpi-value">{fieldCounts.underReview || 0}</div>
                <div className="ra-kpi-label">Under Review</div>
              </div>
            </button>

            <button
              type="button"
              aria-label="Filter by approved field requests"
              className={`ra-kpi-card text-left ${fieldTab === 'APPROVED' ? 'is-active' : ''}`}
              onClick={() => {
                setFieldTab('APPROVED');
                setFieldPage(1);
              }}
            >
              <div className="ra-kpi-icon approved">
                <CheckCircle size={22} />
              </div>
              <div className="ra-kpi-content">
                <div className="ra-kpi-value">{fieldCounts.approved || 0}</div>
                <div className="ra-kpi-label">Approved Fields</div>
              </div>
            </button>

            <button
              type="button"
              aria-label="Show all field requests"
              className={`ra-kpi-card text-left ${fieldTab === 'ALL' ? 'is-active' : ''}`}
              onClick={() => {
                setFieldTab('ALL');
                setFieldPage(1);
              }}
            >
              <div className="ra-kpi-icon all">
                <MessageSquare size={22} />
              </div>
              <div className="ra-kpi-content">
                <div className="ra-kpi-value">{fieldCounts.all || 0}</div>
                <div className="ra-kpi-label">Total Requests</div>
              </div>
            </button>
          </div>

          {/* Content Card with Toolbar & Table */}
          <div className="ra-card">
            <div className="ra-toolbar">
              <div className="ra-tabs" role="tablist" aria-label="Field status filter">
                <button
                  type="button"
                  className={`ra-tab-btn ${fieldTab === 'SUBMITTED' ? 'is-active' : ''}`}
                  onClick={() => {
                    setFieldTab('SUBMITTED');
                    setFieldPage(1);
                  }}
                >
                  <span>Submitted</span>
                  <span className="ra-tab-badge">{fieldCounts.submitted || 0}</span>
                </button>
                <button
                  type="button"
                  className={`ra-tab-btn ${fieldTab === 'UNDER_REVIEW' ? 'is-active' : ''}`}
                  onClick={() => {
                    setFieldTab('UNDER_REVIEW');
                    setFieldPage(1);
                  }}
                >
                  <span>Under Review</span>
                  <span className="ra-tab-badge">{fieldCounts.underReview || 0}</span>
                </button>
                <button
                  type="button"
                  className={`ra-tab-btn ${fieldTab === 'APPROVED' ? 'is-active' : ''}`}
                  onClick={() => {
                    setFieldTab('APPROVED');
                    setFieldPage(1);
                  }}
                >
                  <span>Approved</span>
                  <span className="ra-tab-badge">{fieldCounts.approved || 0}</span>
                </button>
                <button
                  type="button"
                  className={`ra-tab-btn ${fieldTab === 'REJECTED' ? 'is-active' : ''}`}
                  onClick={() => {
                    setFieldTab('REJECTED');
                    setFieldPage(1);
                  }}
                >
                  <span>Rejected</span>
                  <span className="ra-tab-badge">{fieldCounts.rejected || 0}</span>
                </button>
                <button
                  type="button"
                  className={`ra-tab-btn ${fieldTab === 'ALL' ? 'is-active' : ''}`}
                  onClick={() => {
                    setFieldTab('ALL');
                    setFieldPage(1);
                  }}
                >
                  <span>All</span>
                  <span className="ra-tab-badge">{fieldCounts.all || 0}</span>
                </button>
              </div>

              <div className="ra-search-bar">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  className="ra-search-input"
                  placeholder="Search field names, modules, or reasons..."
                  aria-label="Search field requests"
                  value={fieldSearch}
                  onChange={(e) => {
                    setFieldSearch(e.target.value);
                    setFieldPage(1);
                  }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {fieldLoading ? (
                <div className="p-12 text-center text-slate-500 text-sm">
                  Loading field request submissions...
                </div>
              ) : fieldRequests.length === 0 ? (
                <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-3">
                  <MessageSquare size={40} className="text-slate-300" />
                  <div className="text-base font-semibold text-slate-700">No field requests found</div>
                  <p className="text-xs text-slate-400 max-w-sm">
                    {fieldTab === 'SUBMITTED'
                      ? 'No new field requests pending review.'
                      : 'No field requests match the selected filter.'}
                  </p>
                </div>
              ) : (
                <table className="ra-table">
                  <thead>
                    <tr>
                      <th>Organization</th>
                      <th>Requested Field</th>
                      <th>Module</th>
                      <th>Requested By</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fieldRequests.map((row) => {
                      const id = row._id || row.id;
                      const orgName = row.orgId?.companyName || row.orgId?.ownerEmail || 'Organization';
                      const reqUser = row.requestedBy
                        ? `${row.requestedBy.firstName || ''} ${row.requestedBy.lastName || ''}`.trim() ||
                          row.requestedBy.email ||
                          'User'
                        : 'Fleet Member';
                      const fStatus = row.status || 'SUBMITTED';

                      return (
                        <tr key={id}>
                          {/* Organization */}
                          <td>
                            <div className="flex items-center gap-2">
                              <Building2 size={16} className="text-slate-400 flex-shrink-0" />
                              <span className="font-semibold text-slate-900">{orgName}</span>
                            </div>
                          </td>

                          {/* Field Info */}
                          <td>
                            <div>
                              <span className="ra-cell-title">{row.fieldName}</span>
                              {row.description && <div className="ra-cell-sub">{row.description}</div>}
                            </div>
                          </td>

                          {/* Module */}
                          <td>
                            <span className="inline-block text-[11px] px-2 py-0.5 rounded font-mono font-medium bg-slate-100 text-slate-700">
                              {row.module || 'OTHER'}
                            </span>
                          </td>

                          {/* Requested By */}
                          <td aria-label="Requested by">
                            <div>
                              <div className="font-medium text-slate-800">{reqUser}</div>
                              <div className="ra-cell-sub">{row.requestedBy?.role || 'User'}</div>
                            </div>
                          </td>

                          {/* Date */}
                          <td>
                            <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                              <Calendar size={13} className="text-slate-400" />
                              <span>{formatInIST(row.createdAt, 'DD MMM YYYY, hh:mm A')}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td>
                            {fStatus === 'APPROVED' || fStatus === 'IMPLEMENTED' ? (
                              <span className="ra-status-badge approved">
                                <CheckCircle size={12} />
                                <span>{fStatus}</span>
                              </span>
                            ) : fStatus === 'REJECTED' ? (
                              <span className="ra-status-badge rejected">
                                <XCircle size={12} />
                                <span>Rejected</span>
                              </span>
                            ) : (
                              <span className="ra-status-badge pending">
                                <Clock size={12} />
                                <span>{fStatus}</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div className="ra-actions justify-end">
                              <button
                                type="button"
                                className="ra-btn-action ra-btn-view"
                                title="Inspect Field Request"
                                aria-label="Inspect Field Request"
                                onClick={() => {
                                  setSelectedItem(row);
                                  setInspectType('FIELD');
                                }}
                              >
                                <Eye size={13} />
                                <span>Inspect</span>
                              </button>

                              {(fStatus === 'SUBMITTED' || fStatus === 'UNDER_REVIEW') && (
                                <>
                                  <button
                                    type="button"
                                    className="ra-btn-action ra-btn-approve"
                                    disabled={actionBusy}
                                    title="Approve Field"
                                    aria-label="Approve Field"
                                    onClick={() => handleApproveField(id, row.fieldName)}
                                  >
                                    <Check size={13} />
                                    <span>Approve</span>
                                  </button>

                                  <button
                                    type="button"
                                    className="ra-btn-action ra-btn-reject"
                                    disabled={actionBusy}
                                    title="Reject Field"
                                    aria-label="Reject Field"
                                    onClick={() => handleOpenReject(row, 'FIELD')}
                                  >
                                    <X size={13} />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {fieldPagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  Showing page {fieldPagination.page} of {fieldPagination.totalPages} ({fieldPagination.total} requests)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary-action !py-1 !px-2.5 !text-xs"
                    disabled={fieldPage <= 1}
                    onClick={() => setFieldPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-action !py-1 !px-2.5 !text-xs"
                    disabled={fieldPage >= fieldPagination.totalPages}
                    onClick={() => setFieldPage((p) => Math.min(fieldPagination.totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Reject Feedback Modal */}
      {showRejectModal && rejectingItem && (
        <div className="ra-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ra-modal-dialog">
            <div className="ra-modal-header">
              <h3>Reject {rejectingItem.type === 'REPORT' ? 'Report' : 'Field Request'}: {rejectingItem.name}</h3>
              <button
                type="button"
                className="ra-modal-close"
                aria-label="Close rejection modal"
                onClick={() => setShowRejectModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmReject}>
              <div className="ra-modal-body">
                <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs flex items-center gap-2 mb-3">
                  <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
                  <span>
                    Provide actionable feedback explaining why this {rejectingItem.type === 'REPORT' ? 'report configuration' : 'field request'} was rejected so the user can adjust it.
                  </span>
                </div>

                <div className="builder-field-group">
                  <label htmlFor="rejection-reason">Rejection Reason / Feedback *</label>
                  <textarea
                    id="rejection-reason"
                    aria-label="Rejection Reason / Feedback"
                    className="ra-textarea"
                    rows={4}
                    placeholder="e.g. Please refine filters, or field not currently supported by telematics."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="ra-modal-footer">
                <button
                  type="button"
                  className="ra-btn-action ra-btn-view"
                  onClick={() => setShowRejectModal(false)}
                  disabled={actionBusy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ra-btn-action ra-btn-reject"
                  disabled={actionBusy}
                >
                  {actionBusy ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Item Modal */}
      {selectedItem && typeof selectedItem === 'object' && (
        <div className="ra-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ra-modal-dialog" style={{ maxWidth: 640 }}>
            <div className="ra-modal-header">
              <h3>
                {inspectType === 'REPORT' ? 'Report Configuration' : 'Field Request'}: {selectedItem.name || selectedItem.fieldName}
              </h3>
              <button
                type="button"
                className="ra-modal-close"
                aria-label="Close configuration modal"
                onClick={() => setSelectedItem(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="ra-modal-body">
              {inspectType === 'REPORT' ? (
                <>
                  <div className="ra-details-grid">
                    <div className="ra-detail-label">Organization:</div>
                    <div className="ra-detail-value font-semibold">
                      {selectedItem.orgId?.companyName || 'Organization'}
                    </div>

                    <div className="ra-detail-label">Category:</div>
                    <div className="ra-detail-value">{selectedItem.category || 'GENERAL'}</div>

                    <div className="ra-detail-label">Dataset:</div>
                    <div className="ra-detail-value font-mono font-medium text-blue-700">
                      {selectedItem.dataset}
                    </div>

                    <div className="ra-detail-label">Description:</div>
                    <div className="ra-detail-value">
                      {selectedItem.description || 'No description provided.'}
                    </div>

                    <div className="ra-detail-label">Status:</div>
                    <div className="ra-detail-value">
                      <span className={`ra-status-badge ${(selectedItem.status || 'PENDING').toLowerCase()}`}>
                        {selectedItem.status || 'PENDING'}
                      </span>
                    </div>

                    {selectedItem.adminComments && (
                      <>
                        <div className="ra-detail-label">Admin Notes:</div>
                        <div className="ra-detail-value text-red-700 bg-red-50 p-2 rounded border border-red-100">
                          {selectedItem.adminComments}
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Selected Fields ({selectedItem.fields?.length || 0})
                    </h4>
                    <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      {(selectedItem.fields || []).map((f) => (
                        <span
                          key={f}
                          className="px-2 py-0.5 rounded text-xs bg-white border border-slate-200 font-mono text-slate-800"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedItem.aggregations && selectedItem.aggregations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Aggregations
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.aggregations.map((agg, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-800 font-medium"
                          >
                            {agg.op}({agg.field})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="ra-details-grid">
                  <div className="ra-detail-label">Organization:</div>
                  <div className="ra-detail-value font-semibold">
                    {selectedItem.orgId?.companyName || 'Organization'}
                  </div>

                  <div className="ra-detail-label">Field Name:</div>
                  <div className="ra-detail-value font-semibold text-blue-800">
                    {selectedItem.fieldName}
                  </div>

                  <div className="ra-detail-label">Module:</div>
                  <div className="ra-detail-value font-mono">{selectedItem.module || 'OTHER'}</div>

                  <div className="ra-detail-label">Description:</div>
                  <div className="ra-detail-value">{selectedItem.description}</div>

                  <div className="ra-detail-label">Business Reason:</div>
                  <div className="ra-detail-value">{selectedItem.reason}</div>

                  {selectedItem.exampleOutput && (
                    <>
                      <div className="ra-detail-label">Example Output:</div>
                      <div className="ra-detail-value font-mono text-xs bg-slate-50 p-2 rounded">
                        {selectedItem.exampleOutput}
                      </div>
                    </>
                  )}

                  <div className="ra-detail-label">Status:</div>
                  <div className="ra-detail-value">
                    <span className={`ra-status-badge ${(selectedItem.status || 'SUBMITTED').toLowerCase()}`}>
                      {selectedItem.status || 'SUBMITTED'}
                    </span>
                  </div>

                  {selectedItem.adminComments && (
                    <>
                      <div className="ra-detail-label">Admin Notes:</div>
                      <div className="ra-detail-value text-red-700 bg-red-50 p-2 rounded border border-red-100">
                        {selectedItem.adminComments}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="ra-modal-footer">
              <button
                type="button"
                className="ra-btn-action ra-btn-view"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </button>
              {inspectType === 'REPORT' && (selectedItem.status || 'PENDING') === 'PENDING' && (
                <>
                  <button
                    type="button"
                    className="ra-btn-action ra-btn-reject"
                    onClick={() => {
                      const rep = selectedItem;
                      setSelectedItem(null);
                      handleOpenReject(rep, 'REPORT');
                    }}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="ra-btn-action ra-btn-approve"
                    onClick={() => {
                      const rep = selectedItem;
                      setSelectedItem(null);
                      handleApproveReport(rep._id || rep.id, rep.name);
                    }}
                  >
                    Approve Report
                  </button>
                </>
              )}
              {inspectType === 'FIELD' &&
                (selectedItem.status === 'SUBMITTED' || selectedItem.status === 'UNDER_REVIEW') && (
                  <>
                    <button
                      type="button"
                      className="ra-btn-action ra-btn-reject"
                      onClick={() => {
                        const f = selectedItem;
                        setSelectedItem(null);
                        handleOpenReject(f, 'FIELD');
                      }}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="ra-btn-action ra-btn-approve"
                      onClick={() => {
                        const f = selectedItem;
                        setSelectedItem(null);
                        handleApproveField(f._id || f.id, f.fieldName);
                      }}
                    >
                      Approve Field
                    </button>
                  </>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
