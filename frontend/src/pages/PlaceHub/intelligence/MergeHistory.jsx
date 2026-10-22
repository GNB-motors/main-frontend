import { toast } from 'react-toastify';
import { Undo2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import useApi from '../../../hooks/useApi';
import useMutation from '../../../hooks/useMutation';
import { getUserRole } from '../../../utils/session';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import SapRequestState from '../../Sap/SapRequestState';
import { canEditSap } from '../../Sap/sapModel';
export default function MergeHistory({ survivorId, version, onChanged }) {
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
        {!rows.length && <p className="sap-muted">No merge history for this place.</p>}
        {rows.map((r) => (
          <div className="sap-history-row" key={r._id}>
            <div className="sap-stack">
              <strong>
                {(r.members || []).map((s) => s.name || s.siteId).join(', ') ||
                  `${r.memberIds?.length || 0} places`}
              </strong>
              <span className="sap-muted">{r.undoneAt ? 'Undone' : 'Merged'}</span>
            </div>
            {canEditSap(getUserRole()) && !r.undoneAt && (
              <Button variant="outline" size="sm" disabled={m.loading} onClick={() => undo(r._id)}>
                <Undo2 size={13} />
                Undo merge
              </Button>
            )}
          </div>
        ))}
      </div>
    </SapRequestState>
  );
}
