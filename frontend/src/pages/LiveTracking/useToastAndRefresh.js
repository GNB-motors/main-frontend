import { useCallback, useEffect, useRef, useState } from 'react';

export default function useToastAndRefresh(refreshLivePositions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimerRef = useRef(null);

  // Toast trigger helper
  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 2400);
  }, []);

  const refreshingRef = useRef(false);
  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  const handleRefresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setIsRefreshing(true);
    try {
      await refreshLivePositions();
      // The data hook owns success/error state and the last successful timestamp.
    } catch {
      showToast('Unable to refresh fleet positions');
    } finally {
      refreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [refreshLivePositions, showToast]);

  return { isRefreshing, toastMsg, showToast, handleRefresh };
}
