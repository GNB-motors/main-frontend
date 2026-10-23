import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GitMerge, Split } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../../../components/ui/button';
import useMutation from '../../../hooks/useMutation';
import { getUserRole } from '../../../utils/session';
import { useConfirm } from '../../../components/ui/confirmContext';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import { canEditSap, kmText } from '../../Sap/sapModel';
import DuplicateMap from './DuplicateMap';
export default function DuplicatePair({ pair, onChanged }) {
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
    <article
      className="sap-card sap-review-detail"
      id="duplicate-review-detail"
      aria-label="Selected place pair"
    >
      <div className="sap-stack">
        <h2>{pair.verdict === 'LIKELY_SAME' ? 'Likely the same place' : 'Compare these places'}</h2>
        <p className="sap-muted">Check the map and visit history before deciding.</p>
      </div>
      {[a, b].map((s) => (
        <div className="sap-place-option" key={s._id}>
          <span className="sap-place-letter">{s._id === a._id ? 'A' : 'B'}</span>
          <div className="sap-stack">
            <Link
              className="sap-link"
              to={`/place-hub?place=${encodeURIComponent(`site:${s._id}`)}`}
            >
              {s.name || 'Unnamed place'}
            </Link>
            <span className="sap-muted">
              {s.siteType?.replaceAll('_', ' ')} · {s.visits ?? 0} visits
              {s.status ? ` · ${s.status.toLowerCase()}` : ''}
            </span>
          </div>
        </div>
      ))}
      <DuplicateMap a={a} b={b} />
      <div className="sap-evidence">
        <div>
          <strong>{pair.distanceM == null ? '—' : `${Math.round(pair.distanceM)} m`}</strong>
          <span>STRAIGHT LINE</span>
        </div>
        <div>
          <strong>{kmText(pair.roadKm)}</strong>
          <span>BY ROAD</span>
        </div>
        <div>
          <strong>{pair.tripsAffected ?? '—'}</strong>
          <span>TRIPS AFFECTED</span>
        </div>
      </div>
      <div className="sap-stack">
        <h4>Nearby mapped places</h4>
        <p className="sap-muted">
          A: {pair.gem?.a?.name || 'Unknown'} ({pair.gem?.a?.m ?? '—'} m)
          <br />
          B: {pair.gem?.b?.name || 'Unknown'} ({pair.gem?.b?.m ?? '—'} m)
        </p>
        {pair.gem?.sameGem && (
          <span className="sap-pill sap-pill--within">Both point to the same mapped place</span>
        )}
      </div>
      {canEdit && (
        <>
          <fieldset className="sap-stack">
            <legend className="sap-muted">Keep this place</legend>
            {[a, b].map((s) => (
              <label className="sap-survivor-option" key={s._id}>
                <input
                  aria-label={`${s.name || 'Unnamed place'} (${s.visits ?? 0} visits)`}
                  type="radio"
                  name="survivor"
                  value={s._id}
                  checked={survivorId === s._id}
                  disabled={m.loading}
                  onChange={() => setSurvivorId(s._id)}
                />
                <span>
                  {s.name || 'Unnamed place'}
                  <span className="sap-cell-sub">{s.visits ?? 0} visits</span>
                </span>
              </label>
            ))}
          </fieldset>
          <Button
            disabled={m.loading}
            onClick={() =>
              act('mergeSites', { survivorId, memberIds: [survivorId === a._id ? b._id : a._id] })
            }
          >
            <GitMerge size={14} />
            Merge
          </Button>
          <Button
            variant="outline"
            disabled={m.loading}
            onClick={() => act('distinctSites', { id: a._id, otherId: b._id })}
          >
            <Split size={14} />
            Different places
          </Button>
          <p className="sap-muted">
            Merging combines history into the selected place. You can undo it below.
          </p>
        </>
      )}
    </article>
  );
}
