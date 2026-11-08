import { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Phone, PlugZap } from 'lucide-react';
import Link from '@/components/redesign/FleetLink';
import ToneBadge from '@/components/redesign/ToneBadge';
import { formatIst } from '@/utils/redesign/format';
import { RECONNECT_PATH, trackLink } from '@/utils/redesign/links';
import { shiftYmd } from './intelligenceModel';
import { toISTDateString } from '../../utils/dateUtils';
import DataTooltip from '../../components/ui/DataTooltip';

function actionTarget(action) {
  if (!action) return null;
  if (action.to) return action.to;
  if (action.kind === 'RECONNECT') return RECONNECT_PATH;
  return null;
}

function ActionLink({ action, className = '' }) {
  const to = actionTarget(action);
  if (!to) return null;
  const Icon =
    action.kind === 'RECONNECT' ? PlugZap : action.kind === 'CALL_DEALER' ? Phone : MapPin;
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
function IssueDetail({ issue, showAdvice, showDetail }) {
  const evidence = issue?.evidence ?? [];
  const ownAction = issue?.action?.to ? issue.action : null;
  const fallbackMap =
    !ownAction && issue?.registrationNumber
      ? {
          kind: 'OPEN_REPLAY',
          label: 'See the truck on the map',
          to: trackLink({ reg: issue.registrationNumber }),
        }
      : null;
  return (
    <div className="intel-issue-detail">
      {showDetail && issue?.detail ? (
        <p className="intel-issue-detail-text">{issue.detail}</p>
      ) : null}
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
                <span className="intel-evidence-when">
                  {formatIst(entry?.at, { withDate: true })}
                </span>
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
const MEANINGS = {
  NO_DATA:
    'No recent vehicle readings were found by the reporting check. Inspect the account and tracker evidence to identify where the data gap begins.',
  GPS_FROZEN:
    'Position remained unchanged while other readings indicated movement. Check the recorded events before treating this as a GPS hardware fault.',
  GPS_JUMPS:
    'Position changes exceeded the detector’s plausibility checks. The linked replay shows the measurements behind each finding.',
  GPS_SILENT_MIDROAD:
    'The detector found a reporting gap during a run. Review the last position and subsequent readings.',
  FUEL_SENSOR_NOISY:
    'The detector found unstable tank readings. Review the sensor evidence before using these readings for fuel reconciliation.',
  FUEL_SENSOR_CALIBRATION:
    'Fuel measurements need calibration review against the recorded reference readings.',
  DEF_SENSOR:
    'The DEF check found readings requiring review. Sensor evidence is needed before attributing an SCR fault.',
  ACCOUNT_DISCONNECTED:
    'The connected telematics account needs attention. Vehicle reporting may depend on restoring that account.',
  ACCOUNT_EXPIRING:
    'Account access is approaching its reported expiry. Review the connection before access is interrupted.',
  WARNING_LAMP:
    'A vehicle warning lamp was reported. Review the specific lamp and its timestamp before arranging inspection.',
  BATTERY:
    'The battery check returned a finding. Inspect the reported voltage and operating conditions.',
  COOLANT:
    'The coolant check returned a temperature finding. Inspect the measurement and engine context.',
  SERVICE_DUE:
    'A recorded service interval or forecast needs attention. Review the odometer and due-date evidence.',
};

function ActivityCells({ issue, endDay }) {
  const observed = new Set(
    (issue.evidence || []).map((entry) => toISTDateString(entry.at)).filter(Boolean),
  );
  const last = toISTDateString(issue.lastSeenAt);
  if (last) observed.add(last);
  return (
    <span className="intel-issue-activity" aria-label="Recorded evidence over 14 days">
      {Array.from({ length: 14 }, (_, index) => {
        const day = shiftYmd(endDay, index - 13);
        return (
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            key={day}
            className={
              observed.has(day)
                ? 'intel-activity-cell intel-activity-cell--seen'
                : 'intel-activity-cell'
            }
            aria-label={`${day}: ${observed.has(day) ? 'Evidence recorded' : 'No dated evidence returned'}`}
          >
            <DataTooltip
              className={`intel-activity-tooltip${index > 6 ? ' intel-activity-tooltip--end' : ''}`}
              aria-hidden="true"
              label={day}
              details={[observed.has(day) ? 'Evidence recorded' : 'No dated evidence returned']}
            />
          </button>
        );
      })}
    </span>
  );
}

export default function IssueGroup({ group, to }) {
  const [openIds, setOpenIds] = useState(() => new Set());
  const rows = group.items;
  const headingId = `intel-issue-group-${group.kind}`;
  const endDay =
    toISTDateString(to ? `${String(to).slice(0, 10)}T12:00:00+05:30` : new Date()) ||
    toISTDateString(new Date());
  const columns = group.columns ?? [];
  const metric = columns[0];
  const step = group.sharedAction && !actionTarget(group.action) ? group.action?.label : null;
  const toggle = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <section className="intel-issue-group" aria-labelledby={headingId} data-tone={group.severity}>
      <div className="intel-issue-summary">
        <div className="intel-issue-certainty">
          <ToneBadge tone={group.severity} />
          <span>○ System finding</span>
        </div>
        <header className="intel-issue-group-head">
          <h3 id={headingId}>{group.label}</h3>
          <span className="intel-issue-group-count">
            <span>{group.countLabel}</span>
            {group.range ? (
              <>
                {' '}
                · <span>{group.range}</span>
              </>
            ) : null}
          </span>
        </header>
        <div className="intel-issue-meaning">
          <span>What it means</span>
          <p>
            {MEANINGS[group.kind] ||
              'Review each record’s measurements and evidence before confirming the cause.'}
          </p>
        </div>
        {group.advice ? (
          <p className="intel-issue-advice">
            <span>What to do</span>
            <span>{step ? `${step.replace(/[.!?]+$/, '')}.` : group.advice}</span>
          </p>
        ) : null}
        {group.sharedAction && actionTarget(group.action) ? (
          <div className="intel-issue-card-actions">
            <ActionLink action={group.action} className="intel-action--primary" />
          </div>
        ) : null}
        <small className="intel-issue-method">
          Activity cells show dated evidence only; unmarked days do not confirm that checks passed.
        </small>
      </div>
      <div className="intel-issue-records">
        <div
          className="intel-table-wrap intel-issue-scroll"
          role="region"
          aria-label={`${group.label} records`}
        >
          <table className="intel-table intel-reference-issue-table">
            <thead>
              <tr>
                <th className="intel-col-chevron">
                  <span className="sr-only">Open</span>
                </th>
                <th>{group.isAccount ? 'Account' : 'Truck'}</th>
                <th aria-label="Recorded evidence dates">
                  <span className="intel-activity-dates">
                    <span>
                      {
                        formatIst(`${shiftYmd(endDay, -13)}T12:00:00+05:30`, {
                          withDate: true,
                        }).split(',')[0]
                      }
                    </span>
                    <span>
                      {formatIst(`${endDay}T12:00:00+05:30`, { withDate: true }).split(',')[0]}
                    </span>
                  </span>
                </th>
                <th className="intel-num">{metric?.label || 'Occurrences'}</th>
                <th className="intel-num">{group.lastLabel || 'Last seen'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((issue) => {
                const subject = issue.registrationNumber || issue.accountName || issue.title;
                const open = openIds.has(issue.id);
                return (
                  <IssueRecord
                    key={issue.id}
                    issue={issue}
                    subject={subject}
                    open={open}
                    onToggle={() => toggle(issue.id)}
                    metric={metric}
                    columns={columns}
                    endDay={endDay}
                    sharedAdvice={Boolean(group.advice)}
                  />
                );
              })}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="intel-issue-no-results">
                    No records in this selection.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function IssueRecord({ issue, subject, open, onToggle, metric, columns, endDay, sharedAdvice }) {
  return (
    <>
      <tr className={`intel-row${open ? ' intel-row--open' : ''}`} onClick={onToggle}>
        <td className="intel-col-chevron">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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
        <td>
          <ActivityCells issue={issue} endDay={endDay} />
        </td>
        <td className="intel-num">
          {metric ? (metric.read(issue) ?? '—') : (issue.occurrences ?? '—')}
        </td>
        <td className="intel-num intel-when">{formatIst(issue.lastSeenAt, { withDate: true })}</td>
      </tr>
      {open ? (
        <tr className="intel-row-detail" aria-label={`${subject} evidence`}>
          <td colSpan={5}>
            <div className="intel-reference-detail">
              <div>
                <IssueDetail issue={issue} showAdvice={!sharedAdvice} showDetail />
                <span className="intel-issue-first-seen">
                  First seen {formatIst(issue.firstSeenAt, { withDate: true })} ·{' '}
                  {issue.occurrences ?? '—'} recorded occurrences
                </span>
                {columns.length > 1 ? (
                  <dl className="intel-issue-extra-metrics">
                    {columns.slice(1).map((column) => (
                      <div key={column.key}>
                        <dt>{column.label}</dt>
                        <dd>{column.read(issue) ?? '—'}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
              {issue.registrationNumber ? (
                <Link
                  className="intel-link intel-open-truck"
                  to={`/vehicles/${encodeURIComponent(issue.registrationNumber)}`}
                >
                  Open truck →
                </Link>
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
