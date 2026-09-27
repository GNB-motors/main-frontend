import { ExternalLink, ShieldAlert } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { formatDateIST } from '../../utils/dateUtils';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import TypeBadge from './TypeBadge';
import StateChip from './StateChip';
import EvidenceList from './EvidenceList';
import PurposeBar from './PurposeBar';
import ReviewActions from './ReviewActions';
import PlaceVerdict from './PlaceVerdict';
import {
  effectiveType,
  minutesLabel,
  placeStats,
  placeSubtitle,
  placeTitle,
  riskSentence,
} from './placeIntelligenceModel';

/**
 * One place, opened: what it is, why we think so, how busy it is, what went
 * wrong there — and the answer buttons. The list's copy shows instantly; the
 * full record (with an address looked up once, on demand) replaces it.
 */
export default function PlaceDetail({ siteId, fallback, version, answer }) {
  const { data } = useApi(
    (signal) => PlaceIntelligenceService.getSite(siteId, { signal }),
    [siteId, version],
  );
  const site = data?.site?._id === siteId ? { ...fallback, ...data.site } : fallback;
  if (!site) return null;
  const { type } = effectiveType(site);
  const st = placeStats(site);
  const riskText = riskSentence(site.risk, formatDateIST);
  const lat = site.centroidLat;
  const lng = site.centroidLng;
  return (
    <section className="pi-detail" aria-label={placeTitle(site)}>
      <header className="pi-detail-head">
        <TypeBadge type={type} hollow={site.status !== 'CONFIRMED'} large />
        <div className="pi-detail-head-main">
          <h3>{placeTitle(site)}</h3>
          <p>{placeSubtitle(site)}</p>
          <div className="pi-detail-links">
            <StateChip site={site} />
            <a
              className="pi-link"
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>
      <div className="pi-detail-sec">
        <h4 className="pi-section-title">What we think</h4>
        <PlaceVerdict site={site} />
        <h4 className="pi-section-title">Why</h4>
        <EvidenceList engine={site.engine} />
        {riskText ? (
          <div className="pi-callout pi-callout--crit">
            <ShieldAlert size={15} aria-hidden="true" />
            <span>{riskText}</span>
          </div>
        ) : null}
      </div>
      <ReviewActions key={site._id} site={site} answer={answer} />
      <div className="pi-detail-sec">
        <h4 className="pi-section-title">What trucks do here</h4>
        <PurposeBar engine={site.engine} />
        <dl className="pi-stats">
          <div className="pi-stat">
            <dt>Stops</dt>
            <dd>{st.visits ?? '—'}</dd>
          </div>
          <div className="pi-stat">
            <dt>Different trucks</dt>
            <dd>{st.trucks ?? '—'}</dd>
          </div>
          <div className="pi-stat">
            <dt>Typical stop</dt>
            <dd>{minutesLabel(st.medianDwellMin)}</dd>
          </div>
          <div className="pi-stat">
            <dt>Long stops (1 in 10)</dt>
            <dd>{minutesLabel(st.p90DwellMin)}</dd>
          </div>
          <div className="pi-stat">
            <dt>First seen</dt>
            <dd>{st.firstSeenAt ? formatDateIST(st.firstSeenAt) : '—'}</dd>
          </div>
          <div className="pi-stat">
            <dt>Last seen</dt>
            <dd>{st.lastSeenAt ? formatDateIST(st.lastSeenAt) : '—'}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
