import { ISSUE_GROUPS } from './intelligenceModel';

export default function IssuesBriefing({ briefing, onFilter }) {
  const filterKind = (kind) =>
    onFilter(ISSUE_GROUPS.find((group) => group.kinds.includes(kind))?.id || 'all');
  return (
    <section className="intel-briefing" aria-label="Issues briefing">
      <div className="intel-briefing-copy">
        <span className="intel-briefing-eyebrow">✧ Issues briefing</span>
        <p>
          {!briefing.highlights?.length ? 'No issue findings returned for this selection.' : null}
          {briefing.highlights?.map((item, index) => (
            <span key={item.kind}>
              {index ? ' ' : ''}
              <button onClick={() => filterKind(item.kind)}>
                {item.label}: {item.subjects}{' '}
                {item.vehicles === item.subjects
                  ? item.subjects === 1
                    ? 'truck'
                    : 'trucks'
                  : item.subjects === 1
                    ? 'subject'
                    : 'subjects'}
              </button>
              .
            </span>
          ))}
        </p>
        <span>
          {briefing.occurrences} recorded occurrences across {briefing.vehicles} trucks
          {briefing.accounts ? ` and ${briefing.accounts} accounts` : ''}, covering {briefing.kinds}{' '}
          issue kinds.
        </span>
        <small>{briefing.note}</small>
      </div>
      <div className="intel-briefing-kpis">
        {[
          ['Needs you', briefing.needsYou, 'Distinct subjects needing action', 'act'],
          ['Watch', briefing.watch, 'Distinct subjects to monitor', 'watch'],
          ['Trucks affected', briefing.vehicles, 'Distinct registrations', 'all'],
          ['Issue kinds', briefing.kinds, 'Grouped from issue records', 'all'],
        ].map(([label, value, note, filter]) => (
          <button key={label} onClick={() => onFilter(filter)}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
