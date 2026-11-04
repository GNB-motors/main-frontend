import { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Phone, PlugZap } from 'lucide-react';
import Link from '@/components/redesign/FleetLink';
import ToneBadge from '@/components/redesign/ToneBadge';
import { formatIst } from '@/utils/redesign/format';
import { RECONNECT_PATH, trackLink } from '@/utils/redesign/links';

/** Rows a group shows before "Show all": more for what needs the owner. */
const GROUP_ROW_LIMIT = { act: 8, watch: 4, info: 4, good: 4 };

function actionTarget(action) {
  if (!action) return null;
  if (action.to) return action.to;
  if (action.kind === 'RECONNECT') return RECONNECT_PATH;
  return null;
}

function ActionLink({ action, className = '' }) {
  const to = actionTarget(action);
  if (!to) return null;
  const Icon = action.kind === 'RECONNECT' ? PlugZap : action.kind === 'CALL_DEALER' ? Phone : MapPin;
  const label =
    action.label ||
    (action.kind === 'RECONNECT'
      ? 'Reconnect'
      : action.kind === 'CALL_DEALER'
        ? 'Call dealer'
        : 'See on map');
  const content = (
    <>
      <Icon size={14} aria-hidden="true" />
      {label}
    </>
  );
  if (String(to).startsWith('tel:')) {
    return (
      <a href={to} className={`intel-action ${className}`}>
        {content}
      </a>
    );
  }
  return (
    <Link to={to} className={`intel-action ${className}`}>
      {content}
    </Link>
  );
}

/** One open issue's details, shown under its row. */
function IssueDetail({ issue, showAdvice }) {
  const evidence = issue?.evidence ?? [];
  const ownAction = issue?.action?.to ? issue.action : null;
  const fallbackMap =
    !ownAction && issue?.registrationNumber
      ? { kind: 'OPEN_REPLAY', label: 'See the truck on the map', to: trackLink({ reg: issue.registrationNumber }) }
      : null;
  return (
    <div className="intel-issue-detail">
      <p className="intel-issue-detail-text">{issue?.detail}</p>
      {showAdvice && issue?.advice ? (
        <p className="intel-issue-detail-text">
          <span className="font-semibold text-[var(--rd-ink)]">What to do: </span>
          {issue.advice}
        </p>
      ) : null}
      {evidence.length ? (
        <ul className="intel-evidence" aria-label="Evidence">
          {evidence.map((entry, index) => (
            <li key={`${entry?.at ?? index}-${index}`}>
              {/* The time is the link: no "Open on the map" repeated per line. */}
              {entry?.link?.to ? (
                <Link
                  to={entry.link.to}
                  className="intel-evidence-when intel-link"
                  aria-label={`Open on the map: ${formatIst(entry?.at, { withDate: true })}`}
                >
                  {formatIst(entry?.at, { withDate: true })}
                </Link>
              ) : (
                <span className="intel-evidence-when">{formatIst(entry?.at, { withDate: true })}</span>
              )}
              <span className="intel-evidence-text">{entry?.text}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <ActionLink action={ownAction ?? fallbackMap} />
      </div>
    </div>
  );
}

/**
 * IssueGroup — every open issue of one kind, as one card.
 *
 * "No data · 8 trucks" with a compact table of the trucks, instead of eight
 * cards that each repeat the same advice. The advice is said once, in the
 * header; a row opens to its own detail, evidence and map link.
 */
export default function IssueGroup({ group }) {
  const [openIds, setOpenIds] = useState(() => new Set());
  const [showAll, setShowAll] = useState(false);

  const columns = group.columns ?? [];
  const limit = GROUP_ROW_LIMIT[group.severity] ?? 4;
  const rows = showAll ? group.items : group.items.slice(0, limit);
  const hidden = group.items.length - rows.length;
  const headingId = `intel-issue-group-${group.kind}`;
  const headerAction = group.sharedAction ? actionTarget(group.action) : null;
  // A step with nowhere to go ("Check the tracker's power and SIM") is still
  // the step: it leads the advice instead of becoming a dead button.
  const step = group.sharedAction && !headerAction ? group.action?.label : null;
  // With kind-specific columns the numbers sit together on the left and a
  // filler column takes the spare width; with the detail as the column, the
  // detail takes it.
  const filler = columns.length > 0;
  const colSpan = 4 + Math.max(columns.length, 1) + (group.mixedSeverity ? 1 : 0) + (filler ? 1 : 0);

  const toggle = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section className="intel-issue-group" aria-labelledby={headingId} data-tone={group.severity}>
      <header className="intel-issue-group-head">
        <div className="intel-issue-group-title">
          <span className="intel-dot" data-tone={group.severity} aria-hidden="true" />
          <h3 id={headingId}>{group.label}</h3>
          <span className="intel-issue-group-count">{group.countLabel}</span>
          {group.range ? <span className="intel-issue-group-range">{group.range}</span> : null}
        </div>
        <div className="flex items-center gap-2">
          {group.mixedSeverity ? null : <ToneBadge tone={group.severity} />}
          {headerAction ? <ActionLink action={group.action} className="intel-action--primary" /> : null}
        </div>
      </header>

      {group.advice ? (
        <p className="intel-issue-advice">
          <span className="font-semibold text-[var(--rd-ink)]">What to do: </span>
          {step ? <span className="font-semibold text-[var(--rd-ink)]">{`${step}. `}</span> : null}
          {group.advice}
        </p>
      ) : null}

      <div className="intel-table-wrap">
        <table className="intel-table">
          <thead>
            <tr>
              <th scope="col" className="intel-col-chevron">
                <span className="sr-only">Open</span>
              </th>
              <th scope="col" className="intel-col-subject">
                {group.isAccount ? 'Account' : 'Truck'}
              </th>
              {columns.length ? (
                columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`intel-col-measure${col.numeric ? ' intel-num' : ''}`}
                  >
                    {col.label}
                  </th>
                ))
              ) : (
                <th scope="col">What we saw</th>
              )}
              {group.mixedSeverity ? <th scope="col">Severity</th> : null}
              <th scope="col" className="intel-num intel-col-when">
                {group.firstLabel ?? 'First seen'}
              </th>
              <th scope="col" className="intel-num intel-col-when">
                {group.lastLabel ?? 'Last seen'}
              </th>
              {filler ? <th scope="col" aria-hidden="true" className="intel-col-fill" /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((issue) => {
              const open = openIds.has(issue.id);
              const subject = issue?.registrationNumber || issue?.accountName || issue?.title;
              return (
                <IssueRows
                  key={issue.id}
                  issue={issue}
                  open={open}
                  subject={subject}
                  columns={columns}
                  mixedSeverity={group.mixedSeverity}
                  colSpan={colSpan}
                  filler={filler}
                  showAdvice={!group.advice}
                  onToggle={() => toggle(issue.id)}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {group.items.length > limit ? (
        <button type="button" className="intel-show-all" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show fewer' : `Show all ${group.items.length}`}
          {hidden > 0 ? <span className="text-[var(--rd-ink-3)]">{`(${hidden} more)`}</span> : null}
        </button>
      ) : null}
    </section>
  );
}

function IssueRows({
  issue,
  open,
  subject,
  columns,
  mixedSeverity,
  colSpan,
  filler,
  showAdvice,
  onToggle,
}) {
  return (
    <>
      <tr className={`intel-row${open ? ' intel-row--open' : ''}`} onClick={onToggle}>
        <td className="intel-col-chevron">
          {open ? (
            <ChevronDown size={14} aria-hidden="true" />
          ) : (
            <ChevronRight size={14} aria-hidden="true" />
          )}
        </td>
        <td className="intel-subject">
          <button
            type="button"
            aria-expanded={open}
            aria-label={`${subject}: ${open ? 'hide' : 'show'} details`}
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
          >
            {subject}
          </button>
        </td>
        {columns.length ? (
          columns.map((col) => (
            <td key={col.key} className={col.numeric ? 'intel-num' : ''}>
              {col.read(issue) ?? '—'}
            </td>
          ))
        ) : (
          <td className="intel-truncate" title={issue?.detail}>
            {issue?.detail}
          </td>
        )}
        {mixedSeverity ? (
          <td>
            <ToneBadge tone={issue?.severity ?? 'info'} />
          </td>
        ) : null}
        <td className="intel-num intel-when">{formatIst(issue?.firstSeenAt, { withDate: true })}</td>
        <td className="intel-num intel-when">{formatIst(issue?.lastSeenAt, { withDate: true })}</td>
        {filler ? <td aria-hidden="true" /> : null}
      </tr>
      {open ? (
        <tr className="intel-row-detail">
          <td colSpan={colSpan}>
            <IssueDetail issue={issue} showAdvice={showAdvice} />
          </td>
        </tr>
      ) : null}
    </>
  );
}
