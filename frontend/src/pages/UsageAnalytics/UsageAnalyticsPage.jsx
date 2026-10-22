import React from 'react';
import PageShell from '../../components/ui/PageShell.jsx';
import EmptyState from '../../components/cluster/EmptyState.jsx';
import KpiCard from '../../components/ui/KpiCard.jsx';
import { getUsageSummary } from '../../services/UsageAnalyticsService.js';
import { summarize, buildSurfaceRows, measurementNote, recentDays, pathLabel } from './usageModel.js';

/**
 * Screen Usage — item 26.1, the page that makes the navigation cut arguable.
 *
 * It shows the org's OWN numbers and the sentence the server wrote for each
 * verdict. It does not show a percentage of anything, because every boundary
 * here is a self-learned median of this org's own behaviour and a percentage
 * built on one reads as an accuracy claim when it is only a description.
 *
 * It also shows nothing about individuals. The data behind these rows is
 * per-surface and per-role; there is no per-person number to display because
 * there is no endpoint that would return one.
 */
export default function UsageAnalyticsPage() {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    getUsageSummary()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Could not load usage');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const view = summarize(data);
  const rows = buildSurfaceRows(data?.surfaces || []);
  const days = recentDays(data?.daily || []);

  return (
    <PageShell
      title="Screen Usage"
      subtitle="Which screens your organization opens — the evidence behind the menu"
      count={rows.length || null}
      freshnessAt={data?.computedAt || null}
    >
      {loading ? <p className="text-[13px]">Reading your usage…</p> : null}

      {error ? (
        <EmptyState
          title="Usage could not be loaded"
          hint="Nothing has been hidden from the menu because of this — a missing number is never a reason to remove a screen. Try again once the service answers."
        />
      ) : null}

      {!loading && !error ? (
        <>
          <p className="text-[13px] max-w-[70ch]" style={{ color: 'var(--ds-ink2)' }}>
            {measurementNote(data)}
          </p>

          <div className="grid gap-3 mt-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
            <KpiCard title="Opens recorded" value={view.totalViews} accent="#2563eb" />
            <KpiCard title="User-days" value={view.userDays} accent="#0891b2" />
            <KpiCard title="Screens kept in the menu" value={view.usedCount} accent="#16a34a" />
            <KpiCard title="Screens folded into a job" value={view.foldedCount} accent="#ea580c" />
          </div>

          {days.length ? (
            <section className="mt-5">
              <h2 className="text-[14px] font-semibold">Last {days.length} recorded days</h2>
              <ul className="mt-2 flex items-end gap-1" style={{ listStyle: 'none', padding: 0 }}>
                {days.map((d) => (
                  <li
                    key={d.day}
                    title={`${d.day}: ${d.views} opens, ${d.followOn} led somewhere else`}
                    style={{
                      height: `${Math.max(4, Math.min(64, (d.views / Math.max(1, ...days.map((x) => x.views))) * 64))}px`,
                      width: 18,
                      background: 'var(--ds-accent, #f97316)',
                      borderRadius: 3,
                    }}
                  />
                ))}
              </ul>
              <p className="text-[12px]" style={{ color: 'var(--ds-ink2)' }}>
                {days[0].day} → {days[days.length - 1].day}
              </p>
            </section>
          ) : null}

          {rows.length ? (
            <table className="mt-5 w-full text-[13px]">
              <thead>
                <tr className="text-left">
                  <th className="py-1">Screen</th>
                  <th>Opens</th>
                  <th>User-days</th>
                  <th>Led somewhere else</th>
                  <th>Verdict</th>
                  <th>Why</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.surfaceKey} style={{ borderTop: '1px solid var(--ds-line, #eee)' }}>
                    <td className="py-1 pr-2">{row.label}</td>
                    <td className="num">{row.evidence.views ?? 0}</td>
                    <td className="num">{row.evidence.userDays ?? 0}</td>
                    <td className="num">{row.evidence.followOn ?? 0}</td>
                    <td>{row.dispositionCopy.label}</td>
                    <td style={{ color: 'var(--ds-ink2)' }}>{row.reason || pathLabel(row.surfaceKey)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              title="No usage recorded yet"
              hint="This page fills in as your team opens screens. Until then it has nothing to say and the menu stays exactly as it was — an empty measurement is never a reason to hide a screen."
            />
          )}
        </>
      ) : null}
    </PageShell>
  );
}