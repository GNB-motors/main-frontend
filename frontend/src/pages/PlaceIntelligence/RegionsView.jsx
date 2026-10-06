import { useState } from 'react';
import { toast } from 'react-toastify';
import { Layers } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import PanelLoading from './PanelLoading';
import EmptyPanel from './EmptyPanel';
import { messageOf } from './placeIntelligenceModel';

const STATUSES = [
  { key: 'PROPOSED', label: 'To review' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'REJECTED', label: 'Rejected' },
];

/**
 * Facility regions — nearby sites a truck treats as one place (e.g. a plant's
 * several gates). Proposed regions can be confirmed or rejected; the answer
 * teaches the system and the sites inherit the region.
 */
export default function RegionsView({ version, onChanged }) {
  const [status, setStatus] = useState('PROPOSED');
  const { data, loading, error, refetch } = useApi(
    (signal) => PlaceIntelligenceService.listRegions({ status, limit: 200 }, { signal }),
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

      {!items.length ? (
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
                <th className="pi-num">Co-visit</th>
                {status === 'PROPOSED' ? <th>Actions</th> : null}
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
                  <td className="pi-num">
                    {r.coVisitScore != null ? r.coVisitScore.toFixed(2) : '—'}
                  </td>
                  {status === 'PROPOSED' ? (
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="pi-btn-quiet"
                          disabled={decideM.loading}
                          onClick={() => decide(r._id, 'CONFIRM')}
                        >
                          Confirm
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
