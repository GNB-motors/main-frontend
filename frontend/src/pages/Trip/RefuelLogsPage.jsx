import { toISTDateString, toISTTimeString, formatDateIST } from '../../utils/dateUtils';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  Fuel,
  IndianRupee,
  Gauge,
  FileWarning,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  FileText,
  Check,
} from 'lucide-react';
import { toast } from 'react-toastify';
import '../PageStyles.css';
import './RefuelLogsPage.css';
import '../../components/JourneySetupModal/modal.css';
import apiClient from '../../utils/axiosConfig';
import useApi from '../../hooks/useApi';
import DocumentService from './services/DocumentService';
import { VehicleService } from '../Profile/VehicleService.jsx';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import RefuelLogModals from './RefuelLogModals.jsx';
import KpiCard from '../../components/ui/KpiCard';
import ReportDataNotice from '../../components/ui/ReportDataNotice';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '../../components/ui/pagination';
import { toStartOfDayIso, toEndOfDayIso } from '../Reports/reports/mileageIntervalReportUtils';
import { formatINR, formatLitres, formatNum } from '../../utils/formatters';
import { REFUEL_EXPORT_COLUMNS, buildExportRow } from './refuelLogExport';
import { getToken, getProfileField } from '../../utils/session.js';
import RefuelComparisonDrawer from './RefuelComparisonDrawer';

const PAGE_SIZE = 10;

// Maps the UI filter tab to the server-side `fuelType` query param.
// `all` sends no filter so the API returns every fuel type.
const TAB_TO_FUEL_TYPE = {
  all: undefined,
  diesel: 'DIESEL',
  adblue: 'ADBLUE',
};

const fetchRefuelLogs = async (
  {
    page = 1,
    limit = PAGE_SIZE,
    fuelType,
    search,
    vehicleId,
    startDate,
    endDate,
    sortBy,
    withTotals,
  } = {},
  signal,
) => {
  const params = { page, limit };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (sortBy) params.sortBy = sortBy;
  if (withTotals) params.withTotals = true;
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
      slipId: log._id,
      slip: {
        id: log._id,
        litres: log.litres,
        totalAmount: log.totalAmount,
        rate: log.rate,
        location: log.location,
        documentId: log.documentId,
        odometerDocId: log.odometerDocId,
        submissionChannel: log.submissionChannel,
        fuelType: log.fuelType,
        fillingType: log.fillingType,
        odometerReading: log.odometerReading,
      },
      sensor: null,
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
      reviewStatus: log.reviewStatus || null,
      submissionChannel: log.submissionChannel || null,
    }));
    const total = response.data.meta?.total ?? mapped.length;
    return { logs: mapped, total, totals: response.data.meta?.totals || null };
  }
  return { logs: [], total: 0, totals: null };
};

const fetchUnifiedLogs = async (
  { page = 1, limit = PAGE_SIZE, status, search, vehicleId, startDate, endDate } = {},
  signal,
) => {
  const params = { page, limit };
  if (startDate) params.from = startDate;
  if (endDate) params.to = endDate;
  if (status && status !== 'all') params.status = status;
  if (search) params.search = search;
  if (vehicleId) params.vehicle = vehicleId;

  const response = await apiClient.get('api/fuel-logs/unified', { params, signal });
  if (response.data.status === 'success') {
    const { data, meta } = response.data;
    const mapped = data.map((row) => {
      const slip = row.slip || {};
      const sensor = row.sensor || {};
      const effectiveLitres = slip.litres != null ? slip.litres : row.litres;
      return {
        id: row.id,
        slipId:
          slip.id ||
          (row.id && String(row.id).startsWith('log_') ? String(row.id).replace('log_', '') : null),
        source: row.source,
        verificationStatus: row.verificationStatus,
        slip: row.slip || null,
        sensor: row.sensor || null,
        date: row.at ? toISTDateString(row.at) : null,
        time: row.at ? toISTTimeString(row.at) : null,
        vehicleNo: row.vehicleNumber || '-',
        vehicleModel: row.vehicleModel || '-',
        vehicleId: row.vehicleId,
        driverName: slip.driverName || '-',
        driverPhone: '-',
        location: slip.location || (sensor.fuelPumpName ? sensor.fuelPumpName : '-'),
        vendor: '-',
        fuelType: slip.fuelType ? slip.fuelType.toLowerCase() : 'diesel',
        quantity: row.litres != null ? row.litres : '-',
        unitPrice: slip.rate || null,
        totalAmount: slip.totalAmount || '-',
        odometer: slip.odometerReading
          ? slip.odometerSource === 'FLEETEDGE'
            ? `${slip.odometerReading} (FE)`
            : slip.odometerReading
          : '-',
        rawOdometerSource: slip.odometerSource || null,
        paymentMethod: '-',
        notes: slip.fillingType
          ? slip.fillingType === 'FULL_TANK'
            ? 'Full Tank'
            : slip.fillingType
          : '-',
        documentId: slip.documentId || null,
        odometerDocId: slip.odometerDocId || null,
        loggedBy: slip.loggedBy || null,
        createdAt: slip.createdAt || null,
        refuelTime: slip.refuelTime || row.at,
        rawFuelType: slip.fuelType || (row.verificationStatus === 'UNVERIFIED' ? 'DIESEL' : null),
        rawFillingType: slip.fillingType || null,
        rawLitres: effectiveLitres,
        rawRate: slip.rate || null,
        rawTotalAmount: slip.totalAmount ?? null,
        rawOdometer: slip.odometerReading || null,
        rawLocation: slip.location || null,
        reviewStatus: slip.reviewStatus || null,
        submissionChannel: slip.submissionChannel || null,
        sensorId: sensor.id || null,
        sensorLitres: sensor.litres || null,
        sensorBillVarianceL: sensor.billVarianceL || null,
        sensorBillFlag: sensor.billFlag || false,
        sensorConfirmationStatus: sensor.confirmationStatus || null,
      };
    });
    return { logs: mapped, total: meta.total, totals: meta };
  }
  return { logs: [], total: 0, totals: null };
};

const CHANNEL_LABEL = { APP: 'App', WHATSAPP: 'WhatsApp', FIELD_AGENT: 'Field agent' };

const updateFuelLog = async (id, data) => {
  const cleanId = String(id).replace(/^log_/, '');
  const response = await apiClient.put(`api/mileage/fuel-log/${cleanId}`, data);
  return response.data;
};

const deleteFuelLog = async (id) => {
  const cleanId = String(id).replace(/^log_/, '');
  const response = await apiClient.delete(`api/mileage/fuel-log/${cleanId}`);
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
  { id: 'all', label: 'All Refuels', countKey: 'total' },
  { id: 'verified', label: 'Verified', countKey: 'verified' },
  { id: 'unverified', label: 'Unverified', countKey: 'unverified' },
  { id: 'slip_only', label: 'Slip Only', countKey: 'slipOnly' },
  { id: 'flagged', label: 'Flagged', countKey: 'flagged' },
];

const DATE_PRESETS = [
  { key: 'ALL', label: 'All Dates' },
  { key: 'TODAY', label: 'Today' },
  { key: 'YESTERDAY', label: 'Yesterday' },
  { key: '7DAYS', label: 'Last 7 Days' },
  { key: 'THIS_MONTH', label: 'This Month' },
  { key: '30DAYS', label: 'Last 30 Days' },
];

const getPresetRange = (presetKey) => {
  const now = dayjs();
  switch (presetKey) {
    case 'ALL':
      return { from: '', to: '' };
    case 'TODAY':
      return {
        from: now.format('YYYY-MM-DD'),
        to: now.format('YYYY-MM-DD'),
      };
    case 'YESTERDAY': {
      const y = now.subtract(1, 'day');
      return {
        from: y.format('YYYY-MM-DD'),
        to: y.format('YYYY-MM-DD'),
      };
    }
    case '7DAYS':
      return {
        from: now.subtract(6, 'day').format('YYYY-MM-DD'),
        to: now.format('YYYY-MM-DD'),
      };
    case 'THIS_MONTH':
      return {
        from: now.startOf('month').format('YYYY-MM-DD'),
        to: now.format('YYYY-MM-DD'),
      };
    case '30DAYS':
      return {
        from: now.subtract(29, 'day').format('YYYY-MM-DD'),
        to: now.format('YYYY-MM-DD'),
      };
    default:
      return null;
  }
};

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
  const [totals, setTotals] = useState(null);
  const [range, setRange] = useState({ from: '', to: '' });
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

  // Comparison drawer state
  const [comparisonLog, setComparisonLog] = useState(null);

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

  // Fetch vehicles for the filter dropdown
  const { data: vehiclesData } = useApi(async () => {
    const token = getToken();
    const orgId = getProfileField('business_ref_id') || null;
    if (!token) return null;
    return VehicleService.getAllVehicles(orgId, token, 1, 1000);
  }, []);
  useEffect(() => {
    if (vehiclesData?.data) setVehicles(vehiclesData.data);
  }, [vehiclesData]);

  // Active date preset & handler
  const activeDatePreset = useMemo(() => {
    if (!range.from && !range.to) return 'ALL';
    for (const preset of ['TODAY', 'YESTERDAY', '7DAYS', 'THIS_MONTH', '30DAYS']) {
      const p = getPresetRange(preset);
      if (p && p.from === range.from && p.to === range.to) return preset;
    }
    return 'CUSTOM';
  }, [range]);

  const handlePresetClick = (presetKey) => {
    const next = getPresetRange(presetKey);
    if (next) {
      setRange(next);
      setPagination((p) => ({ ...p, page: 1 }));
    }
  };

  // Debounce the search box, then snap back to page 1 so results start at the top.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPagination((p) => (p.page === 1 ? p : { ...p, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Date range filter params for refuel time.
  const dateParams = useMemo(() => {
    const startDate = toStartOfDayIso(range.from);
    const endDate = toEndOfDayIso(range.to);
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (isFixedFuelType) params.sortBy = 'refuelTime';
    return params;
  }, [isFixedFuelType, range]);

  // Refetch whenever the page, status/fuel tab, search term, vehicle, or date filter changes.
  const {
    data: logsData,
    loading,
    error: logsFetchError,
    refetch,
  } = useApi(
    (signal) =>
      isFixedFuelType
        ? fetchRefuelLogs(
            {
              page: pagination.page,
              limit: pagination.limit,
              fuelType: TAB_TO_FUEL_TYPE[activeTab],
              search: debouncedSearch,
              vehicleId: selectedVehicleId || undefined,
              ...dateParams,
              withTotals: isFixedFuelType,
            },
            signal,
          )
        : fetchUnifiedLogs(
            {
              page: pagination.page,
              limit: pagination.limit,
              status: activeTab,
              search: debouncedSearch,
              vehicleId: selectedVehicleId || undefined,
              ...dateParams,
            },
            signal,
          ),
    [
      JSON.stringify({
        page: pagination.page,
        activeTab,
        debouncedSearch,
        vehicleId: selectedVehicleId,
        dateParams,
      }),
    ],
  );

  useEffect(() => {
    if (logsData) {
      setLogs(logsData.logs);
      setTotals(logsData.totals);
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
    (debouncedSearch ? 1 : 0) +
    (activeTab !== 'all' ? 1 : 0) +
    (selectedVehicleId ? 1 : 0) +
    (range.from ? 1 : 0) +
    (range.to ? 1 : 0);

  // Export carries every filtered row (paginated fetch in chunks), not just
  // the visible page — same contract as the hand-rolled export it replaces.
  const fetchAllLogsForExport = async () => {
    const allLogs = [];
    let currentPage = 1;
    let hasMore = true;

    // Fetch all logs in chunks
    while (hasMore) {
      const { logs: chunkLogs, total } = isFixedFuelType
        ? await fetchRefuelLogs({
            page: currentPage,
            limit: 1000,
            fuelType: TAB_TO_FUEL_TYPE[activeTab],
            search: debouncedSearch,
            vehicleId: selectedVehicleId || undefined,
            ...dateParams,
          })
        : await fetchUnifiedLogs({
            page: currentPage,
            limit: 200,
            status: activeTab,
            search: debouncedSearch,
            vehicleId: selectedVehicleId || undefined,
            ...dateParams,
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
      label: isFixedFuelType ? 'Fuel type' : 'Status',
      value: filterTabs.find((t) => t.id === activeTab)?.label,
    },
    debouncedSearch && { label: 'Search', value: debouncedSearch },
    (range.from || range.to) && {
      label: 'Refuelled',
      value: `${range.from || '…'} → ${range.to || '…'}`,
    },
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
    ...(!isFixedFuelType
      ? [
          {
            key: 'verificationStatus',
            label: 'Status',
            render: (log) => {
              const statusClass = log.verificationStatus
                ? log.verificationStatus.toLowerCase()
                : 'unknown';
              let label = log.verificationStatus;
              let icon = null;
              if (log.verificationStatus === 'VERIFIED') {
                label = 'Verified';
                icon = <Check size={12} />;
              } else if (log.verificationStatus === 'UNVERIFIED') {
                label = 'Unverified';
                icon = <AlertCircle size={12} />;
              } else if (log.verificationStatus === 'FLAGGED') {
                label = 'Flagged';
                icon = <AlertTriangle size={12} />;
              } else if (log.verificationStatus === 'SLIP_ONLY') {
                label = 'Slip Only';
                icon = <FileText size={12} />;
              }
              return (
                <span className={`refuel-status-badge ${statusClass}`}>
                  {icon}
                  <span>{label}</span>
                </span>
              );
            },
          },
        ]
      : []),
    {
      key: 'quantity',
      label: 'Quantity (L)',
      render: (log) => (
        <>
          <div className="cell-primary font-mono">
            {log.quantity != null && log.quantity !== '-' ? `${log.quantity} L` : '-'}
          </div>
          <div className="cell-secondary">
            {log.verificationStatus === 'UNVERIFIED' ? 'Sensor Jump' : 'Billed Volume'}
          </div>
        </>
      ),
    },
    {
      key: 'unitPrice',
      label: 'Rate / L',
      render: (log) => {
        if (log.verificationStatus === 'UNVERIFIED') {
          return (
            <span style={{ color: 'var(--cluster-text-dim, #94a3b8)', fontSize: 12 }}>
              Pending Bill
            </span>
          );
        }
        return formatCurrency(log.unitPrice);
      },
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      render: (log) => {
        if (log.verificationStatus === 'UNVERIFIED') {
          return (
            <span style={{ color: 'var(--cluster-text-dim, #94a3b8)', fontSize: 12 }}>
              Pending Bill
            </span>
          );
        }
        return formatCurrency(log.totalAmount === '-' ? null : log.totalAmount);
      },
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
    ...(isFixedFuelType
      ? [
          {
            key: 'status',
            label: 'Status',
            render: (log) => (
              <>
                <div className="cell-primary">
                  {log.reviewStatus === 'NEEDS_REVIEW' ? (
                    <span style={{ color: '#b45309', fontWeight: 600 }}>Needs review</span>
                  ) : log.reviewStatus === 'AUTO_OK' ? (
                    'Accepted'
                  ) : (
                    '—'
                  )}
                </div>
                <div className="cell-secondary">{CHANNEL_LABEL[log.submissionChannel] || '—'}</div>
              </>
            ),
          },
        ]
      : []),
    {
      key: 'actions',
      label: isFixedFuelType ? 'Bill' : 'Actions',
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
          {!isFixedFuelType && (
            <>
              {log.verificationStatus === 'UNVERIFIED' ? (
                <button
                  type="button"
                  className="refuel-action-btn primary-action"
                  title="Upload Bill"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(
                      `/mileage-tracking/new?vehicleId=${log.vehicleId || ''}&refuelTime=${log.refuelTime || ''}&litres=${log.sensorLitres || ''}`,
                    );
                  }}
                >
                  <PlusCircle size={14} /> Upload Bill
                </button>
              ) : (
                <button
                  type="button"
                  className="refuel-action-btn edit"
                  title="Edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(log);
                  }}
                >
                  <Pencil size={14} />
                </button>
              )}
              {log.verificationStatus !== 'UNVERIFIED' && (
                <button
                  type="button"
                  className="refuel-action-btn delete"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(log);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
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
        <div className="refuel-filters-chassis">
          <div className="refuel-presets-bar">
            <span className="refuel-presets-label">Quick Range:</span>
            <div className="refuel-presets-list">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={`refuel-preset-chip ${activeDatePreset === p.key ? 'active' : ''}`}
                  onClick={() => handlePresetClick(p.key)}
                >
                  {p.label}
                </button>
              ))}
              {activeDatePreset === 'CUSTOM' && (
                <span className="refuel-preset-chip active custom">Custom Range</span>
              )}
            </div>
          </div>
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search vehicle, driver, or location"
            chips={
              isFixedFuelType
                ? []
                : filterTabs.map((tab) => ({
                    key: tab.id,
                    label: tab.label,
                    count: totals ? totals[tab.countKey] : undefined,
                  }))
            }
            selectedKeys={[activeTab]}
            onToggleChip={handleTabChange}
            from={range.from}
            to={range.to}
            onRangeChange={(patch) => {
              setRange((prev) => ({ ...prev, ...patch }));
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            activeCount={activeFilterCount}
            onClear={() => {
              setSearchTerm('');
              setSelectedVehicleId('');
              setRange({ from: '', to: '' });
              handleTabChange('all');
            }}
            right={
              <select
                className="refuel-filter-select"
                value={selectedVehicleId}
                onChange={(e) => {
                  setSelectedVehicleId(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                aria-label="Filter by vehicle"
              >
                <option value="">All Vehicles</option>
                {vehicles.map((v) => (
                  <option key={v._id || v.id} value={v._id || v.id}>
                    {v.registrationNumber || v.registration_no || v._id}
                  </option>
                ))}
              </select>
            }
          />
        </div>
      }
      footer={
        pagination.total > 0
          ? `Showing ${logs.length} of ${pagination.total} logs${activeFilterCount ? ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''}` : ''}`
          : null
      }
    >
      {isFixedFuelType && totals ? (
        <div style={{ display: 'grid', gap: 12, marginBottom: 12 }}>
          <ReportDataNotice
            dataAsOf={totals?.lastRefuelAt}
            label="Latest refuel in this view"
            emptyText="No fuel bills match these filters."
            staleHint="Fills after this date have not been logged as bills."
          />
          {totals ? (
            <div className="flex flex-wrap gap-3">
              <KpiCard
                title="Litres"
                value={formatLitres(totals.litres, { decimals: 0 })}
                accent="#0d9488"
                icon={<Fuel size={18} />}
              />
              <KpiCard
                title="Amount"
                value={formatINR(totals.amount)}
                accent="#2563eb"
                icon={<IndianRupee size={18} />}
              />
              <KpiCard
                title="Average rate"
                value={
                  totals.avgRate != null ? `${formatINR(totals.avgRate, { decimals: 2 })}/L` : '—'
                }
                accent="#7c3aed"
                icon={<Gauge size={18} />}
              />
              <KpiCard
                title="Needs review"
                value={formatNum(totals.needsReviewCount)}
                accent="#b45309"
                icon={<FileWarning size={18} />}
              />
            </div>
          ) : null}
        </div>
      ) : !isFixedFuelType && totals ? (
        <div className="refuel-kpi-grid">
          <div
            className={`refuel-kpi-card ${activeTab === 'verified' ? 'selected' : ''}`}
            onClick={() => handleTabChange(activeTab === 'verified' ? 'all' : 'verified')}
            title="Filter by Verified"
          >
            <div
              className="refuel-kpi-icon"
              style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}
            >
              <CheckCircle size={18} />
            </div>
            <div className="refuel-kpi-content">
              <span className="refuel-kpi-title">Verified</span>
              <span className="refuel-kpi-value">{formatNum(totals.verified)}</span>
              <span className="refuel-kpi-hint">Matched with sensor</span>
            </div>
          </div>

          <div
            className={`refuel-kpi-card ${activeTab === 'unverified' ? 'selected' : ''}`}
            onClick={() => handleTabChange(activeTab === 'unverified' ? 'all' : 'unverified')}
            title="Filter by Unverified (Needs Slip)"
          >
            <div
              className="refuel-kpi-icon"
              style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}
            >
              <AlertCircle size={18} />
            </div>
            <div className="refuel-kpi-content">
              <span className="refuel-kpi-title">Unverified</span>
              <span className="refuel-kpi-value" style={{ color: '#b45309' }}>
                {formatNum(totals.unverified)}
              </span>
              <span className="refuel-kpi-hint">Needs driver slip</span>
            </div>
          </div>

          <div
            className={`refuel-kpi-card ${activeTab === 'flagged' ? 'selected' : ''}`}
            onClick={() => handleTabChange(activeTab === 'flagged' ? 'all' : 'flagged')}
            title="Filter by High Variance"
          >
            <div
              className="refuel-kpi-icon"
              style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626' }}
            >
              <AlertTriangle size={18} />
            </div>
            <div className="refuel-kpi-content">
              <span className="refuel-kpi-title">Flagged</span>
              <span className="refuel-kpi-value" style={{ color: '#dc2626' }}>
                {formatNum(totals.flagged)}
              </span>
              <span className="refuel-kpi-hint">Variance flagged</span>
            </div>
          </div>

          <div
            className={`refuel-kpi-card ${activeTab === 'slip_only' ? 'selected' : ''}`}
            onClick={() => handleTabChange(activeTab === 'slip_only' ? 'all' : 'slip_only')}
            title="Filter by Slip Only"
          >
            <div
              className="refuel-kpi-icon"
              style={{ background: 'rgba(100, 116, 139, 0.12)', color: '#475569' }}
            >
              <FileText size={18} />
            </div>
            <div className="refuel-kpi-content">
              <span className="refuel-kpi-title">Slip Only</span>
              <span className="refuel-kpi-value">{formatNum(totals.slipOnly)}</span>
              <span className="refuel-kpi-hint">No sensor jump</span>
            </div>
          </div>

          <div className="refuel-kpi-card stat-only">
            <div
              className="refuel-kpi-icon"
              style={{ background: 'rgba(13, 148, 136, 0.12)', color: '#0d9488' }}
            >
              <Fuel size={18} />
            </div>
            <div className="refuel-kpi-content">
              <span className="refuel-kpi-title">Total Litres</span>
              <span className="refuel-kpi-value mono">
                {formatLitres(totals.totalLitres, { decimals: 0 })}
              </span>
              <span className="refuel-kpi-hint">Fuel volume</span>
            </div>
          </div>

          <div className="refuel-kpi-card stat-only">
            <div
              className="refuel-kpi-icon"
              style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}
            >
              <IndianRupee size={18} />
            </div>
            <div className="refuel-kpi-content">
              <span className="refuel-kpi-title">Verified Spend</span>
              <span className="refuel-kpi-value mono">{formatINR(totals.totalSpendInr)}</span>
              <span className="refuel-kpi-hint">From verified slips</span>
            </div>
          </div>
        </div>
      ) : null}
      <DataTable
        columns={columns}
        rows={logs}
        rowKey={(log) => log.id}
        rowClassName={(log) => {
          if (log.verificationStatus === 'UNVERIFIED') return 'refuel-row-unverified';
          if (log.verificationStatus === 'FLAGGED') return 'refuel-row-flagged';
          return '';
        }}
        loading={loading}
        error={!loading && error ? error : null}
        onRetry={refetch}
        showing={logs.length}
        total={pagination.total}
        activeFilters={activeFilterCount}
        onRowClick={(log) => {
          if (!isFixedFuelType) setComparisonLog(log);
        }}
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

      {/* Modern Pagination Footer */}
      {!loading && !error && pagination.total > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Pagination className="justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                />
              </PaginationItem>
              {generatePageNumbers().map((p, index) =>
                p === '...' ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={`page-${p}`}>
                    <PaginationLink
                      isActive={pagination.page === p}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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

      <RefuelComparisonDrawer
        open={!!comparisonLog}
        onClose={() => setComparisonLog(null)}
        log={comparisonLog}
        onViewPhoto={handleViewDocument}
      />
    </PageShell>
  );
};

export default RefuelLogsPage;
