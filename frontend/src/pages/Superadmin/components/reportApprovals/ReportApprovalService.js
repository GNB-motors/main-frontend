import apiClient from '../../../../utils/axiosConfig';
import ApiError from '../../../../errors/ApiError';
import { getStorageItem, setStorageItem } from '../../../../utils/session';

const LOCAL_SAVED_KEY = 'gnb_saved_custom_reports';
const LOCAL_REQUESTS_KEY = 'gnb_custom_field_requests';

const getLocalSavedReports = () => {
  try {
    return JSON.parse(getStorageItem(LOCAL_SAVED_KEY) || '[]');
  } catch {
    return [];
  }
};

const setLocalSavedReports = (list) => {
  try {
    setStorageItem(LOCAL_SAVED_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
};

const getLocalFieldRequests = () => {
  try {
    return JSON.parse(getStorageItem(LOCAL_REQUESTS_KEY) || '[]');
  } catch {
    return [];
  }
};

const setLocalFieldRequests = (list) => {
  try {
    setStorageItem(LOCAL_REQUESTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
};

export const ReportApprovalService = {
  listApprovals: async (params = {}, { signal } = {}) => {
    try {
      const response = await apiClient.get('/api/admin/report-approvals', { params, signal });
      return response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      // Local fallback for offline/development environments
      let list = getLocalSavedReports();
      if (params.status && params.status !== 'ALL') {
        list = list.filter((r) => (r.status || 'PENDING') === params.status);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (r) =>
            r.name?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q) ||
            r.dataset?.toLowerCase().includes(q),
        );
      }
      const page = parseInt(params.page, 10) || 1;
      const limit = parseInt(params.limit, 10) || 20;
      const skip = (page - 1) * limit;
      const paginated = list.slice(skip, skip + limit);

      const allList = getLocalSavedReports();
      const pending = allList.filter((r) => (r.status || 'PENDING') === 'PENDING').length;
      const approved = allList.filter((r) => r.status === 'APPROVED').length;
      const rejected = allList.filter((r) => r.status === 'REJECTED').length;

      return {
        status: 'success',
        data: paginated,
        pagination: {
          total: list.length,
          page,
          limit,
          totalPages: Math.ceil(list.length / limit) || 1,
        },
        counts: {
          all: allList.length,
          pending,
          approved,
          rejected,
        },
      };
    }
  },

  getCounts: async ({ signal } = {}) => {
    try {
      const response = await apiClient.get('/api/admin/report-approvals/counts', { signal });
      return response.data?.data || response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      const allList = getLocalSavedReports();
      const pending = allList.filter((r) => (r.status || 'PENDING') === 'PENDING').length;
      const approved = allList.filter((r) => r.status === 'APPROVED').length;
      const rejected = allList.filter((r) => r.status === 'REJECTED').length;
      return {
        all: allList.length,
        pending,
        approved,
        rejected,
      };
    }
  },

  approve: async (id, data = {}) => {
    try {
      const response = await apiClient.patch(`/api/admin/report-approvals/${id}/approve`, data);
      return response.data?.data || response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      const list = getLocalSavedReports();
      const idx = list.findIndex((r) => (r._id || r.id) === id);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          status: 'APPROVED',
          adminComments: data.adminComments || '',
          approvedAt: new Date().toISOString(),
        };
        setLocalSavedReports(list);
        return list[idx];
      }
      throw ApiError.from(error);
    }
  },

  reject: async (id, data = {}) => {
    try {
      const response = await apiClient.patch(`/api/admin/report-approvals/${id}/reject`, data);
      return response.data?.data || response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      const list = getLocalSavedReports();
      const idx = list.findIndex((r) => (r._id || r.id) === id);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          status: 'REJECTED',
          rejectionReason: data.rejectionReason || 'Rejected by Superadmin',
          adminComments: data.rejectionReason || 'Rejected by Superadmin',
          rejectedAt: new Date().toISOString(),
        };
        setLocalSavedReports(list);
        return list[idx];
      }
      throw ApiError.from(error);
    }
  },

  listFieldRequests: async (params = {}, { signal } = {}) => {
    try {
      const response = await apiClient.get('/api/admin/report-approvals/field-requests', {
        params,
        signal,
      });
      return response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      let list = getLocalFieldRequests();
      if (params.status && params.status !== 'ALL') {
        list = list.filter((r) => (r.status || 'SUBMITTED') === params.status);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (r) =>
            r.fieldName?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q) ||
            r.reason?.toLowerCase().includes(q) ||
            r.module?.toLowerCase().includes(q),
        );
      }
      const page = parseInt(params.page, 10) || 1;
      const limit = parseInt(params.limit, 10) || 20;
      const skip = (page - 1) * limit;
      const paginated = list.slice(skip, skip + limit);

      const allList = getLocalFieldRequests();
      const submitted = allList.filter((r) => (r.status || 'SUBMITTED') === 'SUBMITTED').length;
      const underReview = allList.filter((r) => r.status === 'UNDER_REVIEW').length;
      const approved = allList.filter((r) => r.status === 'APPROVED').length;
      const rejected = allList.filter((r) => r.status === 'REJECTED').length;
      const implemented = allList.filter((r) => r.status === 'IMPLEMENTED').length;

      return {
        status: 'success',
        data: paginated,
        pagination: {
          total: list.length,
          page,
          limit,
          totalPages: Math.ceil(list.length / limit) || 1,
        },
        counts: {
          all: allList.length,
          submitted,
          underReview,
          approved,
          rejected,
          implemented,
        },
      };
    }
  },

  approveFieldRequest: async (id, data = {}) => {
    try {
      const response = await apiClient.patch(
        `/api/admin/report-approvals/field-requests/${id}/approve`,
        data,
      );
      return response.data?.data || response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      const list = getLocalFieldRequests();
      const idx = list.findIndex((r) => (r._id || r.id) === id);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          status: 'APPROVED',
          adminComments: data.adminComments || 'Approved by Superadmin',
          reviewedAt: new Date().toISOString(),
        };
        setLocalFieldRequests(list);
        return list[idx];
      }
      throw ApiError.from(error);
    }
  },

  rejectFieldRequest: async (id, data = {}) => {
    try {
      const response = await apiClient.patch(
        `/api/admin/report-approvals/field-requests/${id}/reject`,
        data,
      );
      return response.data?.data || response.data;
    } catch (error) {
      if (error?.name === 'CanceledError') throw error;
      const list = getLocalFieldRequests();
      const idx = list.findIndex((r) => (r._id || r.id) === id);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          status: 'REJECTED',
          adminComments: data.rejectionReason || data.adminComments || 'Rejected by Superadmin',
          reviewedAt: new Date().toISOString(),
        };
        setLocalFieldRequests(list);
        return list[idx];
      }
      throw ApiError.from(error);
    }
  },
};

