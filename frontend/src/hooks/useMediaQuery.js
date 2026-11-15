import { useEffect, useState } from 'react';

/**
 * useMediaQuery — a reactive CSS media query.
 *
 * The sidebar collapses on desktop when the pointer is away, and the hover
 * help is desktop-only. Both need to know the viewport, so the check lives
 * in one hook instead of being written twice.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const list = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);
    list.addEventListener('change', onChange);
    // The query may have changed between the first render and this effect.
    setMatches(list.matches);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export default useMediaQuery;
