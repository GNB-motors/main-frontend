import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

import axios from 'axios';
import apiClient from '../../utils/axiosConfig';
import ApiError from '../../errors/ApiError';
import { VehicleService } from '../../pages/Profile/VehicleService';
import { ReportsService } from '../../pages/Reports/ReportsService';
import FleetDataService from '../FleetDataService';

const httpError = (status, data, requestId = 'req-123') =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    code: 'ERR_BAD_REQUEST',
    response: { status, data, headers: { 'x-request-id': requestId } },
  });

// Services used to throw the raw response body, so pages never saw the HTTP
// status, the request id, or a real Error. They must reject with an ApiError.
describe('service errors arrive as ApiError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('raw-axios service: keeps status and the body the Import offer reads', async () => {
    const body = {
      status: 'error',
      code: 'ALREADY_IN_ENTERPRISE',
      message: 'This registration number already belongs to a vehicle in your enterprise.',
      data: { vehicle: { id: 'v1', registrationNumber: 'WB25V8040' } },
    };
    axios.post.mockRejectedValueOnce(httpError(409, body));

    const err = await VehicleService.addVehicle(
      'org1',
      { registration_no: 'WB25V8040' },
      't',
    ).catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(409);
    expect(err.requestId).toBe('req-123');
    expect(err.message).toBe(body.message);
    expect(err.body.code).toBe('ALREADY_IN_ENTERPRISE');
    expect(err.body.data.vehicle.id).toBe('v1');
  });

  it('apiClient service: a server error keeps its status and message', async () => {
    apiClient.get.mockRejectedValueOnce(
      httpError(500, { status: 'error', statusCode: 500, message: 'Internal Server Error' }),
    );

    const err = await ReportsService.getVehicleReports({}).catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(500);
    expect(err.message).toBe('Internal Server Error');
  });

  it('a 403 reaches the page as status 403', async () => {
    apiClient.get.mockRejectedValueOnce(
      httpError(403, { status: 'error', statusCode: 403, message: 'Forbidden' }),
    );

    const err = await FleetDataService.getVehicleProfile('WB25V8040').catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(403);
  });

  it('a blob export failure exposes the parsed JSON body', async () => {
    const body = { status: 'error', message: 'No rows match these filters' };
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
    // jsdom's Blob has no text(); every browser the app supports does.
    blob.text = () => Promise.resolve(JSON.stringify(body));
    apiClient.get.mockRejectedValueOnce(httpError(400, blob));

    const err = await ReportsService.exportReportCsv('api/reports/x/export').catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.message).toBe('No rows match these filters');
    expect(err.body).toEqual(body);
  });

  it('a network failure with no response is still an ApiError', async () => {
    apiClient.get.mockRejectedValueOnce(
      Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }),
    );

    const err = await ReportsService.getVehicleReports({}).catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.isNetworkError).toBe(true);
  });
});
