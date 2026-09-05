import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useMutation — the house mutation primitive for POST/PUT/DELETE.
 *
 *   const { mutate, data, loading, error, reset } = useMutation(
 *     (payload, { signal }) => Service.createThing(payload, { signal })
 *   );
 *
 *   await mutate(formValues);           // throws on failure (after storing error)
 *
 * - abortable: a new mutate() (or unmount) cancels the in-flight request
 * - loading/error mirror the latest call; data holds the last success
 * - no caching: every mutate() hits the network
 */
export function useMutation(mutationFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fnRef = useRef(mutationFn);
  fnRef.current = mutationFn;
  const controllerRef = useRef(null);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  const mutate = useCallback(async (payload, options = {}) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current(payload, { signal: controller.signal, ...options });
      if (!controller.signal.aborted) setData(result);
      return result;
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return undefined;
      if (!controller.signal.aborted) setError(err);
      throw err;
    } finally {
      // Only clear state if this call is still the current one — a newer
      // mutate() already set loading/error and owns the state now.
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return { mutate, data, loading, error, reset };
}

export default useMutation;
