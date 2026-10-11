import apiClient from '../../utils/axiosConfig';
import { getBranchId } from '../../utils/session.js';
import { parseSafe } from '../../schemas/validate.js';
import ApiError from '../../errors/ApiError';
import { invalidateVehicleList } from '../../services/vehicleListService';

/**
 * Shape the form's expected-mileage input for the API. Returns undefined for an
 * empty/absent value so the key is dropped from the payload entirely — the API
 * rejects `expectedMileage` when the org lacks the Mileage Integrity feature.
 */
const toExpectedMileage = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const kmPerL = Number(value);
  if (!Number.isFinite(kmPerL) || kmPerL <= 0) return undefined;
  return { kmPerL, source: 'MANUAL' };
};

/**
 * Decide which location a vehicle create should carry.
 *  - explicit non-empty branchId (form picked a location) → that id
 *  - explicit empty branchId (form picked "Enterprise")   → null (overrides header)
 *  - no branchId key at all (other callers)               → active location, or null
 */
const resolveVehicleBranchId = (vehicleData) => {
  if (vehicleData.branchId) return vehicleData.branchId;
  if (Object.prototype.hasOwnProperty.call(vehicleData, 'branchId')) return null;
  return getBranchId() || null;
};

const getAllVehicles = async (businessRefId, page = 1, limit = 10, { signal } = {}) => {
  try {
    const response = await apiClient.get('/api/vehicles', {
      params: { page, limit, orgId: businessRefId || undefined },
      signal,
    });

    // Return both data and meta for pagination
    if (response.data && response.data.status === 'success') {
      return {
        data: await parseSafe(
          'vehicleListSchema',
          () => import('../../schemas/vehicle.schema.js'),
          Array.isArray(response.data.data) ? response.data.data : [],
        ),
        meta: response.data.meta || { total: 0, page: 1, limit: 10, totalPages: 1 },
      };
    }

    return { data: response.data, meta: { total: 0, page: 1, limit: 10, totalPages: 1 } };
  } catch (error) {
    throw ApiError.from(error);
  }
};

// Placeholder for Add Vehicle API call
const addVehicle = async (businessRefId, vehicleData) => {
  try {
    // Map UI keys (snake_case) to API expected camelCase keys
    const body = {
      registrationNumber: vehicleData.registration_no || vehicleData.registrationNumber,
      chassisNumber: vehicleData.chassis_number || vehicleData.chassisNumber || null,
      model: vehicleData.model || null,
      // Ensure inventory is always an array (backend validation requires an array)
      inventory: vehicleData.inventory || [],
      // include orgId in body for servers that expect org context in payload
      orgId: businessRefId || undefined,
      // Owning location. The form's explicit choice wins: a real id, or null for
      // "Enterprise (no location)" — which must override the active-location header.
      // If a caller doesn't specify branchId at all, use the active location.
      branchId: resolveVehicleBranchId(vehicleData),
      // Include manufacturer and vehicleCategory if provided (for manual override)
      manufacturer: vehicleData.manufacturer || undefined,
      vehicleCategory: vehicleData.vehicleCategory || undefined,
      // Omitted entirely unless the org has Mileage Integrity on — the API
      // rejects this key when the feature is off.
      expectedMileage: toExpectedMileage(vehicleData.expected_mileage),
    };

    const response = await apiClient.post('/api/vehicles', body);
    invalidateVehicleList();

    // Prefer new response shape
    if (response.data && response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }

    return response.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

// Bulk create vehicles
const addBulkVehicles = async (businessRefId, vehiclesArray, options = {}) => {
  try {
    // Map each row to API expected shape
    const vehicles = vehiclesArray.map((r) => ({
      registrationNumber: r.registration_no || r.registrationNumber,
      chassisNumber: r.chassis_number || r.chassisNumber || null,
      model: r.model || null,
      // default inventory to empty array when missing/null
      inventory: r.inventory || [],
      // Include manufacturer and vehicleCategory if provided
      manufacturer: r.manufacturer || undefined,
      vehicleCategory: r.vehicleCategory || undefined,
    }));

    const payload = {
      vehicles,
      // pass along options like dry_run/upsert if backend supports
      ...(options.dry_run !== undefined ? { dry_run: !!options.dry_run } : {}),
      ...(options.upsert !== undefined ? { upsert: !!options.upsert } : {}),
      orgId: businessRefId || undefined,
      // Location applied to the whole batch: explicit option, else the active
      // location, else the org default (resolved server-side).
      branchId: options.branchId || getBranchId() || undefined,
    };

    // Same budget as the employee bulk create: at least 2 minutes, ~200ms per row.
    const response = await apiClient.post('/api/vehicles/bulk', payload, {
      timeout: Math.max(120000, vehicles.length * 200),
    });
    invalidateVehicleList();

    if (response.data && response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }

    return response.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

// Import (move) an existing enterprise vehicle into the active location; the
// target branch travels in the X-Branch-Id header the interceptor adds.
const importVehicle = async (vehicleId) => {
  try {
    const response = await apiClient.post(`/api/vehicles/${vehicleId}/import`);
    invalidateVehicleList();
    return response.data?.data ?? response.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

const removeVehicle = async (vehicleId) => {
  try {
    const response = await apiClient.delete(`/api/vehicles/${vehicleId}`);
    invalidateVehicleList();
    return response.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

// Placeholder for Edit Vehicle API call
const updateVehicle = async (businessRefId, vehicleId, vehicleData) => {
  try {
    // Build body mapping only provided fields to API expected camelCase
    const body = {};
    if (vehicleData.registration_no !== undefined)
      body.registrationNumber = vehicleData.registration_no;
    if (vehicleData.registrationNumber !== undefined)
      body.registrationNumber = vehicleData.registrationNumber;
    if (vehicleData.vehicle_type !== undefined) body.vehicleType = vehicleData.vehicle_type;
    if (vehicleData.vehicleType !== undefined) body.vehicleType = vehicleData.vehicleType;
    if (vehicleData.chassis_number !== undefined) body.chassisNumber = vehicleData.chassis_number;
    if (vehicleData.chassisNumber !== undefined) body.chassisNumber = vehicleData.chassisNumber;
    if (vehicleData.model !== undefined) body.model = vehicleData.model;
    if (vehicleData.status !== undefined) body.status = vehicleData.status;
    if (vehicleData.inventory !== undefined) body.inventory = vehicleData.inventory;
    // Include manufacturer and vehicleCategory for manual override
    if (vehicleData.manufacturer !== undefined) body.manufacturer = vehicleData.manufacturer;
    if (vehicleData.vehicleCategory !== undefined)
      body.vehicleCategory = vehicleData.vehicleCategory;
    if (vehicleData.expected_mileage !== undefined) {
      body.expectedMileage = toExpectedMileage(vehicleData.expected_mileage) || { kmPerL: null };
    }
    // Include orgId when provided by caller (some servers expect it)
    if (businessRefId) body.orgId = businessRefId;

    const response = await apiClient.patch(`/api/vehicles/${vehicleId}`, body);
    invalidateVehicleList();

    // Prefer new response shape
    if (response.data && response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }

    return response.data;
  } catch (error) {
    throw ApiError.from(error);
  }
};

// Vehicle documents are stored embedded on the Vehicle itself (not in the
// generic Document collection). All doc endpoints are scoped under the vehicle.

// `files` is an array of File/Blob. RC and NATIONAL_PERMIT accept up to 2 (front + back).
// `sides` is an optional array like ['FRONT','BACK'] mapped positionally.
const uploadVehicleDocument = async (vehicleId, docType, files, opts = {}) => {
  try {
    const list = Array.isArray(files) ? files : [files];
    if (!list.length) throw new Error('No files to upload');

    const formData = new FormData();
    list.forEach((f) => formData.append('files', f));
    formData.append('docType', docType);
    if (opts.expiryDate) formData.append('expiryDate', opts.expiryDate);
    if (Array.isArray(opts.sides) && opts.sides.length === list.length) {
      formData.append('sides', opts.sides.join(','));
    }

    // RC uploads are OCR'd server-side; same budget as the other OCR uploads.
    const response = await apiClient.post(`/api/vehicles/${vehicleId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('API Error uploading vehicle document:', error.response?.data || error.message);
    throw ApiError.from(error);
  }
};

const getVehicleDocuments = async (vehicleId, { signal } = {}) => {
  try {
    const response = await apiClient.get(`/api/vehicles/${vehicleId}/documents`, { signal });
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('API Error fetching vehicle documents:', error.response?.data || error.message);
    return [];
  }
};

// Fleet-wide dashboard: every vehicle + a per-docType expiry digest. Backend
// derives the owner name from RC OCR. Returns plain array, badges are computed
// client-side from expiryDate.
const getFleetDashboard = async ({ search, signal } = {}) => {
  try {
    const response = await apiClient.get('/api/vehicles/dashboard', {
      params: { search: search || undefined },
      signal,
    });
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('API Error fetching fleet dashboard:', error.response?.data || error.message);
    throw ApiError.from(error);
  }
};

const deleteVehicleDocument = async (vehicleId, docId) => {
  try {
    const response = await apiClient.delete(`/api/vehicles/${vehicleId}/documents/${docId}`);
    return response.data;
  } catch (error) {
    console.error('API Error deleting vehicle document:', error.response?.data || error.message);
    throw ApiError.from(error);
  }
};

const acknowledgeVehicleDocument = async (vehicleId, docId) => {
  try {
    const response = await apiClient.patch(`/api/vehicles/${vehicleId}/documents/${docId}/ack`);
    return response.data?.data || {};
  } catch (error) {
    console.error(
      'API Error acknowledging vehicle document:',
      error.response?.data || error.message,
    );
    throw ApiError.from(error);
  }
};

export const VehicleService = {
  getAllVehicles,
  addVehicle,
  addBulkVehicles,
  importVehicle,
  removeVehicle,
  updateVehicle,
  uploadVehicleDocument,
  getVehicleDocuments,
  deleteVehicleDocument,
  acknowledgeVehicleDocument,
  getFleetDashboard,
};
