import { useState } from 'react';
import { toast } from 'react-toastify';
import { Layers } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { useMutation } from '../../../hooks/useMutation';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import PanelLoading from './PanelLoading';
import EmptyPanel from './EmptyPanel';
import { messageOf } from './placeIntelligenceModel';

// SYSTEM-confirmed regions are ones the learned model was sure of; they are
// re-checked nightly and a person can keep or reject them. Zones are the
// market areas drops are named after.
const STATUSES = [
  {
    key: 'PROPOSED',
    label: 'To review',
    params: { status: 'PROPOSED' },
    actions: ['CONFIRM', 'REJECT'],
  },
  {
    key: 'SYSTEM',
    label: 'Auto-confirmed',
    params: { status: 'CONFIRMED', decidedBy: 'SYSTEM' },
    actions: ['CONFIRM', 'REJECT'],
  },
  {
    key: 'CONFIRMED',
    label: 'Confirmed by you',
    params: { status: 'CONFIRMED', decidedBy: 'MANAGER' },
  },
  { key: 'REJECTED', label: 'Rejected', params: { status: 'REJECTED' } },
  { key: 'ZONES', label: 'Drop areas', params: { kind: 'ZONE', status: 'PROPOSED' }, zones: true },
];
const ACTION_LABEL = {
  CONFIRM: { PROPOSED: 'Confirm', SYSTEM: 'Keep' },
  REJECT: { PROPOSED: 'Reject', SYSTEM: 'Reject' },
};
const EVIDENCE_LABEL = {
  SHARED_POI: 'same plant on the map',
  COVISIT: 'trucks move between them',
  SPATIAL: 'close together',
};
const NAME_SOURCE = {
  REGISTER: 'your register',
  FACILITY: 'a confirmed drop place',
  OSM: 'map',
  GOOGLE: 'Google',
  MANAGER: 'you',
};

/**
 * Facility regions — nearby sites a truck treats as one place (e.g. a plant's
 * several gates). Proposed regions can be confirmed or rejected; the answer
 * teaches the system and the sites inherit the region.
 */
export default function RegionsView({ version, onChanged }) {
  const [status, setStatus] = useState('PROPOSED');
  const tab = STATUSES.find((s) => s.key === status);
  const { data, loading, error, refetch } = useApi(
    (signal) => PlaceIntelligenceService.listRegions({ ...tab.params, limit: 200 }, { signal }),
    [status, version],
  );
  const decideM = useMutation(PlaceIntelligenceService.decideRegion);

  const decide = async (id, decision) => {
    try {
      await decideM.mutate({ id, decision });
      toast.success(decision === 'CONFIRM' ? 'Region confirmed' : 'Region rejected');
      refetch();
      onChanged?.();
    } catch (e) {
      toast.error(e?.message || 'Could not update region');
    }
  };

  if (loading && !data) return <PanelLoading />;
  if (error)
    return (
      <EmptyPanel
        title="Could not load regions"
        hint={messageOf(error, 'Try again in a minute.')}
      />
    );

  const items = data?.items || [];

  return (
    <div>
      <div className="pi-filters" role="tablist" aria-label="Region status">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={status === s.key}
            className={status === s.key ? 'is-active' : ''}
            onClick={() => setStatus(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {tab.zones && items.length ? (
        <div className="pi-table-wrap">
          <table className="pi-table">
            <thead>
              <tr>
                <th>Drop area</th>
                <th>Named from</th>
                <th className="pi-num">Drops</th>
                <th className="pi-num">Radius</th>
              </tr>
            </thead>
            <tbody>
              {items.map((z) => (
                <tr key={z._id}>
                  <td>{z.name || 'Unnamed area'}</td>
                  <td>{NAME_SOURCE[z.nameSource] || '—'}</td>
                  <td className="pi-num">{z.memberCount ?? '—'}</td>
                  <td className="pi-num">
                    {z.radiusM != null ? `${(z.radiusM / 1000).toFixed(1)} km` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {tab.zones && items.length ? null : !items.length ? (
        <EmptyPanel
          Icon={Layers}
          title="No regions here"
          hint="A region groups nearby sites a truck treats as one place. They appear once enough co-visits are seen."
        />
      ) : (
        <div className="pi-table-wrap">
          <table className="pi-table">
            <thead>
              <tr>
                <th>Region</th>
                <th className="pi-num">Sites</th>
                <th className="pi-num">Spread</th>
                <th>Roles</th>
                <th>Why one place</th>
                {tab.actions ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id}>
                  <td>{r.name || `${r.memberCount || 0} sites`}</td>
                  <td className="pi-num">{r.memberCount ?? '—'}</td>
                  <td className="pi-num">
                    {r.diameterM != null ? `${Math.round(r.diameterM)} m` : '—'}
                  </td>
                  <td>{(r.roleSet || []).join(', ') || '—'}</td>
                  <td style={{ fontSize: 12 }}>
                    {EVIDENCE_LABEL[r.autoEvidence?.evidenceClass] ||
                      (r.coVisitScore != null ? `co-visit ${r.coVisitScore.toFixed(2)}` : '—')}
                    {r.autoEvidence?.p != null
                      ? ` · ${Math.round(r.autoEvidence.p * 100)}% sure`
                      : ''}
                    {r.poi?.match?.name ? ` · ${r.poi.match.name}` : ''}
                  </td>
                  {tab.actions ? (
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="pi-btn-quiet"
                          disabled={decideM.loading}
                          onClick={() => decide(r._id, 'CONFIRM')}
                        >
                          {ACTION_LABEL.CONFIRM[status] || 'Confirm'}
                        </button>
                        <button
                          type="button"
                          className="pi-btn-quiet"
                          disabled={decideM.loading}
                          onClick={() => decide(r._id, 'REJECT')}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
