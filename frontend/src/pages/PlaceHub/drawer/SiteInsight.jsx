import useApi from '../../../hooks/useApi';
import { num } from '../../../utils/formatMoney.js';
import { formatDateIST } from '../../../utils/dateUtils';
import {
  placeStats,
  riskSentence,
  tripDropNote,
  labelReviewNote,
} from '../intelligence/model/siteSummary.js';
import { minutesLabel } from '../intelligence/model/unitLabels.js';
import useSiteAnswer from '../intelligence/useSiteAnswer.js';
import PlaceVerdict from '../intelligence/PlaceVerdict.jsx';
import ReviewActions from '../intelligence/ReviewActions.jsx';
import EvidenceList from '../intelligence/EvidenceList.jsx';
import PurposeBar from '../intelligence/PurposeBar.jsx';
import FacilityCard from '../intelligence/FacilityCard.jsx';
import PlaceHubService from '../PlaceHubService.js';
import Note from './Note.jsx';
import Stats from './Stats.jsx';

/**
 * What the engine makes of a detected place, why, and the answer that teaches
 * it. The list's copy shows at once; the full record (evidence, facility, the
 * address looked up once) replaces it when it arrives.
 */
export default function SiteInsight({ place, canAnswer, onAnswered }) {
  const { data } = useApi(
    (signal) => PlaceHubService.siteDetail(place.sourceId, { signal }),
    [place.sourceId, place.raw],
  );
  const site =
    data?._id && String(data._id) === place.sourceId ? { ...place.raw, ...data } : place.raw;
  const answer = useSiteAnswer(onAnswered);
  const st = placeStats(site);
  const risk = riskSentence(site.risk, formatDateIST);
  const drops = tripDropNote(site);
  const contradiction = labelReviewNote(site);
  return (
    <>
      {contradiction && <Note tone="warn">{contradiction}</Note>}
      {drops && <Note tone="warn">{drops}</Note>}
      <section className="ph-section">
        <h3>What we think</h3>
        <PlaceVerdict site={site} />
        {risk && <Note tone="crit">{risk}</Note>}
      </section>
      {canAnswer && <ReviewActions key={site._id} site={site} answer={answer} />}
      <Stats
        items={[
          { label: 'Stops', value: st.visits == null ? '—' : num(st.visits) },
          { label: 'Different trucks', value: st.trucks == null ? '—' : num(st.trucks) },
          { label: 'Typical stop', value: minutesLabel(st.medianDwellMin) },
          { label: 'Long stops (1 in 10)', value: minutesLabel(st.p90DwellMin) },
          { label: 'First seen', value: st.firstSeenAt ? formatDateIST(st.firstSeenAt) : '—' },
          { label: 'Last seen', value: st.lastSeenAt ? formatDateIST(st.lastSeenAt) : '—' },
        ]}
      />
      <FacilityCard site={site} />
      <section className="ph-section">
        <h3>Why</h3>
        <EvidenceList engine={site.engine} />
      </section>
      <section className="ph-section">
        <h3>What trucks do here</h3>
        <PurposeBar engine={site.engine} />
      </section>
    </>
  );
}
