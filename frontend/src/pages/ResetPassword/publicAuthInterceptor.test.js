import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import apiClient from '../../utils/axiosConfig';
import { setNavigator } from '../../utils/navigation';
import { PasswordResetService } from '../../services/PasswordResetService';

/**
 * The real axios instance with its real interceptors — only the transport is
 * replaced, so the interceptor logic itself is what is under test.
 */
const failWith = (status, data) => (config) =>
  Promise.reject(
    Object.assign(new Error(`Request failed with status code ${status}`), {
      config,
      isAxiosError: true,
      response: { status, data, headers: {}, config },
    }),
  );

describe('the real axios interceptor on the signed-out pages', () => {
  const originalAdapter = apiClient.defaults.adapter;
  let navigate;

  beforeEach(() => {
    navigate = vi.fn();
    setNavigator(navigate);
    window.localStorage.clear();
  });

  afterEach(() => {
    setNavigator(null);
    apiClient.defaults.adapter = originalAdapter;
  });

  it('review 7: a 401 on a public reset call never redirects to /login', async () => {
    apiClient.defaults.adapter = failWith(401, { message: 'bad token' });

    await expect(PasswordResetService.verifyReset('tok-1')).rejects.toMatchObject({
      status: 401,
    });

    expect(navigate).not.toHaveBeenCalled();
    expect(window.location.pathname).not.toBe('/login');
  });

  it('review 7: a 429 on a public reset call never redirects to /login', async () => {
    apiClient.defaults.adapter = failWith(429, { message: 'Too many requests' });

    await expect(PasswordResetService.requestReset('asha@gnb.com')).rejects.toMatchObject({
      status: 429,
    });

    expect(navigate).not.toHaveBeenCalled();
    expect(window.location.pathname).not.toBe('/login');
  });

  it('review 7: without the opt-out the same 401 does redirect — the interceptor really runs', async () => {
    apiClient.defaults.adapter = failWith(401, { message: 'no token provided' });

    await expect(apiClient.get('/api/some/protected/call')).rejects.toBeTruthy();

    expect(navigate).toHaveBeenCalledWith(
      '/login',
      expect.objectContaining({ replace: true }),
    );
  });
});
