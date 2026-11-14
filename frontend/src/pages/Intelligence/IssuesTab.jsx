import '../Vehicle360/panels/overview/referenceOverview.css';
import { briefingFromIssues, matchesIssueSearch } from './issuesBriefingModel';
import IssuesBriefing from './IssuesBriefing';
import './issuesCards.css';
import useUrlFilter from '@/hooks/useUrlFilter';
import { CircleCheck, Inbox, Search } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import IntelligenceDataState from './IntelligenceDataState';
import IssueGroup from './IssueGroup';
import IntelligenceService from './IntelligenceService';
import {
  ISSUE_GROUPS,
  groupIssuesByKind,
  issueCounts,
  issuesWithFilter,
} from './intelligenceModel';

const sameReg = (a, b) =>
  String(a ?? '')
    .replace(/\s/g, '')
    .toUpperCase() ===
  String(b ?? '')
    .replace(/\s/g, '')
    .toUpperCase();

function Chip({ active, onClick, label, count }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className="intel-chip">
      {label}
      <span className="tabular-nums">{count}</span>
    </button>
  );
}

/**
 * IssuesTab — the open problems, one card per kind.
 *
 * Eight trucks that went silent are one problem with eight rows, not eight
 * cards that repeat the same advice. What needs the owner comes first, then
 * what to watch. The chips narrow the list by tone or by what the issue is
 * about. An empty list is a green line, not a sad one.
 */
export default function IssuesTab({ from, to, vehicle = '', kind = '' }) {
  const [filter, setFilter] = useUrlFilter('issueFilter', 'all', [
    'all',
    'act',
    'watch',
    ...ISSUE_GROUPS.map((group) => group.id),
  ]);
  const [search, setSearch] = useUrlFilter('issueSearch');

  const { data, loading, error, refetch } = useApi(
    (signal) =>
      IntelligenceService.getIssues({
        from,
        to,
        signal,
        ...(vehicle ? { vehicle } : {}),
        ...(kind ? { kind } : {}),
      }),
    [from, to, vehicle, kind],
  );

  const held = data?.held ? data.why : null;
  const items = (data?.items ?? []).filter(
    (issue) =>
      (!vehicle || sameReg(issue.registrationNumber, vehicle)) && (!kind || issue.kind === kind),
  );
  const counts = issueCounts(items);
  const shown = issuesWithFilter(items, filter).filter((issue) =>
    matchesIssueSearch(issue, search),
  );
  const groups = groupIssuesByKind(shown);
  const chipGroups = ISSUE_GROUPS.filter(
    (group) => (counts.groups[group.id] ?? 0) > 0 || group.id === filter,
  );

  // The count chips mean something only once there is a list: never "All 0"
  // above a list that is still loading, missing or held back.
  const hasList = !loading && !error && !held;

  return (
    <div className="intel-issues-layout flex flex-col gap-4">
      <header className="intel-issues-heading">
        <h2>Issues</h2>
        <p>
          Problems with trucks, sensors or accounts, found by scanning every reading. Each truck
          appears once per issue.
        </p>
      </header>
      {hasList ? (
        <IssuesBriefing
          briefing={data?.briefing || briefingFromIssues(items)}
          onFilter={setFilter}
        />
      ) : null}
      <div className="intel-issues-toolbar">
        {hasList && (counts.all > 0 || filter !== 'all') ? (
          <div className="intel-chip-row" role="group" aria-label="Filter the issues">
            <Chip
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              label="All"
              count={counts.all}
            />
            <Chip
              active={filter === 'act'}
              onClick={() => setFilter('act')}
              label="Needs you"
              count={counts.act}
            />
            <Chip
              active={filter === 'watch'}
              onClick={() => setFilter('watch')}
              label="Watch"
              count={counts.watch}
            />
            <span className="intel-chip-sep" aria-hidden="true" />
            {chipGroups.map((group) => (
              <span className="inline-flex items-center gap-0.5" key={group.id}>
                <Chip
                  active={filter === group.id}
                  onClick={() => setFilter(filter === group.id ? 'all' : group.id)}
                  label={group.label}
                  count={counts.groups[group.id]}
                />
              </span>
            ))}
          </div>
        ) : null}

        {hasList ? (
          <div className="intel-issues-search-row">
            <label className="intel-issue-search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search vehicle or anything…"
                aria-label="Search all issues"
              />
            </label>
          </div>
        ) : null}
      </div>

      <IntelligenceDataState
        loading={loading}
        error={error}
        held={held}
        isEmpty={shown.length === 0}
        emptyMessage={
          search.trim()
            ? `No issues match “${search}”.`
            : filter === 'all'
              ? 'No open issues returned for this selection. This does not confirm that every truck is reporting.'
              : 'Nothing in this group for this period.'
        }
        emptyTone={filter === 'all' ? 'good' : 'info'}
        emptyIcon={filter === 'all' ? CircleCheck : Inbox}
        what="The issues list"
        onRetry={refetch}
      >
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <IssueGroup key={group.kind} group={group} from={from} to={to} />
          ))}
        </div>
      </IntelligenceDataState>
    </div>
  );
}
