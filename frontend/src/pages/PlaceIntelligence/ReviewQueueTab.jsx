import useApi from '../../hooks/useApi';
import PlaceLabel from '../../components/ui/PlaceLabel';
import EmptyState from '../../components/cluster/EmptyState';
import { formatNum } from '../../utils/formatters';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import PanelLoading from './PanelLoading';
import AnswerControls from './AnswerControls';
import useSiteAnswer from './useSiteAnswer';
import {
  EVIDENCE_LABEL,
  REASON_LABEL,
  messageOf,
  minutesLabel,
  suggestion,
  typeLabel,
} from './placeIntelligenceModel';

const CHIP =
  'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wide border';

/**
 * Places to ask about, most valuable answer first, plus a random ~10% of
 * already-answered places so the accuracy estimate is not biased.
 */
export default function ReviewQueueTab() {
  const { data, loading, error, refetch } = useApi(
    (signal) => PlaceIntelligenceService.reviewQueue({ limit: 50 }, { signal }),
    [],
  );
  const answer = useSiteAnswer(refetch);

  if (loading && !data) return <PanelLoading />;
  if (error)
    return (
      <EmptyState title="Review queue unavailable" hint={messageOf(error, 'Try again later')} />
    );
  const items = data?.items || [];
  if (!items.length) {
    return (
      <EmptyState title="Nothing to review" hint="Every place the engine found has an answer." />
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="oa-table">
        <thead>
          <tr>
            <th>Why asked</th>
            <th>Place</th>
            <th>Visits</th>
            <th>Typical stop</th>
            <th>Engine thinks</th>
            <th style={{ textAlign: 'right' }}>Your answer</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const s = item.site;
            const hint = suggestion(item);
            return (
              <tr key={s._id}>
                <td>
                  <span
                    className={`${CHIP} ${item.isAudit ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-amber-50 text-amber-900 border-amber-300'}`}
                  >
                    {REASON_LABEL[item.reason] || item.reason}
                  </span>
                </td>
                <td>
                  <div className="text-xs font-semibold text-slate-900">
                    {s.name || typeLabel(s.siteType)}
                  </div>
                  <PlaceLabel lat={s.centroidLat} lng={s.centroidLng} />
                </td>
                <td className="num font-mono font-bold">{formatNum(s.visitCount)}</td>
                <td className="num font-mono">{minutesLabel(s.medianDwellMin)}</td>
                <td>
                  {hint ? (
                    <span title={EVIDENCE_LABEL[hint.level]}>
                      {typeLabel(hint.siteType)}
                      {hint.confidence != null ? (
                        <span className="ml-1 text-slate-500 text-xs">({hint.confidence}%)</span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">Not sure yet</span>
                  )}
                </td>
                <td className="text-right">
                  <AnswerControls site={s} suggested={hint?.siteType} answer={answer} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
