import apiClient from '../../../../utils/axiosConfig';
import { getStorageItem, setStorageItem } from '../../../../utils/session';

const BASE = '/api/admin/reports-approval';
const LOCAL_SAVED_KEY = 'gnb_saved_custom_reports';

export const REPORTS_APPROVAL_CHANGED_EVENT = 'gnb:reports-approval-changed';

export const SEED_SUBMISSIONS = [
  {
    _id: 'seed-rep-1',
    id: 'seed-rep-1',
    name: 'Quarterly High Fuel Consumption Analysis',
    description: 'Detailed analysis of vehicles with high fuel consumption across national routes.',
    category: 'FUEL',
    dataset: 'fuel_transactions',
    fields: ['fuelDate', 'vehicleNo', 'fuelQuantity', 'fuelAmount', 'fuelMileage'],
    filters: { fuelType: 'DIESEL' },
    status: 'PENDING',
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    orgId: { companyName: 'North Logistics Corp' },
    createdBy: { firstName: 'Rajesh', lastName: 'Kumar', email: 'rajesh@northlogistics.in' },
  },
  {
    _id: 'seed-rep-2',
    id: 'seed-rep-2',
    name: 'Fleet DEF & AdBlue Compliance Audit',
    description: 'AdBlue telematics compliance tracking across BS6 heavy commercial vehicles.',
    category: 'ADBLUE',
    dataset: 'adblue_telemetry',
    fields: ['vehicleNo', 'defLevel', 'defMileage', 'telemetryTimestamp'],
    filters: {},
    status: 'APPROVED',
    adminComments: 'Approved for Q4 enterprise compliance tracking.',
    reviewedAt: new Date(Date.now() - 86400000).toISOString(),
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    orgId: { companyName: 'TransExpress Logistics' },
    createdBy: { firstName: 'Amit', lastName: 'Sharma', email: 'amit@transexpress.in' },
  },
  {
    _id: 'seed-rep-3',
    id: 'seed-rep-3',
    name: 'Interstate Toll & Fastag Anomaly Report',
    description: 'Monthly reconciliation of toll charges against GPS routes.',
    category: 'TRIP',
    dataset: 'trips_mileage',
    fields: ['vehicleNo', 'tripStart', 'tripEnd', 'distanceKm'],
    filters: {},
    status: 'REJECTED',
    rejectionReason: 'Please refine the date range filter to a single calendar month before resubmitting.',
    adminComments: 'Please refine the date range filter to a single calendar month before resubmitting.',
    reviewedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    orgId: { companyName: 'Apex Haulage Ltd' },
    createdBy: { firstName: 'Sunil', lastName: 'Verma', email: 'sunil@apexhaulage.in' },
  },
];

const getLocalReports = () => {
  try {
    const raw = getStorageItem(LOCAL_SAVED_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) return list;
    }
  } catch {
    // ignore
  }
  return [...SEED_SUBMISSIONS];
};

const setLocalReports = (list) => {
  try {
    setStorageItem(LOCAL_SAVED_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
};

/** List submitted reports across all organizations { items, pagination } */
const list = async (params = {}, { signal } = {}) => {
  try {
    const response = await apiClient.get(BASE, { params, signal });
    if (response.data?.data) return response.data.data;
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error;
  }

  // Fallback to local storage (e.g. when frontend points to remote API not yet deployed)
  try {
    let items = getLocalReports();

    if (params.status && params.status !== 'ALL') {
      items = items.filter((r) => (r.status || 'PENDING') === params.status);
    }
    if (params.category && params.category !== 'ALL') {
      items = items.filter((r) => r.category === params.category);
    }
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      items = items.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.orgId?.companyName?.toLowerCase().includes(q) ||
          r.createdBy?.firstName?.toLowerCase().includes(q) ||
          r.createdBy?.email?.toLowerCase().includes(q),
      );
    }

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 15;
    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const paginated = items.slice(start, start + limit);

    return {
      items: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch {
    return {
      items: [],
      pagination: { total: 0, page: 1, limit: 15, totalPages: 1 },
    };
  }
};

/** KPI summary { total, pending, approved, rejected } */
const summary = async ({ signal } = {}) => {
  try {
    const response = await apiClient.get(`${BASE}/summary`, { signal });
    if (response.data?.data) return response.data.data;
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error;
  }

  // Fallback calculation from local storage
  try {
    const all = getLocalReports();
    const pending = all.filter((r) => (r.status || 'PENDING') === 'PENDING').length;
    const approved = all.filter((r) => r.status === 'APPROVED').length;
    const rejected = all.filter((r) => r.status === 'REJECTED').length;
    return {
      total: all.length,
      pending,
      approved,
      rejected,
    };
  } catch {
    return { total: 0, pending: 0, approved: 0, rejected: 0 };
  }
};

/** Count of pending reports for sidebar pill */
const unreadCount = async ({ signal } = {}) => {
  try {
    const response = await apiClient.get(`${BASE}/unread-count`, { signal });
    if (typeof response.data?.data?.count === 'number') return response.data.data.count;
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error;
  }
  try {
    const all = getLocalReports();
    return all.filter((r) => (r.status || 'PENDING') === 'PENDING').length;
  } catch {
    return 0;
  }
};

/** Single report details */
const get = async (id, { signal } = {}) => {
  try {
    const response = await apiClient.get(`${BASE}/${id}`, { signal });
    if (response.data?.data) return response.data.data;
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error;
  }
  try {
    const all = getLocalReports();
    return all.find((r) => (r._id || r.id) === id) || null;
  } catch {
    return null;
  }
};

/** Super Admin review decision (status: 'APPROVED' | 'REJECTED', comments) */
const review = async ({ id, status, comments, rejectionReason }) => {
  try {
    const response = await apiClient.patch(`${BASE}/${id}/review`, {
      status,
      comments,
      rejectionReason,
    });
    window.dispatchEvent(new Event(REPORTS_APPROVAL_CHANGED_EVENT));
    if (response.data?.data) return response.data.data;
  } catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error;
  }

  // Update in local storage
  const all = getLocalReports();
  const idx = all.findIndex((r) => (r._id || r.id) === id);
  if (idx !== -1) {
    if (all[idx].status && all[idx].status !== 'PENDING') {
      throw new Error(
        `Report has already been ${all[idx].status.toLowerCase()} and cannot be changed later.`,
      );
    }
    all[idx] = {
      ...all[idx],
      status,
      adminComments: comments || all[idx].adminComments || '',
      rejectionReason: status === 'REJECTED' ? rejectionReason || comments : '',
      reviewedAt: new Date().toISOString(),
    };
    setLocalReports(all);
    window.dispatchEvent(new Event(REPORTS_APPROVAL_CHANGED_EVENT));
    return all[idx];
  }
  window.dispatchEvent(new Event(REPORTS_APPROVAL_CHANGED_EVENT));
  return { id, status, adminComments: comments, rejectionReason };
};

export const ReportsApprovalAdminService = {
  list,
  summary,
  unreadCount,
  get,
  review,
};
