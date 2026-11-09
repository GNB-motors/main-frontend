import { Link } from 'react-router-dom';
import SapPill from '../Sap/SapPill';
import { BASIS_LABEL } from '../Sap/sapModel';
import TripStatus from './TripStatus';
import { flagReasons } from './tripFlags';
import { PARTIAL_LABEL } from '../../utils/measured';
import { fmtDayTime, fmtKm } from './autoTripFormat';
import { SUSPICIOUS_UNLOAD_LABEL, SUSPICIOUS_UNLOAD_REASON, isSuspiciousUnload } from './tripSuspicion';
import { tripDetailHref } from './tripWorkspace';
import { allUnknown, loadedKm, loadedMin, minutesOnRoad } from './tripListModel';
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
  if (allUnknown(rows, loadedKm)) hidden.push('km');

  const columns = [
    {
      key: 'registrationNumber',
      width: '122px',
      label: 'Truck',
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
      render: (r) => <span className="atx-num">{fmtDayTime(r.pickup?.departedAt)}</span>,
    },
    {
      key: 'time',
      width: '104px',
      label: 'Trip time',
      align: 'right',
      render: (r) => <TimeCell trip={r} now={now} />,
    },
    {
      key: 'km',
      width: '112px',
      label: 'Loaded km',
      align: 'right',
      render: (r) => {
        const km = loadedKm(r);
        const badge = r.kmPartial ? (
          <span className="atx-chip atx-chip--watch">{PARTIAL_LABEL}</span>
        ) : null;
        if (km == null) return <span className="atx-cell-quiet">—{badge}</span>;
        return (
          <span
            className="atx-num"
            title={r.km?.ladenOdo != null ? 'From the odometer' : 'From the GPS path'}
          >
            {fmtKm(km)}
            {badge}
          </span>
        );
      },
    },
    {
      key: 'sap',
      width: '144px',
      label: 'SAP km',
      render: (r) => (
        <span className="atx-sap-cell">
          <span className="atx-num" title={r.sap?.basis ? BASIS_LABEL[r.sap.basis] : undefined}>
            {r.sap?.status === 'MATCHED' ? `${r.sap.sapKm} km` : '—'}
          </span>
          {r.sap ? <SapPill sap={r.sap} /> : null}
        </span>
      ),
    },
    {
      key: 'status',
      width: '142px',
      label: 'Status',
      render: (r) => {
        const checks = flagReasons(r);
        // A suspicious unload is worth a person's attention, so the row says so
        // in a badge rather than hiding it in the tooltip.
        const suspicious = isSuspiciousUnload(r);
        return (
          <span
            className="atx-status-cell"
            title={
              checks.length
                ? `To check: ${checks.join(', ')}`
                : suspicious
                  ? SUSPICIOUS_UNLOAD_REASON
                  : undefined
            }
          >
            <TripStatus status={r.status} />
            {suspicious ? (
              <span className="atx-chip atx-chip--watch" title={SUSPICIOUS_UNLOAD_REASON}>
                {SUSPICIOUS_UNLOAD_LABEL}
              </span>
            ) : null}
          </span>
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
