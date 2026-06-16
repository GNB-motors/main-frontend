import { toISTDateString, toISTTimeString, formatDateIST } from '../../utils/dateUtils';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, PlusCircle, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import '../PageStyles.css';
import './RefuelLogsPage.css';
import '../../components/JourneySetupModal/modal.css';
import apiClient from '../../utils/axiosConfig';
import ChevronIcon from './assets/ChevronIcon.jsx';

const FUEL_TYPES = ['DIESEL', 'ADBLUE'];
const FILLING_TYPES = ['PARTIAL', 'FULL_TANK'];

const PAGE_SIZE = 10;

// Maps the UI filter tab to the server-side `fuelType` query param.
// `all` sends no filter so the API returns every fuel type.
const TAB_TO_FUEL_TYPE = {
  all: undefined,
  diesel: 'DIESEL',
  adblue: 'ADBLUE',
};

const fetchRefuelLogs = async ({ page = 1, limit = PAGE_SIZE, fuelType, search } = {}) => {
  const params = { page, limit };
  if (fuelType) {
    params.fuelType = fuelType;
  }
  if (search) {
    params.search = search;
  }

  const response = await apiClient.get('api/fuel-logs', { params });
  if (response.data.status === 'success') {
    const mapped = response.data.data.map(log => ({
        id: log._id,
        date: log.refuelTime ? toISTDateString(log.refuelTime) : null,
        time: log.refuelTime ? toISTTimeString(log.refuelTime) : null,
        vehicleNo: log.vehicleId?.registrationNumber || '-',
        vehicleModel: log.vehicleId?.vehicleType || '-',
        vehicleId: log.vehicleId?._id,
        driverName: (() => {
          const d = log.driverId || log.tripId?.driverId;
          return d ? `${d.firstName || ''} ${d.lastName || ''}`.trim() || '-' : '-';
        })(),
        driverPhone: '-', // Not available in API
        location: log.location || '-',
        vendor: '-', // Not available in API
        fuelType: log.fuelType ? log.fuelType.toLowerCase() : 'unknown',
        quantity: log.litres || '-',
        unitPrice: log.rate || null,
        totalAmount: log.totalAmount || '-',
        odometer: log.odometerReading || '-',
        paymentMethod: '-', // Not available in API
        notes: log.fillingType ? (log.fillingType === 'FULL_TANK' ? 'Full Tank' : log.fillingType) : '-',
        tripId: log.tripId,
        documentId: log.documentId,
        odometerDocId: log.odometerDocId,
        loggedBy: log.loggedBy,
        createdAt: log.createdAt,
        refuelTime: log.refuelTime,
        rawFuelType: log.fuelType,
        rawFillingType: log.fillingType,
        rawLitres: log.litres,
        rawRate: log.rate,
        rawOdometer: log.odometerReading,
        rawLocation: log.location,
      }));
    const total = response.data.meta?.total ?? mapped.length;
    return { logs: mapped, total };
  }
  return { logs: [], total: 0 };
};

const updateFuelLog = async (id, data) => {
  const response = await apiClient.put(`api/mileage/fuel-log/${id}`, data);
  return response.data;
};

const deleteFuelLog = async (id) => {
  const response = await apiClient.delete(`api/mileage/fuel-log/${id}`);
  return response.data;
};

const toDatetimeLocal = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  // Convert to local ISO-like string for datetime-local input
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const fromDatetimeLocal = (localString) => {
  if (!localString) return null;
  const date = new Date(localString);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const filterTabs = [
  { id: 'all', label: 'All' },
  { id: 'diesel', label: 'Diesel' },
  { id: 'adblue', label: 'AdBlue' }
];

const formatDate = (dateStr) => formatDateIST(dateStr);

const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '-';
  }
  return `₹${Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const RefuelLogsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });

  // Click-and-drag horizontal scrolling for the table. The container already
  // scrolls via wheel/scrollbar (overflow-x: auto); this adds grab-to-pan.
  const tableContainerRef = useRef(null);
  const tableDrag = useRef({ down: false, startX: 0, scrollLeft: 0, moved: false });

  const handleTableMouseDown = (event) => {
    const el = tableContainerRef.current;
    // Only start a drag when there is actually overflow to scroll, and never
    // hijack interactions that start on a control (edit/delete buttons, links).
    if (!el || el.scrollWidth <= el.clientWidth) return;
    if (event.target.closest('button, a, input, select')) return;
    tableDrag.current = {
      down: true,
      startX: event.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
    el.classList.add('is-dragging');
  };

  const handleTableMouseMove = (event) => {
    const el = tableContainerRef.current;
    if (!el || !tableDrag.current.down) return;
    event.preventDefault();
    const walk = (event.pageX - el.offsetLeft) - tableDrag.current.startX;
    if (Math.abs(walk) > 4) tableDrag.current.moved = true;
    el.scrollLeft = tableDrag.current.scrollLeft - walk;
  };

  const endTableDrag = () => {
    const el = tableContainerRef.current;
    if (!el) return;
    tableDrag.current.down = false;
    el.classList.remove('is-dragging');
  };

  // Swallow the click that fires at the end of a real drag so dragging across
  // a row never accidentally triggers its edit/delete button.
  const handleTableClickCapture = (event) => {
    if (tableDrag.current.moved) {
      event.stopPropagation();
      event.preventDefault();
      tableDrag.current.moved = false;
    }
  };

  // Show the grab cursor only when the table actually overflows horizontally.
  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return undefined;
    const updateScrollable = () => {
      el.classList.toggle('is-scrollable', el.scrollWidth > el.clientWidth + 1);
    };
    updateScrollable();
    window.addEventListener('resize', updateScrollable);
    return () => window.removeEventListener('resize', updateScrollable);
  }, [logs, loading]);

  // Edit modal state
  const [editingLog, setEditingLog] = useState(null);
  const [editForm, setEditForm] = useState({
    fuelType: 'DIESEL',
    fillingType: 'PARTIAL',
    litres: '',
    rate: '',
    odometerReading: '',
    location: '',
    refuelTime: '',
  });

  // Delete confirmation state
  const [deletingLog, setDeletingLog] = useState(null);

  useEffect(() => {
    const pageContentEl = document.querySelector('.page-content');
    if (pageContentEl) {
      pageContentEl.classList.add('no-padding');
    }

    return () => {
      if (pageContentEl) {
        pageContentEl.classList.remove('no-padding');
      }
    };
  }, []);

  // Debounce the search box, then snap back to page 1 so results start at the top.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPagination((p) => (p.page === 1 ? p : { ...p, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { logs: fetchedLogs, total } = await fetchRefuelLogs({
        page: pagination.page,
        limit: pagination.limit,
        fuelType: TAB_TO_FUEL_TYPE[activeTab],
        search: debouncedSearch,
      });
      setLogs(fetchedLogs);
      setPagination((p) => ({ ...p, total }));
    } catch (err) {
      setError('Failed to load refuel logs');
      console.error('Error loading refuel logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refetch whenever the page, fuel-type tab, or search term changes (all server-side).
  useEffect(() => {
    loadLogs();
  }, [pagination.page, activeTab, debouncedSearch]);

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setPagination((p) => ({ ...p, page }));
    }
  };

  // Switching tabs resets to page 1 so we don't land on an out-of-range page.
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const generatePageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (pagination.page > 3) pages.push('...');
      for (let i = Math.max(2, pagination.page - 1); i <= Math.min(totalPages - 1, pagination.page + 1); i++) {
        if (i !== 1 && i !== totalPages) pages.push(i);
      }
      if (pagination.page < totalPages - 2) pages.push('...');
      if (totalPages > 1) pages.push(totalPages);
    }
    return pages;
  };

  const handleEditClick = (log) => {
    setEditingLog(log);
    setEditForm({
      fuelType: log.rawFuelType || 'DIESEL',
      fillingType: log.rawFillingType || 'PARTIAL',
      litres: log.rawLitres ?? '',
      rate: log.rawRate ?? '',
      odometerReading: log.rawOdometer ?? '',
      location: log.rawLocation || '',
      refuelTime: toDatetimeLocal(log.refuelTime),
    });
  };

  const handleEditClose = () => {
    setEditingLog(null);
    setSubmitting(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingLog) return;

    const payload = {
      fuelType: editForm.fuelType,
      fillingType: editForm.fillingType,
      litres: editForm.litres !== '' ? Number(editForm.litres) : undefined,
      rate: editForm.rate !== '' ? Number(editForm.rate) : undefined,
      odometerReading: editForm.odometerReading !== '' ? Number(editForm.odometerReading) : undefined,
      location: editForm.location || undefined,
      refuelTime: fromDatetimeLocal(editForm.refuelTime) || undefined,
    };

    setSubmitting(true);
    try {
      await updateFuelLog(editingLog.id, payload);
      toast.success('Fuel log updated successfully');
      handleEditClose();
      await loadLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update fuel log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (log) => {
    setDeletingLog(log);
  };

  const handleDeleteClose = () => {
    setDeletingLog(null);
    setSubmitting(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLog) return;

    setSubmitting(true);
    try {
      await deleteFuelLog(deletingLog.id);
      toast.success('Fuel log deleted successfully');
      handleDeleteClose();
      await loadLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete fuel log');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="refuel-logs-page">
      <div className="refuel-logs-header">
        <div className="refuel-tabs">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`refuel-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="refuel-header-actions">
          <div className="refuel-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search vehicle, driver, or location"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div
        className="refuel-table-container"
        ref={tableContainerRef}
        onMouseDown={handleTableMouseDown}
        onMouseMove={handleTableMouseMove}
        onMouseUp={endTableDrag}
        onMouseLeave={endTableDrag}
        onClickCapture={handleTableClickCapture}
      >
        <table className="refuel-table">
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Location</th>
              <th>Fuel Type</th>
              <th>Quantity (L)</th>
              <th>Unit Price</th>
              <th>Total Amount</th>
              <th>Odometer</th>
              <th>Type</th>
              <th style={{ width: '90px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="refuel-empty-state">
                  Loading refuel logs...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={11} className="refuel-empty-state">
                  {error}
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={11} className="refuel-empty-state">
                  <div className="refuel-empty-state-inner">
                    <FileText size={48} color="#9ca3af" />
                    <p>No refuel logs found</p>
                    {(searchTerm || activeTab !== 'all') ? (
                      <p className="refuel-empty-subtext">Try adjusting your search</p>
                    ) : (
                      <button
                        className="refuel-empty-action-btn"
                        onClick={() => navigate('/mileage-tracking/new')}
                      >
                        <PlusCircle size={18} /> Add Refuel Log
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const timestamp = log.date ? `${log.date}${log.time ? `T${log.time}` : ''}` : null;
                const formattedDate = timestamp ? formatDate(timestamp) : formatDate(log.date);

                return (
                  <tr key={log.id}>
                    <td>
                      <div className="cell-primary">{formattedDate}</div>
                      <div className="cell-secondary">{log.time || '-'}</div>
                    </td>
                    <td>
                      <div className="cell-primary">{log.vehicleNo || '-'}</div>
                      <div className="cell-secondary">{log.vehicleModel || '--'}</div>
                    </td>
                    <td>
                      <div className="cell-primary">{log.driverName || '-'}</div>
                      <div className="cell-secondary">{log.driverPhone || '--'}</div>
                    </td>
                    <td>
                      <div className="cell-primary">{log.location || '-'}</div>
                      <div className="cell-secondary">{log.vendor || '--'}</div>
                    </td>
                    <td>
                      <span className={`fuel-type-pill ${
                        log.fuelType ? log.fuelType.toLowerCase() : 'unknown'
                      }`}
                      >
                        {log.fuelType || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div className="cell-primary">{log.quantity || '-'}</div>
                      <div className="cell-secondary">Litres</div>
                    </td>
                    <td>{formatCurrency(log.unitPrice)}</td>
                    <td>{formatCurrency(log.totalAmount)}</td>
                    <td>
                      <div className="cell-primary">{log.odometer ? `${log.odometer} km` : '-'}</div>
                      <div className="cell-secondary">Reading</div>
                    </td>
                    <td>
                      <div className="cell-primary">{log.notes || '-'}</div>
                    </td>
                    <td>
                      <div className="refuel-actions">
                        <button
                          type="button"
                          className="refuel-action-btn edit"
                          title="Edit"
                          onClick={() => handleEditClick(log)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="refuel-action-btn delete"
                          title="Delete"
                          onClick={() => handleDeleteClick(log)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && !error && pagination.total > 0 && (
        <div className="refuel-pagination-controls">
          <button
            className="refuel-pagination-btn"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || totalPages <= 1}
          >
            <ChevronIcon size={12} style={{ transform: 'rotate(90deg)' }} />
          </button>

          {generatePageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <div key={`overflow-${index}`} className="refuel-page-overflow">
                  <span>...</span>
                </div>
              );
            }
            return (
              <button
                key={page}
                className={`refuel-page-number ${pagination.page === page ? 'refuel-page-number-current' : ''}`}
                onClick={() => handlePageChange(page)}
                disabled={totalPages <= 1}
              >
                <span>{page}</span>
              </button>
            );
          })}

          <button
            className="refuel-pagination-btn"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === totalPages || totalPages <= 1}
          >
            <ChevronIcon size={12} style={{ transform: 'rotate(-90deg)' }} />
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingLog && createPortal(
        <div className="refuel-modal-overlay" onClick={handleEditClose}>
          <div className="refuel-modal refuel-edit-modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="refuel-modal-header">
              <h2>Edit Fuel Log</h2>
              <button type="button" className="refuel-modal-close" onClick={handleEditClose}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="refuel-modal-body">
                <div className="refuel-form-row">
                  <div className="form-group">
                    <label>Fuel Type</label>
                    <select
                      value={editForm.fuelType}
                      onChange={(e) => setEditForm({ ...editForm, fuelType: e.target.value })}
                      required
                    >
                      {FUEL_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Filling Type</label>
                    <select
                      value={editForm.fillingType}
                      onChange={(e) => setEditForm({ ...editForm, fillingType: e.target.value })}
                      required
                    >
                      {FILLING_TYPES.map((type) => (
                        <option key={type} value={type}>{type.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="refuel-form-row">
                  <div className="form-group">
                    <label>Quantity (Litres)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.litres}
                      onChange={(e) => setEditForm({ ...editForm, litres: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Rate per Litre</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.rate}
                      onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="refuel-form-row">
                  <div className="form-group">
                    <label>Odometer Reading (km)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={editForm.odometerReading}
                      onChange={(e) => setEditForm({ ...editForm, odometerReading: e.target.value })}
                    />
                    <span className="refuel-form-hint">Optional — FleetEdge can backfill later</span>
                  </div>
                  <div className="form-group">
                    <label>Refuel Time</label>
                    <input
                      type="datetime-local"
                      value={editForm.refuelTime}
                      onChange={(e) => setEditForm({ ...editForm, refuelTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="Enter location"
                  />
                </div>
              </div>
              <div className="refuel-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleEditClose} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deletingLog && createPortal(
        <div className="refuel-modal-overlay" onClick={handleDeleteClose}>
          <div className="refuel-modal refuel-delete-modal" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="refuel-modal-header">
              <h2>Delete Fuel Log</h2>
              <button type="button" className="refuel-modal-close" onClick={handleDeleteClose}>
                <X size={20} />
              </button>
            </div>
            <div className="refuel-modal-body">
              <div className="refuel-delete-warning">
                <AlertTriangle size={40} color="#dc2626" />
                <p>Are you sure you want to delete this fuel log?</p>
                <p className="refuel-delete-subtext">
                  This will rebuild the mileage intervals for vehicle <strong>{deletingLog.vehicleNo}</strong>.
                  Any previously computed FleetEdge comparisons will be reset to pending.
                </p>
              </div>
            </div>
            <div className="refuel-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleDeleteClose} disabled={submitting}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default RefuelLogsPage;
