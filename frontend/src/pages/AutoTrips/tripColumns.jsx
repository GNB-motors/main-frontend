import { Link } from 'react-router-dom';
import CellHint from '@/components/ui/CellHint';
import SapPill from '../Sap/SapPill';
import { BASIS_LABEL, sapNoteText } from '../Sap/sapModel';
import TripStatus from './TripStatus';
import { flagReasons } from './tripFlags';
import { PARTIAL_LABEL } from '../../utils/measured';
import { STATUS_LABEL, fmtDayTime, fmtKm } from './autoTripFormat';
import {
  SUSPICIOUS_UNLOAD_LABEL,
  SUSPICIOUS_UNLOAD_REASON,
  isSuspiciousUnload,
} from './tripSuspicion';
import { tripDetailHref } from './tripWorkspace';
import { allUnknown, loadedMin, minutesOnRoad } from './tripListModel';
import { DriverCell, RouteCell, TimeCell } from './TripCells';

const timeValue = (now) => (trip) => loadedMin(trip) ?? minutesOnRoad(trip, now);

/**
 * The trip list's columns for the rows on screen. A column whose every value on
 * this page is unknown is left out; `hidden` names those, so the page can say so once.
 */
export default function tripColumns({
  showSap,
  refetch,
  searchParams,
  knownEtas = [],
  rows = [],
  now = new Date(),
}) {
  const hidden = [];
  if (allUnknown(rows, (r) => r.driver?.name || r.driver?.mobileNumber || null))
    hidden.push('driver');
  if (allUnknown(rows, timeValue(now))) hidden.push('time');

  const columns = [
    {
      key: 'registrationNumber',
      width: '122px',
      label: 'Truck',
      // The sort keys are the ones the server sorts by (vehicle, date, distance, duration).
      sortable: true,
      sortKey: 'vehicle',
      render: (r) => (
        <Link
          className="atx-truck"
          to={tripDetailHref(r._id, searchParams)}
          onClick={(e) => e.stopPropagation()}
        >
          {r.registrationNumber || 'Trip'}
        </Link>
      ),
    },
    {
      key: 'route',
      label: 'Route',
      render: (r) => <RouteCell trip={r} knownEtas={knownEtas} />,
    },
    {
      key: 'driver',
      width: '140px',
      label: 'Driver',
      render: (r) => <DriverCell trip={r} onRetry={refetch} />,
    },
    {
      key: 'departedAt',
      width: '128px',
      label: 'Left plant',
      sortable: true,
      sortKey: 'date',
      render: (r) => <span className="atx-num">{fmtDayTime(r.pickup?.departedAt)}</span>,
    },
    {
      key: 'time',
      width: '104px',
      label: 'Trip time',
      align: 'right',
      sortable: true,
      sortKey: 'duration',
      render: (r) => <TimeCell trip={r} now={now} />,
    },
    {
      key: 'km',
      width: '112px',
      label: 'Total km',
      align: 'right',
      sortable: true,
      sortKey: 'totalDistance',
      render: (r) => {
        const m = r.measurement;
        return (
          <span className="atx-num" title={m?.note || 'Trip measurement unavailable'}>
            {fmtKm(m?.totalKm)}
            {m?.soFar ? ' so far' : ''}
            {m?.partial ? <span className="atx-chip atx-chip--watch">{PARTIAL_LABEL}</span> : null}
            <small className="block atx-cell-quiet">
              Loaded {fmtKm(m?.loadedKm)} · Empty {fmtKm(m?.emptyKm)}
            </small>
          </span>
        );
      },
    },
    {
      key: 'burnedL',
      label: 'Diesel burned',
      align: 'right',
      render: (r) => (
        <span className="atx-num">
          {r.measurement?.burnedL == null ? '—' : `${r.measurement.burnedL} L`}
          {r.measurement?.fuelPartial ? (
            <small className="block atx-cell-quiet">Partial coverage</small>
          ) : null}
        </span>
      ),
    },
    {
      key: 'kmPerL',
      label: 'km/L',
      align: 'right',
      render: (r) => (
        <span className="atx-num">
          {r.measurement?.kmPerL ?? '—'}
          <small className="block atx-cell-quiet">
            {r.measurement?.efficiencyBasis === 'LOADED_LEG'
              ? 'Loaded leg'
              : r.measurement?.efficiencyBasis === 'TRIP'
                ? 'Whole trip'
                : 'Awaiting measurement'}
          </small>
        </span>
      ),
    },
    {
      key: 'sap',
      width: '200px',
      label: 'SAP km',
      render: (r) => {
        const km = r.sap?.status === 'MATCHED' ? `${r.sap.sapKm} km` : '—';
        if (!r.sap) return <span className="atx-num">{km}</span>;
        const note = sapNoteText(r.sap);
        const basis = r.sap.basis ? `Basis: ${BASIS_LABEL[r.sap.basis]}` : null;
        // One line: the km, then the note clipped with "…"; the tooltip says it all.
        return (
          <CellHint
            className="atx-sap-cell"
            label="SAP km"
            value={km}
            details={[note, basis]}
            ariaLabel={['SAP km', km, note, basis].filter(Boolean).join('. ')}
          >
            <span className="atx-num">{km}</span>
            <span className="atx-sap-note">
              <SapPill sap={r.sap} />
            </span>
          </CellHint>
        );
      },
    },
    {
      key: 'status',
      width: '172px',
      label: 'Status',
      render: (r) => {
        const reasons = flagReasons(r);
        if (!reasons.length) return <TripStatus status={r.status} />;
        // A suspicious unload is worth a person's attention, so the row shows a
        // "+1" beside the status; what it is, and every other check, is in the
        // tooltip, so the row stays one line.
        const suspicious = isSuspiciousUnload(r);
        const checks = reasons.filter((reason) => reason !== SUSPICIOUS_UNLOAD_REASON);
        const details = [
          suspicious ? `${SUSPICIOUS_UNLOAD_LABEL}: ${SUSPICIOUS_UNLOAD_REASON}` : null,
          checks.length ? `To check: ${checks.join(', ')}` : null,
        ].filter(Boolean);
        const statusText = STATUS_LABEL[r.status] || r.status;
        return (
          <CellHint
            className="atx-status-cell"
            label="Status"
            value={statusText}
            details={details}
            ariaLabel={[statusText, ...details].join('. ')}
          >
            <TripStatus status={r.status} />
            {suspicious ? (
              <span className="atx-chip atx-chip--watch atx-chip--more" aria-hidden="true">
                +1
              </span>
            ) : null}
          </CellHint>
        );
      },
    },
  ].filter((c) => (showSap || c.key !== 'sap') && !hidden.includes(c.key));

  return { columns, hidden };
}

/** One sentence for the columns the page left out, or null. */
export function hiddenColumnsNote(hidden, statusTab) {
  const km = hidden.includes('km');
  const time = hidden.includes('time');
  const driver = hidden.includes('driver');
  const parts = [];
  if (km && time) {
    parts.push(
      statusTab === 'NEEDS_REVIEW'
        ? 'Loaded km and trip time are measured once the drop is known'
        : 'Loaded km and trip time are measured when a truck reaches its drop',
    );
  } else if (km) {
    parts.push('Loaded km is measured when a truck reaches its drop');
  } else if (time) {
    parts.push('Trip time is not measured for these trips yet');
  }
  if (driver) parts.push('no driver is linked to these trips');
  if (!parts.length) return null;
  const text = parts.join('; ');
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}
