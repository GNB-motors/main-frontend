import React, { useCallback, useEffect, useRef, useState } from 'react';
import Ico from './routeHubIcons.jsx';

/** Transient confirmation toast, matching the mockup's bottom-centre pill. */
export function useToast() {
  const [msg, setMsg] = useState(null);
  const timer = useRef(0);

  const toast = useCallback((text) => {
    setMsg(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2200);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const node = (
    <div className={`toast ${msg ? 'on' : ''}`} role="status">
      <Ico n="checkS" s={14} />
      <span>{msg}</span>
    </div>
  );

  return { toast, toastNode: node };
}
