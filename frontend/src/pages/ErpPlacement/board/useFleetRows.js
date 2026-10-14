import { useMemo } from 'react';

const useFleetRows = ({
  board,
  order,
  showAll,
  locFilter,
  sortBy,
  vehicleSearch,
  showEveryRow,
}) => {
  /** Every tanker on the board, flattened out of its location grouping. */
  const tankers = useMemo(
    () => (board?.locations || []).flatMap((loc) => loc.tankers || []),
    [board],
  );

  /**
   * Assignable now. Compatibility is only computed when a DO is selected, so
   * `isCompatible === null` means "not evaluated" rather than "incompatible".
   */
  const eligible = useMemo(
    () => tankers.filter((t) => t.isAvailable && t.isCompatible !== false),
    [tankers],
  );

  const locations = useMemo(
    () => [...new Set(tankers.map((t) => t.location).filter(Boolean))].sort(),
    [tankers],
  );

  /**
   * Ordering. "Nearest to origin" is deliberately not offered: nothing in the
   * data holds a vehicle-to-loading-point distance, and a made-up proximity on a
   * placement screen would be worse than no ordering at all. What can be said
   * truthfully is whether a tanker is already sitting AT the loading point,
   * which is an exact match, so that is the default.
   */
  const atLoadingPoint = (t) =>
    Boolean(order?.fromLocation) &&
    String(t.location || '').toLowerCase() === String(order.fromLocation).toLowerCase();

  const visible = useMemo(() => {
    const q = vehicleSearch.trim().toLowerCase();
    const base = (showAll ? tankers : eligible)
      .filter((t) => !locFilter || t.location === locFilter)
      .filter(
        (t) =>
          !q ||
          (t.registrationNumber || '').toLowerCase().includes(q) ||
          (t.model || '').toLowerCase().includes(q),
      );

    return [...base].sort((a, b) => {
      if (sortBy === 'CAPACITY') return (b.capacity || 0) - (a.capacity || 0);
      if (sortBy === 'LOCATION')
        return String(a.location || '').localeCompare(String(b.location || ''));
      const av = atLoadingPoint(a) ? 0 : 1;
      const bv = atLoadingPoint(b) ? 0 : 1;
      if (av !== bv) return av - bv;
      return (b.capacity || 0) - (a.capacity || 0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll, tankers, eligible, locFilter, sortBy, vehicleSearch, order]);

  const hidden = tankers.length - eligible.length;

  /**
   * A 300-tanker fleet rendered whole is 300 rows to scan for a decision that
   * needs about ten. The list is already ordered by usefulness — loading point
   * first — so the first page of it is the answer nearly every time; the rest is
   * one click away rather than gone.
   */
  const PAGE = 25;
  const rows = showEveryRow ? visible : visible.slice(0, PAGE);
  const notShown = visible.length - rows.length;

  return { tankers, eligible, locations, atLoadingPoint, visible, hidden, PAGE, rows, notShown };
};

export default useFleetRows;
