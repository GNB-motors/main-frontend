import InfoTip from '@/components/redesign/InfoTip';
import Link from '@/components/redesign/FleetLink';
import { humanizeDates, ISSUE_KIND_META } from './intelligenceModel';

/** Old tab names some API links still use. */
const TAB_ALIASES = { 'report-cards': 'vehicles' };

/** The tab an in-page link points at, or null when it leaves the page. */
function inPageTab(to) {
  if (typeof to !== 'string' || !to.startsWith('/intelligence')) return null;
  const query = to.split('?')[1] ?? '';
  const tab = new URLSearchParams(query).get('tab');
  return tab ? (TAB_ALIASES[tab] ?? tab) : null;
}

/**
 * IntelligenceSummaryTiles — the extra findings the summary API sends.
 *
 * The API's tiles about a kind of issue repeat what the Issues tab already
 * groups, so only the other tiles are shown here, as one quiet line under
 * the numbers: "126 trucks graded · Report cards". Each opens where its
 * evidence lives and keeps its "how we know" one hover away.
 */
export default function IntelligenceSummaryTiles({ tiles = [], onOpenTab = null }) {
  const extra = tiles.filter((tile) => !Object.hasOwn(ISSUE_KIND_META, tile?.key));
  if (!extra.length) return null;

  return (
    <ul className="intel-insights" aria-label="Also this period">
      {extra.map((tile) => {
        const tab = inPageTab(tile?.link?.to);
        const body = (
          <>
            <b>{tile.value}</b>
            <span>{tile.label}</span>
          </>
        );
        return (
          <li key={tile.key} data-tone={tile.severity}>
            {tab && onOpenTab ? (
              <button type="button" className="intel-insight-hit" onClick={() => onOpenTab(tab)}>
                {body}
              </button>
            ) : tile?.link?.to ? (
              <Link to={tile.link.to} className="intel-insight-hit">
                {body}
              </Link>
            ) : (
              <span className="intel-insight-hit">{body}</span>
            )}
            {tile.why?.text ? (
              <InfoTip
                text={humanizeDates(tile.why.text)}
                basis={humanizeDates(tile.why.basis)}
                label={`About ${tile.label}`}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
