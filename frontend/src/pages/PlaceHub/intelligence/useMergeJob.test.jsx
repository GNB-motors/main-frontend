import { act, renderHook } from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import useMergeJob from './useMergeJob';
import Service from './PlaceIntelligenceService';

const state = vi.hoisted(() => ({ orgId: 'org-a' }));
vi.mock('../../../contexts/FeatureFlagsContext', () => ({ useFeatureFlags: () => ({ organization: { _id: state.orgId } }) }));
vi.mock('./PlaceIntelligenceService', () => ({ default: { activeMergeJob: vi.fn(), getMergeJob: vi.fn(), retryMergeJob: vi.fn() } }));
beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks(); state.orgId = 'org-a';
  Service.activeMergeJob.mockResolvedValue(null);
  Service.getMergeJob.mockResolvedValue({ jobId: 'job-a', status: 'RUNNING', active: true, stage: 'trips' });
});
afterEach(() => { vi.useRealTimers(); });
const settle = async () => { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); };

it('recovers an active operation, polls to completion once and stops polling', async () => {
  Service.activeMergeJob.mockResolvedValue({ jobId: 'job-a', status: 'QUEUED', active: true });
  const complete = vi.fn();
  const hook = renderHook(() => useMergeJob(complete));
  await settle();
  expect(hook.result.current.busy).toBe(true);
  expect(hook.result.current.job.stage).toBe('trips');
  Service.getMergeJob.mockResolvedValue({ jobId: 'job-a', status: 'COMPLETE', active: false });
  await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
  expect(complete).toHaveBeenCalledTimes(1);
  expect(hook.result.current.busy).toBe(false);
  const requests = Service.getMergeJob.mock.calls.length;
  await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
  expect(Service.getMergeJob).toHaveBeenCalledTimes(requests);
  hook.unmount();
});

it('keeps failed partial work visible and retries without claiming completion', async () => {
  const failed = { jobId: 'job-a', status: 'FAILED', active: true, error: 'Route rebuild failed' };
  Service.activeMergeJob.mockResolvedValue(failed); Service.getMergeJob.mockResolvedValue(failed);
  Service.retryMergeJob.mockResolvedValue({ jobId: 'job-a', status: 'QUEUED', active: true });
  const complete = vi.fn(); const hook = renderHook(() => useMergeJob(complete));
  await settle(); expect(hook.result.current.busy).toBe(true);
  Service.getMergeJob.mockResolvedValue({ jobId: 'job-a', status: 'RUNNING', active: true });
  await act(async () => { await hook.result.current.retry(); });
  expect(Service.retryMergeJob).toHaveBeenCalledWith('job-a');
  expect(complete).not.toHaveBeenCalled();
  hook.unmount();
});

it('aborts progress requests and timers on navigation', async () => {
  Service.activeMergeJob.mockResolvedValue({ jobId: 'job-a', status: 'RUNNING', active: true });
  const hook = renderHook(() => useMergeJob()); await settle();
  const signal = Service.getMergeJob.mock.calls.at(-1)[1].signal;
  const requests = Service.getMergeJob.mock.calls.length;
  hook.unmount(); expect(signal.aborted).toBe(true);
  await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
  expect(Service.getMergeJob).toHaveBeenCalledTimes(requests);
});

it('clears the previous organization operation when organization changes', async () => {
  Service.activeMergeJob.mockResolvedValue({ jobId: 'job-a', status: 'RUNNING', active: true });
  const hook = renderHook(() => useMergeJob()); await settle();
  expect(hook.result.current.job.jobId).toBe('job-a');
  Service.activeMergeJob.mockResolvedValue(null); state.orgId = 'org-b';
  hook.rerender(); await settle();
  expect(hook.result.current.job).toBeNull(); expect(hook.result.current.busy).toBe(false);
  hook.unmount();
});

it('does not call manager-only endpoints when disabled', async () => {
  const hook = renderHook(() => useMergeJob(undefined, { enabled: false }));
  await settle(); expect(Service.activeMergeJob).not.toHaveBeenCalled(); hook.unmount();
});
