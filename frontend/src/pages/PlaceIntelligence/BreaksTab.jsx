import { useState } from 'react';
import { toast } from 'react-toastify';
import useApi from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import PlaceLabel from '../../components/ui/PlaceLabel';
import EmptyState from '../../components/cluster/EmptyState';
import { formatDateTimeIST } from '../../utils/dateUtils';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import PanelLoading from './PanelLoading';
import { PURPOSE_LABEL, messageOf, minutesLabel } from './placeIntelligenceModel';

/** The manager's three buttons (plan §4): each answer is evidence for that stop. */
const ANSWERS = [
  { purpose: 'REST', label: 'Rest / meal' },
  { purpose: 'LOAD', label: 'Work stop' },
  { purpose: 'SERVICE', label: 'Repair' },
];

/** Stops nothing explains, that are not statutory rest or a queue, over the threshold. */
export default function BreaksTab() {
  const { data, loading, error, refetch } = useApi(
    (signal) => PlaceIntelligenceService.listBreaks({ limit: 100 }, { signal }),
    [],
  );
  const tag = useMutation(PlaceIntelligenceService.tagStop);
  const [busyId, setBusyId] = useState(null);

  const answer = async (stop, purpose) => {
    setBusyId(stop._id);
    try {
      await tag.mutate({ id: stop._id, purpose });
      toast.success(`Marked as ${PURPOSE_LABEL[purpose]}`);
      refetch();
    } catch (err) {
      toast.error(messageOf(err, 'Could not save'));
    } finally {
      setBusyId(null);
    }
  };

  if (loading && !data) return <PanelLoading />;
  if (error)
    return <EmptyState title="Breaks unavailable" hint={messageOf(error, 'Try again later')} />;
  const records = data?.records || [];
  if (!records.length) {
    return (
      <EmptyState
        title="No unproductive breaks this week"
        hint="Stops with no explanation, not statutory rest and not a queue show up here."
      />
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="oa-table">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>When</th>
            <th>How long</th>
            <th>Where</th>
            <th style={{ textAlign: 'right' }}>What was it?</th>
          </tr>
        </thead>
        <tbody>
          {records.map((s) => (
            <tr key={s._id}>
              <td className="font-mono text-xs font-bold">{s.registrationNumber}</td>
              <td className="text-xs">{formatDateTimeIST(s.startAt)}</td>
              <td className="num font-mono">{minutesLabel(s.dwellMinutes)}</td>
              <td>
                <PlaceLabel lat={s.lat} lng={s.lng} />
              </td>
              <td className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {ANSWERS.map((a) => (
                    <button
                      type="button"
                      key={a.purpose}
                      className="oa-ack-action"
                      disabled={busyId === s._id}
                      onClick={() => answer(s, a.purpose)}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
