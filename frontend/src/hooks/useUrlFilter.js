import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** A filter must survive a direct link, refresh and browser Back. */
export default function useUrlFilter(key, fallback = '', allowed = null) {
  const [params, setParams] = useSearchParams();
  const raw = params.get(key);
  const value = raw !== null && (!allowed || allowed.includes(raw)) ? raw : fallback;
  const setValue = useCallback(
    (nextValue, changes = {}) => {
      setParams((current) => {
        const next = new URLSearchParams(current);
        if (nextValue === fallback || nextValue === '') next.delete(key);
        else next.set(key, nextValue);
        Object.entries(changes).forEach(([name, value]) => {
          if (value === null || value === '') next.delete(name);
          else next.set(name, value);
        });
        return next;
      });
    },
    [key, fallback, setParams],
  );
  return [value, setValue];
}
