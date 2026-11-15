import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

// A failed /auth/me is not a fact about the account: the last good flags stay
// on screen, the failure is said out loud, and a person can ask again.
describe('FeatureFlagsProvider retry', () => {
  function RetryProbe() {
    const { failed, retry, flags } = useFeatureFlags();
    return (
      <div>
        <span data-testid="failed">{failed ? 'failed' : 'ok'}</span>
        <span data-testid="flag">{Object.keys(flags).join(',')}</span>
        <button type="button" onClick={() => retry()}>
          Retry
        </button>
      </div>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('says the read failed and asks again when Retry is pressed', async () => {
    isAuthenticated.mockReturnValue(true);
    const me = deferred();
    apiClient.get.mockReturnValue(me.promise);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <FeatureFlagsProvider>
        <RetryProbe />
      </FeatureFlagsProvider>,
    );

    me.reject(new Error('network down'));
    await waitFor(() => expect(screen.getByTestId('failed')).toHaveTextContent('failed'));

    apiClient.get.mockResolvedValue({
      data: {
        data: {
          organization: { featureFlags: { vehicles: true } },
          permissions: { vehicles: true },
        },
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(screen.getByTestId('failed')).toHaveTextContent('ok'));
    expect(screen.getByTestId('flag')).toHaveTextContent('vehicles');
  });
});

// Every consumer (Sidebar, Navbar, CommandPalette, pages) re-renders when the
// context value's identity changes, so an unchanged payload must keep it.
describe('FeatureFlagsProvider value identity', () => {
  it('keeps the same value object when the provider re-renders with no change', () => {
    isAuthenticated.mockReturnValue(false);
    const seen = [];
    function ValueProbe() {
      seen.push(useFeatureFlags());
      return null;
    }

    const { rerender } = render(
      <FeatureFlagsProvider>
        <ValueProbe />
      </FeatureFlagsProvider>,
    );
    rerender(
      <FeatureFlagsProvider>
        <ValueProbe />
      </FeatureFlagsProvider>,
    );

    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(seen.at(-1)).toBe(seen.at(-2));
  });
});
