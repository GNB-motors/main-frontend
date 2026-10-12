/**
 * Zod validation for GET /api/driver-vehicle-assignments records (main-backend
 * driverVehicleAssignment.model.js). The list populates driverId and vehicleId,
 * so each is either a bare id or a small object. Permissive: unknown fields
 * pass through and every optional field also accepts null.
 */
import { z } from 'zod';
import { str } from './primitives.js';

const refOr = (shape) => z.union([z.string(), z.object(shape).passthrough()]).nullish();

export const driverVehicleAssignmentSchema = z
  .object({
    _id: z.string(),
    driverId: refOr({ _id: str, firstName: str, lastName: str, mobileNumber: str }),
    vehicleId: refOr({ _id: str, registrationNumber: str, model: str }),
    startDate: str,
    endDate: str,
    status: str,
    notes: str,
  })
  .passthrough();

export const driverVehicleAssignmentListSchema = z.array(driverVehicleAssignmentSchema);
