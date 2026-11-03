import { useState } from 'react';
import { AlertTriangle, CircleCheck, Inbox } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import SectionCard from '@/components/redesign/SectionCard';
import InfoTip from '@/components/redesign/InfoTip';
import IntelligenceDataState from './IntelligenceDataState';
import IssueCard from './IssueCard';
import IntelligenceService from './IntelligenceService';
import { ISSUE_GROUPS, issueCounts, isAccountIssue, issuesWithFilter } from './intelligenceModel';

/**
 * IssuesTab — the open problems, grouped by what they are.
 *
 * The good news is that there may be none: an empty list here is a green
 * card, not a sad one. Every issue carries the advice the backend gave and a
 * way to look at the moment it happened.
 */
export default function IssuesTab({ from, to }) {
  const [filter, setFilter] = useState('all');

  const { data, loading, error, refetch } = useApi(
    (signal) => IntelligenceService.getIssues({ from, to, signal }),
    [from, to],
  );

  const held = data?.held ? data.why : null;
  const items = data?.items ?? [];
  const counts = issueCounts(items);
  const shown = issuesWithFilter(items, filter);
  const groups = ISSUE_GROUPS.filter((group) => (counts.groups[group.id] ?? 0) > 0);

  const chips = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'act', label: 'Needs you', count: counts.act },
    { id: 'watch', label: 'Watch', count: counts.watch },
  ];

  // The count chips mean something only once there is a list: never "All 0"
  // above a list that is still loading, missing or held back.
  const hasList = !loading && !error && !held;

  return (
    <div className="flex flex-col gap-3">
      {hasList ? (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              aria-pressed={filter === chip.id}
              onClick={() => setFilter(chip.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)] ${
                filter === chip.id
                  ? 'border-[var(--rd-brand-2)] bg-[var(--rd-brand-tint)] text-[var(--rd-brand-2)]'
                  : 'border-[var(--rd-line)] bg-[var(--rd-card)] text-[var(--rd-ink-2)] hover:border-[var(--rd-line-strong)]'
              }`}
            >
              {chip.label}
              <span className="tabular-nums">{chip.count}</span>
            </button>
          ))}

          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              aria-pressed={filter === group.id}
              onClick={() => setFilter(group.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)] ${
                filter === group.id
                  ? 'border-[var(--rd-brand-2)] bg-[var(--rd-brand-tint)] text-[var(--rd-brand-2)]'
                  : 'border-[var(--rd-line)] bg-[var(--rd-card)] text-[var(--rd-ink-2)] hover:border-[var(--rd-line-strong)]'
              }`}
            >
              {group.label}
              <span className="tabular-nums">{counts.groups[group.id]}</span>
              {group.info ? (
                <InfoTip text={group.info.text} label={`About ${group.label} issues`} />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      <IntelligenceDataState
        loading={loading}
        error={error}
        held={held}
        isEmpty={shown.length === 0}
        emptyMessage={
          filter === 'all'
            ? 'No open issues. All trucks are reporting and no sensor problems were seen in this period.'
            : 'Nothing in this group for this period.'
        }
        emptyTone={filter === 'all' ? 'good' : 'info'}
        emptyIcon={filter === 'all' ? CircleCheck : Inbox}
        what="The issues list"
        onRetry={refetch}
      >
        <SectionCard
          icon={AlertTriangle}
          tone={counts.act > 0 ? 'act' : 'good'}
          title={filter === 'all' ? 'Open issues' : 'Open issues in this group'}
          info={{
            text: 'Every issue here was found by comparing your trucks with each other. The advice is what the system suggests, not a diagnosis.',
          }}
        >
          <div className="flex flex-col gap-3">
            {shown.map((issue) => (
              <IssueCard key={issue.id} issue={issue} pinned={isAccountIssue(issue)} />
            ))}
          </div>
        </SectionCard>
      </IntelligenceDataState>
    </div>
  );
}
