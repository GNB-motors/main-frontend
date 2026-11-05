import { useApi } from '@/hooks/useApi';
import { formatDuration, formatNumber } from '@/utils/redesign/format';
import IntelligenceKpi from './IntelligenceKpi';
import IntelligenceService from './IntelligenceService';
import { ISSUE_GROUPS, groupIssuesByKind } from './intelligenceModel';

const sameReg = (a, b) =>
  String(a ?? '')
    .replace(/\s/g, '')
    .toUpperCase() ===
  String(b ?? '')
    .replace(/\s/g, '')
    .toUpperCase();

/** "8 trucks with no data" — the biggest reasons behind a count, in words. */
function reasonLine(items, max = 2) {
  const groups = groupIssuesByKind(items).slice(0, max);
  return groups.map((group) => `${group.label} on ${group.countLabel}`).join(' · ');
}

/** "GPS 43 · Engine lamps 7" — the watch list by what it is about. */
function groupLine(items, max = 2) {
  return ISSUE_GROUPS.map((group) => ({
    label: group.label,
    count: items.filter((issue) => group.kinds.includes(issue?.kind)).length,
  }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, max)
    .map((entry) => `${entry.label} ${entry.count}`)
    .join(' · ');
}

function useInstanceSummary(kind, { from, to, vehicle }) {
  const { data, loading, error } = useApi(
    (signal) =>
      IntelligenceService.getInstances({ kind, from, to, vehicle, page: 1, limit: 1, signal }),
    [kind, from, to, vehicle],
  );
  if (loading) return { state: 'loading' };
  if (error || !data || data.held || !data.summary) return { state: 'unknown', why: data?.why };
  return { state: 'ok', summary: data.summary };
}

/**
 * IntelligenceOverview — the five numbers at the top of the page.
 *
 * Every number is a real signal from the API: what needs the owner, how
 * many trucks are actually sending data, what to keep an eye on, and how
 * much speeding and off-route driving the period had. A tile opens the tab
 * that explains it.
 */
export default function IntelligenceOverview({
  summary,
  issues,
  issuesLoading = false,
  from,
  to,
  vehicle = '',
  onOpenTab,
}) {
  const overspeed = useInstanceSummary('overspeed', { from, to, vehicle });
  const detours = useInstanceSummary('detour', { from, to, vehicle });

  const issueItems = (issues?.items ?? []).filter(
    (issue) => !vehicle || sameReg(issue?.registrationNumber, vehicle),
  );
  const issuesKnown = Boolean(issues && !issues.held);
  const act = issueItems.filter((issue) => issue?.severity === 'act');
  const watch = issueItems.filter((issue) => issue?.severity === 'watch');
  const silent = groupIssuesByKind(issueItems.filter((issue) => issue?.kind === 'NO_DATA'))[0];
  const silentCount = silent?.count ?? 0;
  const fleetTrucks = summary?.fleet?.trucks;
  const disconnected = summary?.fleet?.disconnected ?? 0;

  const pending = issuesLoading ? 'Loading…' : 'Issues are not available yet';

  // Trucks reporting: the fleet minus the trucks that went silent.
  let reportingValue = null;
  let reportingSuffix = null;
  let reportingContext = pending;
  let reportingTone = 'info';
  if (issuesKnown && vehicle) {
    reportingValue = silentCount ? 'Silent' : 'Yes';
    reportingContext = silentCount ? silent.range : 'Sent data in the last day';
    reportingTone = silentCount ? 'act' : 'good';
  } else if (issuesKnown && Number.isFinite(fleetTrucks)) {
    reportingValue = formatNumber(Math.max(0, fleetTrucks - silentCount));
    reportingSuffix = `of ${formatNumber(fleetTrucks)}`;
    reportingContext = silentCount
      ? `${silent.countLabel} ${silent.range ?? 'silent'}`
      : 'Every truck sent data in the last day';
    if (disconnected > 0)
      reportingContext += ` · ${disconnected} on a disconnected account`;
  } else if (issuesKnown) {
    reportingContext = 'Fleet size not received';
  }

  const overspeedSummary = overspeed.summary;
  const detourSummary = detours.summary;
  const detourKm = String(detourSummary?.why?.text ?? '').match(/about ([\d.,]+) km/i)?.[1];

  return (
    <section aria-label="This period at a glance" className="intel-kpi-strip">
      <IntelligenceKpi
        label="Needs you"
        value={issuesKnown ? formatNumber(act.length) : null}
        tone={issuesKnown ? (act.length ? 'act' : 'good') : 'info'}
        context={
          issuesKnown ? (act.length ? reasonLine(act) : 'Nothing needs you right now') : pending
        }
        onOpen={() => onOpenTab?.('issues')}
        openLabel={`Needs you: ${act.length} open issues. Open the issues`}
      />
      <IntelligenceKpi
        label="Trucks reporting"
        value={reportingValue}
        suffix={reportingSuffix}
        tone={reportingTone}
        context={reportingContext}
        why={{
          text: 'A truck counts as silent when no reading has arrived for over a day while its telematics account is healthy, so the unit or its SIM has gone quiet.',
        }}
        onOpen={() => onOpenTab?.('issues')}
        openLabel="Trucks reporting. Open the issues"
      />
      <IntelligenceKpi
        label="To watch"
        value={issuesKnown ? formatNumber(watch.length) : null}
        tone={issuesKnown && watch.length ? 'watch' : 'info'}
        context={
          issuesKnown ? (watch.length ? groupLine(watch) : 'Nothing to watch') : pending
        }
        onOpen={() => onOpenTab?.('issues')}
        openLabel={`To watch: ${watch.length} open issues. Open the issues`}
      />
      <IntelligenceKpi
        label="Overspeed"
        value={overspeed.state === 'ok' ? formatNumber(overspeedSummary.count) : null}
        suffix={overspeed.state === 'ok' ? 'stretches' : null}
        tone={overspeed.state === 'ok' && overspeedSummary.count ? 'watch' : 'info'}
        context={
          overspeed.state === 'ok'
            ? overspeedSummary.totalMin != null
              ? `${formatDuration(overspeedSummary.totalMin)} over the limit`
              : 'Time over the limit not measured'
            : overspeed.state === 'loading'
              ? 'Loading…'
              : 'Not available for this period'
        }
        why={overspeedSummary?.why ?? null}
        onOpen={() => onOpenTab?.('overspeed')}
        openLabel="Overspeed. Open the overspeed list"
      />
      <IntelligenceKpi
        label="Detours"
        value={detours.state === 'ok' ? formatNumber(detourSummary.count) : null}
        suffix={detours.state === 'ok' ? 'runs' : null}
        tone="info"
        context={
          detours.state === 'ok'
            ? detourKm
              ? `${detourKm} km off the usual road`
              : 'Runs that left the usual road'
            : detours.state === 'loading'
              ? 'Loading…'
              : 'Not available for this period'
        }
        why={detourSummary?.why ?? null}
        onOpen={() => onOpenTab?.('detours')}
        openLabel="Detours. Open the detours list"
      />
    </section>
  );
}
