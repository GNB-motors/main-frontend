import { formatNumber } from '@/utils/redesign/format';
import ReportCardsBriefing from './ReportCardsBriefing';
import { cardsBriefing } from './reportCardsBriefingModel';

/** Show the coverage the API can support until performance scores are available. */
export default function DriverCardsBriefing({ cards, onGrade }) {
  if (cardsBriefing(cards).graded) {
    return <ReportCardsBriefing cards={cards} subject="driver" onGrade={onGrade} />;
  }
  const measured = cards.filter((card) => Number.isFinite(card.kmInPeriod));
  const knownTrucks = cards.every((card) => Array.isArray(card.assignmentCoverage?.trucks));
  const trucks = new Set(cards.flatMap((card) => card.assignmentCoverage?.trucks || []));
  const km = measured.reduce((sum, card) => sum + card.kmInPeriod, 0);
  return (
    <section className="intel-assessment-briefing" aria-label="Driver briefing">
      <div className="intel-assessment-brief-copy">
        <span>✧ Period read</span>
        <p>
          <b>{formatNumber(cards.length)}</b> drivers have records in this period.{' '}
          {measured.length ? (
            <>
              <b>{formatNumber(measured.length)}</b> have measured distance on fully assigned
              days.{' '}
            </>
          ) : (
            'Assigned driving distance has not been measured yet. '
          )}
          <button type="button" onClick={() => onGrade('NOT_ENOUGH_DATA')}>
            Performance scores are not available yet
          </button>
          .
        </p>
        <small>
          Assignment coverage is not a driving-quality assessment. Distance excludes partial
          assignment days; missing readings are not counted as zero.
        </small>
      </div>
      <div className="intel-assessment-brief-kpis">
        {[
          ['Drivers', formatNumber(cards.length), 'With records in this period', 'all'],
          [
            'Measured distance',
            measured.length ? `${formatNumber(km)} km` : '—',
            `${measured.length} drivers with measured distance`,
            'all',
          ],
          [
            'Assigned trucks',
            knownTrucks ? formatNumber(trucks.size) : '—',
            'Distinct trucks in assignment records',
            'all',
          ],
          [
            'Insufficient data',
            formatNumber(cards.length),
            'Performance score unavailable',
            'NOT_ENOUGH_DATA',
          ],
        ].map(([label, value, note, grade]) => (
          <button type="button" key={label} onClick={() => onGrade(grade)}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
