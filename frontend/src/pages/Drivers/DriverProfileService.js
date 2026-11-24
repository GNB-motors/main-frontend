import apiClient from '@/utils/axiosConfig';
import ApiError from '@/errors/ApiError';
import Assignments from '@/services/DriverVehicleAssignmentService';
import IntelligenceService from '../Intelligence/IntelligenceService';
import { referenceId, tripsForDriver } from './driverProfileModel';

const read = async (url, params, signal) => {
  try {
    return (await apiClient.get(url, { params, signal })).data;
  } catch (error) {
    throw ApiError.from(error);
  }
};
const DriverProfileService = {
  // The employee API has no single-employee read; follow scoped pages until found.
  employee: async (id, signal) => {
    for (let page = 1, pages = 1; page <= pages; page++) {
      const res = await read('/api/employees', { page, limit: 1000 }, signal);
      const rows = Array.isArray(res.data) ? res.data : [];
      const employee = rows.find((row) => referenceId(row) === id);
      if (employee) return employee;
      pages = res.meta?.totalPages || 1;
    }
    return null;
  },
  assignments: async (id, signal) => {
    const rows = [];
    for (let page = 1, pages = 1; page <= pages; page++) {
      const res = await Assignments.getAssignmentPage(
        { driverId: id, includePast: true, page, limit: 200 },
        { signal },
      );
      rows.push(...res.results.filter((row) => referenceId(row.driverId) === id));
      pages = res.meta?.totalPages || 1;
    }
    return rows.sort((a, b) => Date.parse(b.startDate) - Date.parse(a.startDate));
  },
  documents: async (id, signal) => {
    const res = await read('/api/documents', { entityType: 'USER', entityId: id }, signal);
    return Array.isArray(res.data) ? res.data : [];
  },
  trips: async (id, { from, to }, signal) => {
    const rows = [];
    for (let page = 1, pages = 1; page <= pages; page++) {
      const res = await read(
        '/api/trips',
        {
          driverId: id,
          startDate: `${from}T00:00:00+05:30`,
          endDate: `${to}T23:59:59.999+05:30`,
          page,
          limit: 1000,
        },
        signal,
      );
      rows.push(...(Array.isArray(res.data) ? res.data : []));
      pages = res.pagination?.totalPages || res.meta?.totalPages || 1;
    }
    // Older trip controllers ignore driverId. Never show another driver's trips.
    return tripsForDriver(rows, id);
  },
  weeklyEvents: async (id, weeks, signal) =>
    Promise.all(
      weeks.map(async (week) => {
        const [idle, speed] = await Promise.allSettled(
          ['idle', 'overspeed'].map((kind) =>
            IntelligenceService.getInstances({
              kind,
              driver: id,
              from: week.from,
              to: week.to,
              page: 1,
              limit: 1,
              signal,
            }),
          ),
        );
        const summary = (result) =>
          result.status === 'fulfilled' && !result.value?.held ? result.value?.summary : null;
        const idleSummary = summary(idle);
        const speedSummary = summary(speed);
        return {
          ...week,
          idleHours: idleSummary?.totalMin != null ? idleSummary.totalMin / 60 : null,
          overspeed: speedSummary?.count ?? null,
          unavailable: !idleSummary || !speedSummary,
        };
      }),
    ),
};
export default DriverProfileService;
