import { useState, useEffect } from 'react';

/**
 * useDebouncedValue — returns `value` only after it has stopped changing for
 * `delay` ms. Use it to keep an input fully responsive while the network call it
 * drives (a search, a filter, a restriction check) fires once the user pauses,
 * not on every keystroke.
 *
 *   const [q, setQ] = useState('');
 *   const debouncedQ = useDebouncedValue(q, 350);
 *   useEffect(() => { fetchList(debouncedQ); }, [debouncedQ]);
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default useDebouncedValue;
