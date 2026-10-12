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

  const refreshTimerRef = useRef(null);
  useEffect(
    () => () => {
      clearTimeout(toastTimerRef.current);
      clearTimeout(refreshTimerRef.current);
    },
    [],
  );

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshLivePositions();
    } catch {
      // Ignore
    } finally {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        setIsRefreshing(false);
        showToast('Fleet positions refreshed');
      }, 600);
    }
  }, [refreshLivePositions, showToast]);

  return { isRefreshing, toastMsg, showToast, handleRefresh };
}
