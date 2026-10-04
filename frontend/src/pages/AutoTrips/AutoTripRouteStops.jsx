import { MapPin, MapPinPlus } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { canMarkPlace, isCurrentDrop, stopLabel } from './autoTripModel';

function fmt(v) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN');
}
const mins = (v) => (v == null ? '—' : `${Math.round(v)} min`);

/**
 * Every stop the truck made after leaving the plant, up to its next pickup — the
 * stops a person picks the real drop from. "Set as drop" fixes this trip only;
 * "Drop + mark place" also answers the place as a drop, which settles every other
 * trip that turned around there.
 */
export default function AutoTripRouteStops({ trip, frozen, busy, onSetDrop }) {
  const columns = [
    { key: 'startAt', label: 'Arrived', render: (s) => fmt(s.startAt) },
    {
      key: 'place',
      label: 'Where',
      render: (s) => (
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          {stopLabel(s)}
          {isCurrentDrop(s, trip) ? <Badge variant="secondary">Drop</Badge> : null}
        </span>
      ),
    },
    { key: 'dwell', label: 'Stayed', align: 'right', render: (s) => mins(s.dwellMinutes) },
    { key: 'purpose', label: 'Looks like', render: (s) => s.purpose?.top || '—' },
    {
      key: 'action',
      label: '',
      align: 'right',
      render: (s) =>
        frozen || isCurrentDrop(s, trip) ? null : (
          <span style={{ display: 'inline-flex', gap: 6 }}>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation();
                onSetDrop(s, false);
              }}
            >
              <MapPin size={14} /> Set as drop
            </Button>
            {canMarkPlace(s) ? (
              <Button
                size="sm"
                disabled={busy}
                title="Also mark this place as a drop place, so other trips that stopped here settle too"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDrop(s, true);
                }}
              >
                <MapPinPlus size={14} /> Drop + mark place
              </Button>
            ) : null}
          </span>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={trip.routeStops || []}
      rowKey={(s) => s._id}
      emptyTitle="No stops after the plant"
      emptyHint="The truck has not stopped since it left the pickup."
    />
  );
}
