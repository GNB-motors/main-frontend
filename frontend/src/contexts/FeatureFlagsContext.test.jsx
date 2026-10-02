import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import apiClient from '../utils/axiosConfig';
import { isAuthenticated } from '../utils/session.js';
import { FeatureFlagsProvider, useFeatureFlags } from './FeatureFlagsContext.jsx';

vi.mock('../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));
vi.mock('../utils/session.js', () => ({ isAuthenticated: vi.fn() }));

// Records every render so we can assert no render was ever "ready" with
// empty permissions — the exact flash the DashboardLayout gate exists to stop.
const renders = [];
function Probe() {
  const { ready, permissions } = useFeatureFlags();
  renders.push({ ready, permCount: Object.keys(permissions).length });
  return (
    <div data-testid="state">{ready ? `ready:${Object.keys(permissions).length}` : 'waiting'}</div>
  );
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('FeatureFlagsProvider ready gate', () => {
  beforeEach(() => {
    renders.length = 0;
    vi.clearAllMocks();
  });

  it('stays not-ready until /auth/me lands, then is ready with permissions in the same render', async () => {
    isAuthenticated.mockReturnValue(true);
    const me = deferred();
    apiClient.get.mockReturnValue(me.promise);

    render(
      <FeatureFlagsProvider>
        <Probe />
      </FeatureFlagsProvider>,
    );
    expect(screen.getByTestId('state')).toHaveTextContent('waiting');
    expect(apiClient.get).toHaveBeenCalledWith('/api/auth/me', expect.anything());

    me.resolve({
      data: {
        data: {
          organization: { featureFlags: { vehicles: true } },
          permissions: { vehicles: true, reports: true },
        },
      },
    });

    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('ready:2'));
    expect(renders.some((r) => r.ready && r.permCount === 0)).toBe(false);
  });

  it('becomes ready (fail-open to empty permissions) when /auth/me errors, so the shell is never stuck', async () => {
    isAuthenticated.mockReturnValue(true);
    const me = deferred();
    apiClient.get.mockReturnValue(me.promise);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <FeatureFlagsProvider>
        <Probe />
      </FeatureFlagsProvider>,
    );
    me.reject(new Error('network down'));

    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('ready:0'));
  });

  it('is ready immediately and never calls /auth/me when not authenticated', () => {
    isAuthenticated.mockReturnValue(false);

    render(
      <FeatureFlagsProvider>
        <Probe />
      </FeatureFlagsProvider>,
    );

    expect(screen.getByTestId('state')).toHaveTextContent('ready:0');
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
