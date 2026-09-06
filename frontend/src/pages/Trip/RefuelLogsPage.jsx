import { toISTDateString, toISTTimeString, formatDateIST } from '../../utils/dateUtils';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlusCircle, Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import '../PageStyles.css';
import './RefuelLogsPage.css';
import '../../components/JourneySetupModal/modal.css';
import apiClient from '../../utils/axiosConfig';
import useApi from '../../hooks/useApi';
import ChevronIcon from './assets/ChevronIcon.jsx';
import DocumentService from './services/DocumentService';
import { VehicleService } from '../Profile/VehicleService.jsx';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import RefuelLogModals from './RefuelLogModals.jsx';
import { REFUEL_EXPORT_COLUMNS, buildExportRow } from './refuelLogExport';
import { getToken, getProfileField } from '../../utils/session.js';

const PAGE_SIZE = 10;

// Maps the UI filter tab to the server-side `fuelType` query param.
// `all` sends no filter so the API returns every fuel type.
const TAB_TO_FUEL_TYPE = {
  all: undefined,
  diesel: 'DIESEL',
  adblue: 'ADBLUE',
};

const fetchRefuelLogs = async (
  { page = 1, limit = PAGE_SIZE, fuelType, search, vehicleId } = {},
  signal,
) => {
  const params = { page, limit };
  if (fuelType) {
    params.fuelType = fuelType;
  }
  if (search) {
    params.search = search;
  }
  if (vehicleId) {
    params.vehicleId = vehicleId;
  }

  const response = await apiClient.get('api/fuel-logs', { params, signal });
  if (response.data.status === 'success') {
    const mapped = response.data.data.map((log) => ({
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
      odometer: log.odometerReading
        ? log.odometerSource === 'FLEETEDGE'
          ? `${log.odometerReading} (FE)`
          : log.odometerReading
        : '-',
      rawOdometerSource: log.odometerSource,
      paymentMethod: '-', // Not available in API
      notes: log.fillingType
        ? log.fillingType === 'FULL_TANK'
          ? 'Full Tank'
          : log.fillingType
        : '-',
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
      rawTotalAmount: log.totalAmount ?? null,
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
  { id: 'adblue', label: 'AdBlue' },
];

const formatDate = (dateStr) => formatDateIST(dateStr);

const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '-';
  }
  return `₹${Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const RefuelLogsPage = ({ fuelType: fixedFuelType, title }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // When `fuelType` is provided (Diesel Report / AdBlue Report inside the Reports
  // page) the view is locked to that fuel type: the All/Diesel/AdBlue tabs are
  // hidden and a report title is shown instead. Standalone routes keep the tabs.
  const isFixedFuelType = fixedFuelType === 'DIESEL' || fixedFuelType === 'ADBLUE';
  const isAdBluePage = fixedFuelType === 'ADBLUE';
  const reportTitle = title || (isAdBluePage ? 'AdBlue Report' : 'Diesel Report');
  const newLogPath = isAdBluePage ? '/adblue-tracking/new' : '/mileage-tracking/new';
  const emptyActionLabel = isAdBluePage ? 'Log AdBlue' : 'Add Refuel Log';
  const tabParam = searchParams.get('tab');
  const activeTab = isFixedFuelType
    ? fixedFuelType.toLowerCase()
    : tabParam && filterTabs.some((item) => item.id === tabParam)
      ? tabParam
      : 'all';
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });
  const [viewImageUrl, setViewImageUrl] = useState(null);
  const [viewImageLoading, setViewImageLoading] = useState(false);

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

  // Fetch vehicles for the filter dropdown if this is a report page
  const { data: vehiclesData } = useApi(
    async () => {
      const token = getToken();
      const orgId = getProfileField('business_ref_id') || null;
      if (!token) return null;
      return VehicleService.getAllVehicles(orgId, token, 1, 1000);
    },
    [],
    { enabled: isFixedFuelType },
  );
  useEffect(() => {
    if (vehiclesData?.data) setVehicles(vehiclesData.data);
  }, [vehiclesData]);

  // Debounce the search box, then snap back to page 1 so results start at the top.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPagination((p) => (p.page === 1 ? p : { ...p, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Refetch whenever the page, fuel-type tab, search term, or vehicle filter changes (all server-side).
  const {
    data: logsData,
    loading,
    error: logsFetchError,
    refetch,
  } = useApi(
    (signal) =>
      fetchRefuelLogs(
        {
          page: pagination.page,
          limit: pagination.limit,
          fuelType: TAB_TO_FUEL_TYPE[activeTab],
          search: debouncedSearch,
          vehicleId: selectedVehicleId || undefined,
        },
        signal,
      ),
    [
      JSON.stringify({
        page: pagination.page,
        activeTab,
        debouncedSearch,
        vehicleId: selectedVehicleId,
      }),
    ],
  );

  useEffect(() => {
    if (logsData) {
      setLogs(logsData.logs);
      setPagination((p) => ({ ...p, total: logsData.total }));
    }
  }, [logsData]);

  useEffect(() => {
    if (loading) setError(null);
  }, [loading]);

  useEffect(() => {
    if (logsFetchError) {
      setError('Failed to load refuel logs');
      console.error('Error loading refuel logs:', logsFetchError);
    }
  }, [logsFetchError]);

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setPagination((p) => ({ ...p, page }));
    }
  };

  // Switching tabs resets to page 1 so we don't land on an out-of-range page.
  const handleTabChange = (tabId) => {
    setSearchParams(tabId === 'all' ? {} : { tab: tabId }, { replace: true });
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const generatePageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (pagination.page > 3) pages.push('...');
      for (
        let i = Math.max(2, pagination.page - 1);
        i <= Math.min(totalPages - 1, pagination.page + 1);
        i++
      ) {
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
      odometerReading:
        editForm.odometerReading !== '' ? Number(editForm.odometerReading) : undefined,
      location: editForm.location || undefined,
      refuelTime: fromDatetimeLocal(editForm.refuelTime) || undefined,
    };

    setSubmitting(true);
    try {
      await updateFuelLog(editingLog.id, payload);
      toast.success('Fuel log updated successfully');
      handleEditClose();
      refetch();
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

  const handleViewDocument = async (log) => {
    if (!log.documentId) return;
    setViewImageLoading(true);
    try {
      const doc = await DocumentService.getDocument(log.documentId);
      const url = doc?.data?.publicUrl || doc?.publicUrl || doc?.data?.fileKey || doc?.fileKey;
      if (url) {
        setViewImageUrl(url);
      } else {
        toast.error('Image URL not found for this document');
      }
    } catch (err) {
      toast.error('Failed to load document');
      console.error(err);
    } finally {
      setViewImageLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLog) return;

    setSubmitting(true);
    try {
      await deleteFuelLog(deletingLog.id);
      toast.success('Fuel log deleted successfully');
      handleDeleteClose();
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete fuel log');
    } finally {
      setSubmitting(false);
    }
  };

  const activeFilterCount =
    (debouncedSearch ? 1 : 0) + (activeTab !== 'all' ? 1 : 0) + (selectedVehicleId ? 1 : 0);

  // Export carries every filtered row (paginated fetch in chunks), not just
  // the visible page — same contract as the hand-rolled export it replaces.
  const fetchAllLogsForExport = async () => {
    const allLogs = [];
    let currentPage = 1;
    let hasMore = true;

    // Backend max limit is 1000, so we fetch in chunks until we get all logs
    while (hasMore) {
      const { logs: chunkLogs, total } = await fetchRefuelLogs({
        page: currentPage,
        limit: 1000,
        fuelType: TAB_TO_FUEL_TYPE[activeTab],
        search: debouncedSearch,
        vehicleId: selectedVehicleId || undefined,
      });

      allLogs.push(...chunkLogs);

      // Stop if we've fetched all items or the server returned an empty page
      if (allLogs.length >= total || chunkLogs.length === 0) {
        hasMore = false;
      } else {
        currentPage++;
      }
    }
    return allLogs.map(buildExportRow);
  };

  const exportFilters = [
    activeTab !== 'all' && {
      label: 'Fuel type',
      value: filterTabs.find((t) => t.id === activeTab)?.label,
    },
    debouncedSearch && { label: 'Search', value: debouncedSearch },
    selectedVehicleId && {
      label: 'Vehicle',
      value:
        vehicles.find((v) => (v._id || v.id) === selectedVehicleId)?.registrationNumber ||
        selectedVehicleId,
    },
  ].filter(Boolean);

  const columns = [
    {
      key: 'dateTime',
      label: 'Date & Time',
      render: (log) => {
        const timestamp = log.date ? `${log.date}${log.time ? `T${log.time}` : ''}` : null;
        const formattedDate = timestamp ? formatDate(timestamp) : formatDate(log.date);
        return (
          <>
            <div className="cell-primary">{formattedDate}</div>
            <div className="cell-secondary">{log.time || '-'}</div>
          </>
        );
      },
    },
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (log) => (
        <>
          <div className="cell-primary">{log.vehicleNo || '-'}</div>
          <div className="cell-secondary">{log.vehicleModel || '--'}</div>
        </>
      ),
    },
    {
      key: 'driver',
      label: 'Driver',
      render: (log) => (
        <>
          <div className="cell-primary">{log.driverName || '-'}</div>
          <div className="cell-secondary">{log.driverPhone || '--'}</div>
        </>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (log) => (
        <>
          <div className="cell-primary">{log.location || '-'}</div>
          <div className="cell-secondary">{log.vendor || '--'}</div>
        </>
      ),
    },
    ...(!isFixedFuelType
      ? [
          {
            key: 'fuelType',
            label: 'Fuel Type',
            render: (log) => (
              <span
                className={`fuel-type-pill ${log.fuelType ? log.fuelType.toLowerCase() : 'unknown'}`}
              >
                {log.fuelType || 'Unknown'}
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'quantity',
      label: 'Quantity (L)',
      render: (log) => (
        <>
          <div className="cell-primary">{log.quantity || '-'}</div>
          <div className="cell-secondary">Litres</div>
        </>
      ),
    },
    {
      key: 'unitPrice',
      label: 'Unit Price',
      render: (log) => formatCurrency(log.unitPrice),
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      render: (log) => formatCurrency(log.totalAmount === '-' ? null : log.totalAmount),
    },
    {
      key: 'odometer',
      label: 'Odometer',
      render: (log) => (
        <>
          <div className="cell-primary">{log.odometer ? `${log.odometer} km` : '-'}</div>
          <div className="cell-secondary">Reading</div>
        </>
      ),
    },
    {
      key: 'notes',
      label: 'Type',
      render: (log) => <div className="cell-primary">{log.notes || '-'}</div>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (log) => (
        <div className="refuel-actions">
          {log.documentId && (
            <button
              type="button"
              className="refuel-action-btn"
              title="View Bill"
              style={{ color: '#2563eb' }}
              onClick={(e) => {
                e.stopPropagation();
                handleViewDocument(log);
              }}
              disabled={viewImageLoading}
            >
              <Eye size={14} />
            </button>
          )}
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
      ),
    },
  ];

  const isFiltered = Boolean(debouncedSearch) || activeTab !== 'all' || Boolean(selectedVehicleId);

  return (
    <PageShell
      title={isFixedFuelType ? reportTitle : 'Refuel Logs'}
      subtitle={
        isFixedFuelType
          ? null
          : 'Diesel and AdBlue fills — quantities, rates, bills and odometer provenance.'
      }
      count={pagination.total}
      actions={
        <ExportButton
          rows={logs.map(buildExportRow)}
          columns={REFUEL_EXPORT_COLUMNS}
          filename={
            isAdBluePage ? 'adblue-report' : isFixedFuelType ? 'diesel-report' : 'refuel-logs'
          }
          fetchAll={fetchAllLogsForExport}
          disabled={!logs.length}
          meta={{ filters: exportFilters }}
        />
      }
      filters={
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search vehicle, driver, or location"
          chips={
            isFixedFuelType ? [] : filterTabs.map((tab) => ({ key: tab.id, label: tab.label }))
          }
          selectedKeys={[activeTab]}
          onToggleChip={handleTabChange}
          activeCount={activeFilterCount}
          onClear={() => {
            setSearchTerm('');
            setSelectedVehicleId('');
            handleTabChange('all');
          }}
          right={
            isFixedFuelType ? (
              <select
                className="refuel-filter-select"
                value={selectedVehicleId}
                onChange={(e) => {
                  setSelectedVehicleId(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                style={{
                  padding: '0.4rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  outline: 'none',
                }}
              >
                <option value="">All Vehicles</option>
                {vehicles.map((v) => (
                  <option key={v._id || v.id} value={v._id || v.id}>
                    {v.registrationNumber || v.registration_no || v._id}
                  </option>
                ))}
              </select>
            ) : null
          }
        />
      }
      footer={
        pagination.total > 0
          ? `Showing ${logs.length} of ${pagination.total} logs${activeFilterCount ? ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''}` : ''}`
          : null
      }
    >
      <DataTable
        columns={columns}
        rows={logs}
        rowKey={(log) => log.id}
        loading={loading}
        error={!loading && error ? error : null}
        onRetry={refetch}
        showing={logs.length}
        total={pagination.total}
        activeFilters={activeFilterCount}
        emptyTitle={isFiltered ? 'No refuel logs match' : 'No refuel logs yet'}
        emptyHint={isFiltered ? 'Try adjusting your search or clearing filters.' : null}
        emptyAction={
          !isFiltered ? (
            <button className="refuel-empty-action-btn" onClick={() => navigate(newLogPath)}>
              <PlusCircle size={18} /> {emptyActionLabel}
            </button>
          ) : null
        }
      />

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

      <RefuelLogModals
        editingLog={editingLog}
        editForm={editForm}
        setEditForm={setEditForm}
        submitting={submitting}
        onEditClose={handleEditClose}
        onEditSubmit={handleEditSubmit}
        deletingLog={deletingLog}
        onDeleteClose={handleDeleteClose}
        onDeleteConfirm={handleDeleteConfirm}
        viewImageUrl={viewImageUrl}
        onViewImageClose={() => setViewImageUrl(null)}
      />
    </PageShell>
  );
};

export default RefuelLogsPage;
