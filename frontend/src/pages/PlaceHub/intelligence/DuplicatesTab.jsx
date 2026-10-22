import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import useApi from '../../../hooks/useApi';
import useMutation from '../../../hooks/useMutation';
import { getUserRole } from '../../../utils/session';
import { useConfirm } from '../../../components/ui/confirmContext';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import SapRequestState from '../../Sap/SapRequestState';
import { canEditSap, kmText } from '../../Sap/sapModel';
import PlacePicker from '../../Sap/PlacePicker';
import DuplicateMap from './DuplicateMap';
import '../../Sap/Sap.css';
function MergeHistory({ survivorId, version, onChanged }) {
  const q = useApi(
    (signal) => PlaceIntelligenceService.listMerges(survivorId, { signal }),
    [survivorId, version],
  );
  const m = useMutation(PlaceIntelligenceService.undoMerge);
  const undo = async (id) => {
    try {
      await m.mutate(id);
      toast.success('Merge undone');
      q.refetch();
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not undo merge');
    }
  };
  const rows = Array.isArray(q.data) ? q.data : q.data?.records || [];
  return (
    <SapRequestState query={q}>
      <div className="sap-stack">
        {!rows.length && <p>No merge history for this place.</p>}
        {rows.map((r) => (
          <div className="sap-row" key={r._id}>
            <span>
              {(r.members || []).map((s) => s.name || s.siteId).join(', ') ||
                `${r.memberIds?.length || 0} places`}{' '}
              · {r.undoneAt ? 'Undone' : 'Merged'}
            </span>
            {canEditSap(getUserRole()) && !r.undoneAt && (
              <button
                className="sap-btn"
                type="button"
                disabled={m.loading}
                onClick={() => undo(r._id)}
              >
                Undo merge
              </button>
            )}
          </div>
        ))}
      </div>
    </SapRequestState>
  );
}
function DuplicatePair({ pair, onChanged }) {
  const { a, b } = pair;
  const [survivorId, setSurvivorId] = useState((a.visits ?? 0) >= (b.visits ?? 0) ? a._id : b._id);
  const m = useMutation(({ action, body }, options) =>
    PlaceIntelligenceService[action](body, options),
  );
  const confirm = useConfirm();
  const canEdit = canEditSap(getUserRole());
  const act = async (action, body) => {
    if (
      action === 'mergeSites' &&
      !(await confirm({
        title: 'Merge these places?',
        body: 'The selected survivor keeps the combined place history. You can undo this in Merge history.',
        confirmLabel: 'Merge places',
      }))
    )
      return;
    try {
      await m.mutate({ action, body });
      toast.success(action === 'mergeSites' ? 'Places merged' : 'Marked as different places');
      onChanged(survivorId);
    } catch (err) {
      toast.error(err?.message || 'Could not review places');
    }
  };
  return (
    <article className="sap-box">
      <div className="sap-row">
        <strong>
          {pair.verdict === 'LIKELY_SAME' ? 'Likely the same place' : 'Check these places'}
        </strong>
        <span>
          {pair.tripsAffected} trips affected ·{' '}
          {pair.distanceM == null ? '—' : `${Math.round(pair.distanceM)} m apart`} · Road:{' '}
          {kmText(pair.roadKm)}
        </span>
      </div>
      <div className="sap-row">
        {[a, b].map((s, i) => (
          <div key={s._id}>
            <Link
              className="sap-link"
              to={`/place-hub?place=${encodeURIComponent(`site:${s._id}`)}`}
            >
              {i ? 'B' : 'A'}: {s.name || 'Unnamed place'}
            </Link>
            <p>
              {s.siteType} · {s.status} · {s.visits ?? 0} visits
            </p>
          </div>
        ))}
      </div>
      <DuplicateMap a={a} b={b} />
      <p>
        Nearby mapped places: {pair.gem?.a?.name || 'Unknown'} ({pair.gem?.a?.m ?? '—'} m) /{' '}
        {pair.gem?.b?.name || 'Unknown'} ({pair.gem?.b?.m ?? '—'} m)
        {pair.gem?.sameGem ? ' · Same mapped place' : ''}
      </p>
      {canEdit && (
        <div className="sap-row">
          <label>
            Keep this place
            <select
              value={survivorId}
              onChange={(e) => setSurvivorId(e.target.value)}
              disabled={m.loading}
            >
              {[a, b].map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name || s._id} ({s.visits ?? 0} visits)
                </option>
              ))}
            </select>
          </label>
          <button
            className="sap-btn"
            type="button"
            disabled={m.loading}
            onClick={() =>
              act('mergeSites', { survivorId, memberIds: [survivorId === a._id ? b._id : a._id] })
            }
          >
            Merge
          </button>
          <button
            className="sap-btn"
            type="button"
            disabled={m.loading}
            onClick={() => act('distinctSites', { id: a._id, otherId: b._id })}
          >
            Different places
          </button>
        </div>
      )}
    </article>
  );
}
export default function DuplicatesTab({ version, onChanged }) {
  const q = useApi((signal) => PlaceIntelligenceService.duplicates({ signal }), [version]);
  const [survivorId, setSurvivorId] = useState('');
  const [historyVersion, setHistoryVersion] = useState(0);
  const changed = (id) => {
    if (id) setSurvivorId(id);
    setHistoryVersion((v) => v + 1);
    q.refetch();
    onChanged?.();
  };
  const pairs = Array.isArray(q.data) ? q.data : q.data?.pairs || q.data?.records || [];
  return (
    <section className="sap-panel">
      <h2>Same place?</h2>
      <p>Review nearby places using their visits, route distance and mapped-place evidence.</p>
      <SapRequestState query={q}>
        <div className="sap-stack">
          {!pairs.length && <p>No possible duplicates waiting for review.</p>}
          {pairs.map((pair) => (
            <DuplicatePair key={`${pair.a._id}:${pair.b._id}`} pair={pair} onChanged={changed} />
          ))}
        </div>
      </SapRequestState>
      <details className="sap-box">
        <summary>Merge history and undo</summary>
        <PlacePicker label="Find the surviving place" onChoose={setSurvivorId} />
        {/^[a-f0-9]{24}$/i.test(survivorId) && (
          <MergeHistory
            survivorId={survivorId}
            version={historyVersion}
            onChanged={() => changed()}
          />
        )}
      </details>
    </section>
  );
}
