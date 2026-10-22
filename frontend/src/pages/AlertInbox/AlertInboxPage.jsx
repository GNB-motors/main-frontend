import React from 'react';
import PageShell from '../../components/ui/PageShell.jsx';
import EmptyState from '../../components/cluster/EmptyState.jsx';
import KpiCard from '../../components/ui/KpiCard.jsx';
import Button from '../../components/ui/button.jsx';
import { getInbox, acknowledgeItem, acknowledgeAll } from '../../services/AlertInboxService.js';
import {
  groupByCondition,
  emptyInboxCopy,
  sourcesLine,
  sinceLabel,
  SEVERITY_COPY,
} from './inboxModel.js';

/**
 * Alert Inbox — item 26.5, one feed over the alerts that used to be separate.
 *
 * NOTHING HERE HIDES A SCREEN. Owner alerts, FleetEdge alerts, learned hotspots
 * and support tickets each keep their own page and their own endpoint; this is
 * the same rows folded so that one condition is one thing to do.
 *
 * The three properties the page is built to guarantee:
 *  - every row leads with WHAT IT WANTS DONE, and a row without an ask is
 *    filtered out with a console warning rather than shown blank;
 *  - a condition reported by three modules is ONE row with three sources, and
 *    the row says how many;
 *  - the empty inbox is a real, celebrated state: "Nothing needs doing".
 */
export default function AlertInboxPage() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showDone, setShowDone] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(
    (status = 'OPEN') =>
      getInbox({ status })
        .then(setData)
        .catch((err) => setError(err?.message || 'Could not load the inbox'))
        .finally(() => setLoading(false)),
    [],
  );

  React.useEffect(() => {
    load(showDone ? 'ALL' : 'OPEN');
  }, [load, showDone]);

  const all = data?.items || [];
  // A row with no ask is a server bug, not a rendering problem. Never render
  // one, and never let it empty the list — the rest of the inbox still stands.
  const items = all.filter((item) => item.wants && String(item.wants).trim());
  const withheld = all.length - items.length;
  const groups = groupByCondition(items);
  const openCount = items.filter((i) => i.status === 'OPEN').length;

  const ack = async (id) => {
    setBusy(true);
    try {
      await acknowledgeItem(id);
      await load(showDone ? 'ALL' : 'OPEN');
    } catch (err) {
      setError(err?.message || 'Could not deal with that item');
    } finally {
      setBusy(false);
    }
  };

  const ackAll = async () => {
    setBusy(true);
    try {
      await acknowledgeAll();
      await load(showDone ? 'ALL' : 'OPEN');
    } catch (err) {
      setError(err?.message || 'Could not clear the inbox');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell
      title="Alert Inbox"
      subtitle="Everything that wants something from your team, in one list"
      count={openCount || null}
    >
      {loading ? <p className="text-[13px]">Checking what needs doing…</p> : null}
      {error ? <p className="text-[13px]">{error}</p> : null}

      {!loading && !error ? (
        <>
          <div className="flex flex-wrap gap-3 mt-3">
            <KpiCard title="Waiting on someone" value={openCount} accent="#dc2626" />
            <KpiCard
              title="Conditions raised"
              value={Object.keys(data?.byCondition || {}).length}
              accent="#2563eb"
            />
            <Button variant="ghost" size="sm" onClick={() => setShowDone((v) => !v)}>
              {showDone ? 'Hide what is dealt with' : 'Show what is dealt with'}
            </Button>
            {openCount > 0 ? (
              <Button variant="ghost" size="sm" disabled={busy} onClick={ackAll}>
                Deal with everything
              </Button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <EmptyState title={emptyInboxCopy().title} hint={emptyInboxCopy().hint} />
          ) : (
            groups.map((group) => (
              <section key={group.condition} className="mt-5">
                <h2 className="text-[14px] font-semibold">
                  {group.label}
                  <span className="text-[12px] ml-2" style={{ color: 'var(--ds-ink2)' }}>
                    {SEVERITY_COPY[group.items[0]?.severity]?.label}
                  </span>
                </h2>
                <ul style={{ listStyle: 'none', padding: 0 }} className="mt-2">
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      className="py-2"
                      style={{ borderTop: '1px solid var(--ds-line, #eee)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div style={{ minWidth: 0 }}>
                          <p className="text-[13px] font-semibold">
                            {item.subjectLabel || 'Your organisation'}
                          </p>
                          {/* THE ask. First thing anyone reads. */}
                          <p className="text-[13px]">{item.wants}</p>
                          <p className="text-[12px]" style={{ color: 'var(--ds-ink2)' }}>
                            {sourcesLine(item)}
                            {item.sourceCount > 1 ? ` (${item.sourceCount} reports)` : ''}
                            {item.status === 'ACKNOWLEDGED'
                              ? ' · dealt with'
                              : ` · last ${sinceLabel(item.lastSeenAt)}`}
                          </p>
                        </div>
                        {item.status === 'OPEN' ? (
                          <Button size="sm" variant="secondary" disabled={busy} onClick={() => ack(item.id)}>
                            Done
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}

          <p className="text-[12px] mt-6 max-w-[70ch]" style={{ color: 'var(--ds-ink2)' }}>
            {withheld > 0
              ? `${withheld} row(s) arrived without an action attached and were withheld rather than shown blank — that is a bug, not a filter. `
              : ''}
            This inbox does not replace anything. Owner alerts, FleetEdge alerts, learned hotspots and
            support tickets each keep their own page —{' '}
            {Object.entries(data?.sources || {})
              .map(([name, note]) => `${name}: ${note}`)
              .join(' · ')}
          </p>
        </>
      ) : null}
    </PageShell>
  );
}