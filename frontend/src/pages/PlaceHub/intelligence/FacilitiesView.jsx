import { useState } from 'react';
import { toast } from 'react-toastify';
import { Factory } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { useMutation } from '../../../hooks/useMutation';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import PanelLoading from './PanelLoading';
import EmptyPanel from './EmptyPanel';
import PlaceMapModal from './PlaceMapModal.jsx';
import { messageOf } from './model/requestOutcome.js';
import { evidenceLines, poiText, roleText, pct } from './facilityText';

const FILTERS = [
  { key: 'review', label: 'To check', params: { needsReview: true } },
  { key: 'PICKUP', label: 'Pickups', params: { role: 'PICKUP' } },
  { key: 'DROP', label: 'Drops', params: { role: 'DROP' } },
];

const ANSWERS = [
  { siteType: 'LOADING', label: 'Pickup' },
  { siteType: 'UNLOADING', label: 'Drop' },
  { siteType: 'PLANT', label: 'Both' },
];

const roleOf = (f = {}) =>
  (f.roles || []).includes('DROP') && !(f.roles || []).includes('PICKUP') ? 'DROP' : 'PICKUP';
const coord = (lat, lng) =>
  typeof lat === 'number' && typeof lng === 'number' ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : '—';

/**
 * Facilities — one row per physical place, exactly as trip detection sees it:
 * its role, whether that came from your answer or was learned (with how sure
 * the system is), and the evidence. "To check" lists places where the system
 * acts against a spot answer or a role came close; one click answers it, and
 * the answer teaches the model for every place like it.
 */
export default function FacilitiesView({ version, onChanged, onOpenPlace }) {
  const [filter, setFilter] = useState('review');
  const [openFac, setOpenFac] = useState(null);
  const params = FILTERS.find((f) => f.key === filter).params;
  const { data, loading, error, refetch } = useApi(
    (signal) => PlaceIntelligenceService.listFacilities({ ...params, limit: 200 }, { signal }),
    [filter, version],
  );
  const retypeM = useMutation(PlaceIntelligenceService.retype);
  const acceptM = useMutation(PlaceIntelligenceService.accept);

  // A confirmed place is retyped; a proposed one is accepted with the type.
  const answer = async (site, siteType) => {
    try {
      if (site.status === 'CONFIRMED') await retypeM.mutate({ id: site._id, siteType });
      else await acceptM.mutate({ id: site._id, siteType });
      toast.success('Saved — trips will be rebuilt for this place');
      refetch();
      onChanged?.();
    } catch (e) {
      toast.error(e?.message || 'Could not save');
    }
  };

  if (loading && !data) return <PanelLoading />;
  if (error)
    return (
      <EmptyPanel
        title="Could not load facilities"
        hint={messageOf(error, 'Try again in a minute.')}
      />
    );
  const items = data?.items || [];

  return (
    <div>
      <div className="pi-filters" role="tablist" aria-label="Facility filter">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            className={filter === f.key ? 'is-active' : ''}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {!items.length ? (
        <EmptyPanel
          Icon={Factory}
          title={filter === 'review' ? 'Nothing to check' : 'No facilities here yet'}
          hint="Facilities are rebuilt every night from your answers, the fleet's stops and the map."
        />
      ) : (
        <div className="pi-table-wrap">
          <table className="pi-table">
            <thead>
              <tr>
                <th>Place</th>
                <th>What trips see</th>
                <th>Why</th>
                <th>On the map</th>
                <th className="pi-num">Stops</th>
                <th>Answer</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => {
                const f = s.facility || {};
                const role = roleOf(f);
                return (
                  <tr
                    key={s._id}
                    className="pi-row-click"
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${f.name || s.name || 'this place'} on the map`}
                    onClick={() => setOpenFac(s)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setOpenFac(s);
                      }
                    }}
                  >
                    <td className="pi-cell-strong">{f.name || s.name || 'Unnamed place'}</td>
                    <td>
                      {roleText(f)}
                      {f.suggestions?.length ? (
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          maybe {f.suggestions.map((r) => r.toLowerCase()).join(' / ')} (
                          {pct(f.suggestions.includes('PICKUP') ? f.pPickup : f.pDrop)})
                        </div>
                      ) : null}
                    </td>
                    <td style={{ fontSize: 12 }}>{evidenceLines(f, role).join('; ') || '—'}</td>
                    <td style={{ fontSize: 12 }}>{poiText(s.poi) || '—'}</td>
                    <td className="pi-num">{s.visitCount ?? '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {ANSWERS.map((a) => (
                          <button
                            key={a.siteType}
                            type="button"
                            className="pi-btn-quiet"
                            disabled={retypeM.loading || acceptM.loading}
                            onClick={(e) => {
                              e.stopPropagation();
                              answer(s, a.siteType);
                            }}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <PlaceMapModal
        open={!!openFac}
        onOpenChange={(o) => (o ? null : setOpenFac(null))}
        icon={<Factory size={18} />}
        title={openFac ? openFac.facility?.name || openFac.name || 'Unnamed place' : ''}
        subtitle="What trip detection sees here"
        lat={openFac?.centroidLat}
        lng={openFac?.centroidLng}
        label={openFac ? openFac.facility?.name || openFac.name || 'Place' : ''}
        footer={
          openFac && onOpenPlace ? (
            <button
              type="button"
              className="pi-btn-quiet"
              onClick={() => {
                onOpenPlace(openFac._id);
                setOpenFac(null);
              }}
            >
              Open in full map
            </button>
          ) : null
        }
      >
        {openFac ? (
          <>
            <dl className="pi-fact">
              <dt>What trips see</dt>
              <dd>{roleText(openFac.facility || {}) || '—'}</dd>
            </dl>
            <dl className="pi-fact">
              <dt>Why</dt>
              <dd>
                {evidenceLines(openFac.facility || {}, roleOf(openFac.facility)).join('; ') || '—'}
              </dd>
            </dl>
            <dl className="pi-fact">
              <dt>On the map</dt>
              <dd>{poiText(openFac.poi) || '—'}</dd>
            </dl>
            <dl className="pi-fact">
              <dt>Stops</dt>
              <dd>{openFac.visitCount ?? '—'}</dd>
            </dl>
            <dl className="pi-fact">
              <dt>Coordinates</dt>
              <dd>{coord(openFac.centroidLat, openFac.centroidLng)}</dd>
            </dl>
          </>
        ) : null}
      </PlaceMapModal>
    </div>
  );
}
