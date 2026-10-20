import { useMemo } from 'react';
import { formatIST } from '../fiDates.js';

/** Columns and rows for the Excel/CSV export of the filtered fuel events. */
const useIntegrityExport = (filteredEvents) => {
  /* ── Export configuration for Excel (.xlsx) and CSV (.csv) ───────────────── */
  const exportColumns = useMemo(
    () => [
      { key: 'vehicle', label: 'Vehicle Registration', type: 'text' },
      { key: 'kind', label: 'Event Type', type: 'text' },
      { key: 'timestampIST', label: 'Timestamp (IST)', type: 'text' },
      { key: 'litres', label: 'Fuel Volume (L)', type: 'number' },
      { key: 'inr', label: 'Estimated Value (₹)', type: 'currency' },
      { key: 'status', label: 'Integrity Status', type: 'text' },
      { key: 'lat', label: 'Latitude', type: 'number' },
      { key: 'lng', label: 'Longitude', type: 'number' },
    ],
    [],
  );

  const exportRows = useMemo(
    () =>
      filteredEvents.map((ev) => ({
        vehicle: ev.vehicle || '',
        kind:
          ev.kind === 'fill' ? 'Refuel Fill' : ev.kind === 'loss' ? 'Siphon Loss' : 'DEF Anomaly',
        timestampIST: formatIST(ev.at),
        litres: ev.litres != null ? Number(Number(ev.litres).toFixed(1)) : null,
        inr: ev.inr != null ? Number(ev.inr) : null,
        status:
          ev.kind === 'fill'
            ? ev.billFlag
              ? 'Bill Mismatch'
              : ev.confirmationStatus || 'Estimated'
            : ev.kind === 'loss'
              ? 'Suspected Loss'
              : `DEF ${ev.defFlag || 'Anomaly'}`,
        lat: ev.lat != null ? Number(ev.lat) : null,
        lng: ev.lng != null ? Number(ev.lng) : null,
      })),
    [filteredEvents],
  );

  return { exportColumns, exportRows };
};

export default useIntegrityExport;
