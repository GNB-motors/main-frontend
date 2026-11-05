import { useCallback, useEffect, useRef, useState } from 'react';
import Service from './PlaceIntelligenceService';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';

export default function useMergeJob(onComplete, { enabled = true } = {}) {
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const { organization } = useFeatureFlags();
  const scopeKey = organization?._id || '';
  const complete = useRef(onComplete);
  complete.current = onComplete;
  const notified = useRef(null);
  useEffect(() => {
    setJob(null);
    setError(null);
    notified.current = null;
  }, [scopeKey]);
  useEffect(() => {
    const interrupted = (event) => {
      if (enabled && event.detail?.jobId) setJob(event.detail);
    };
    window.addEventListener('placeRecalculationRequired', interrupted);
    return () => window.removeEventListener('placeRecalculationRequired', interrupted);
  }, [enabled]);
  useEffect(() => {
    const controller = new AbortController();
    let timer;
    const poll = async () => {
      try {
        const next = job?.jobId
          ? await Service.getMergeJob(job.jobId, { signal: controller.signal })
          : await Service.activeMergeJob({ signal: controller.signal });
        if (controller.signal.aborted) return;
        setError(null);
        setJob(next);
        if (next?.status === 'COMPLETE' && notified.current !== next.jobId) {
          notified.current = next.jobId;
          complete.current?.(next);
          window.dispatchEvent(new CustomEvent('placeRecalculationComplete', { detail: next }));
        }
      } catch (err) {
        if (!controller.signal.aborted)
          setError(err.message || 'Could not check recalculation progress');
      }
      if (!controller.signal.aborted) timer = setTimeout(poll, job?.jobId ? 2000 : 10000);
    };
    if (
      enabled &&
      job?.status !== 'COMPLETE' &&
      !(job?.status === 'FAILED' && job.active === false)
    )
      poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [job?.jobId, job?.status, job?.active, enabled, scopeKey]);
  const watch = useCallback((operation) => {
    if (operation?.jobId) setJob(operation);
  }, []);
  const retry = useCallback(async () => {
    try {
      if (job?.jobId) watch(await Service.retryMergeJob(job.jobId));
      setError(null);
    } catch (err) {
      setError(err.message || 'Could not retry recalculation');
    }
  }, [job?.jobId, watch]);
  return {
    job,
    watch,
    retry,
    error,
    busy: !!job && job.status !== 'COMPLETE' && job.active !== false,
  };
}
