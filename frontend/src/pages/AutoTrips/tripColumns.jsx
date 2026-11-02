import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import SapPill from '../Sap/SapPill';
import { BASIS_LABEL } from '../Sap/sapModel';
import { FLAG_LABEL } from './autoTripPlaces';
import TripDriver from './TripDriver';
import TripStatus from './TripStatus';
import { dropLabel } from '../PlaceHub/intelligence/facilityText';
import { fmtDayTime, fmtKm, fmtDuration, notReachedYet } from './autoTripFormat';
import { tripDetailHref } from './tripWorkspace';

export default function tripColumns({ showSap, refetch, searchParams }) {
  return [
    {
      key: 'registrationNumber',
      width: 145,
      label: 'Truck',
      render: (r) => (
        <Link
          className="atx-vehicle-link"
          to={tripDetailHref(r._id, searchParams)}
          onClick={(e) => e.stopPropagation()}
        >
          {r.registrationNumber || 'Trip'}
        </Link>
      ),
    },
    {
      key: 'route',
      width: 230,
      label: 'Route',
      render: (r) => (
        <span className="atx-route-cell">
          <strong>{r.pickup?.name || '—'}</strong>
          <span>
            →{' '}
            {notReachedYet(r) ? (
              <span className="atx-muted">not reached yet</span>
            ) : (
              dropLabel(r.drop)
            )}
          </span>
        </span>
      ),
    },
    {
      key: 'driver',
      width: 160,
      label: 'Driver',
      render: (r) => <TripDriver trip={r} onRetry={refetch} />,
    },
    {
      key: 'departedAt',
      width: 185,
      label: 'Trip timing',
      render: (r) => (
        <span className="atx-cell-stack">
          <span>{fmtDayTime(r.pickup?.departedAt, { padDay: true })}</span>
          <small>
            {r.drop?.arrivedAt ? `Reached ${fmtDayTime(r.drop.arrivedAt)}` : 'Delivery pending'}
          </small>
        </span>
      ),
    },
    {
      key: 'laden',
      label: 'Loaded run',
      align: 'right',
      render: (r) =>
        r.km?.ladenOdo == null && r.km?.laden == null ? (
          <span className="atx-muted">Not recorded</span>
        ) : (
          <span
            className="atx-cell-stack"
            title={r.km?.ladenOdo != null ? 'From the vehicle odometer' : 'GPS path'}
          >
            <strong>{fmtKm(r.km?.ladenOdo ?? r.km.laden)}</strong>
            <small>
              {fmtDuration(r.durations?.ladenMin ?? r.durations?.transitMin)}
              {r.extraDrops?.length > 0 && r.durations?.ladenMin == null ? ' to first drop' : ''}
            </small>
          </span>
        ),
    },
    {
      key: 'sap',
      label: 'SAP km',
      render: (r) => (
        <div className="sap-stack">
          <span title={r.sap?.basis ? BASIS_LABEL[r.sap.basis] : undefined}>
            {r.sap?.status === 'MATCHED' ? `${r.sap.sapKm} km` : '—'}
          </span>
          {r.sap ? <SapPill sap={r.sap} /> : <span className="sap-muted">Not computed yet</span>}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Trip status',
      render: (r) => (
        <span className="atx-cell-stack">
          <TripStatus status={r.status} />
          {r.flags?.length > 0 && (
            <small
              className="atx-check-label"
              title={r.flags.map((f) => FLAG_LABEL[f] || f).join(' · ')}
            >
              {r.flags.length} check{r.flags.length === 1 ? '' : 's'} to review
            </small>
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <Link
          to={tripDetailHref(r._id, searchParams)}
          className="atx-view-link"
          onClick={(e) => e.stopPropagation()}
        >
          View trip <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      ),
    },
  ].filter((c) => showSap || c.key !== 'sap');
}
