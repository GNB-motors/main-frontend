import React, { useMemo } from 'react';
import Leaderboard from '../../components/ui/Leaderboard';
import DataTable from '../../components/ui/DataTable';
import Empty from '../Vehicle360/panels/Empty';
import useApi from '../../hooks/useApi';
import PerformanceApi from '../../api/performance';
import SourceCell from './SourceCell';
import { cellNumber } from './performanceCells';

const UNRANKED_COLUMNS = [
  {
    key: 'subject',
    label: 'Subject',
    render: (r) => <span className="pf-veh">{r.subjectName || r.subjectId || '—'}</span>,
  },
  {
    key: 'rank',
    label: 'Rank',
    render: (r) => <span className="num">{r.rank == null ? 'unranked' : `#${r.rank}`}</span>,
  },
  {
    key: 'score',
    label: 'Score',
    render: (r) => <SourceCell cell={r.score} />,
  },
];

function Board({ board }) {
  const rows = board.rows ?? [];
  // A row without a measured score goes last and unranked — it is never
  // pushed into the ranking and never shown as a zero.
  const ranked = rows.filter((r) => r.rank != null && cellNumber(r.score) != null);
  const unranked = rows.filter((r) => r.rank == null || cellNumber(r.score) == null);
  const title = board.label || board.key;

  return (
    <section className="pf-card">
      <header className="pf-card-head">
        <h2 className="pf-card-title">{title}</h2>
      </header>
      <Leaderboard
        title={title}
        unit="number"
        metricKey="score"
        rows={ranked.map((r) => ({ ...r, score: cellNumber(r.score) }))}
        rowLabel={(r) => r.subjectName || r.subjectId || '—'}
        rowSub={(r) => (r.rank == null ? '' : `#${r.rank}`)}
      />
      {unranked.length ? (
        <DataTable
          columns={UNRANKED_COLUMNS}
          rows={unranked}
          rowKey={(r, i) => r.subjectId ?? `${r.subjectName}-${i}`}
          showing={unranked.length}
          total={unranked.length}
          emptyTitle="No unranked rows"
        />
      ) : null}
    </section>
  );
}

/**
 * Leaderboards — the existing Leaderboard component, fed the measured rows.
 *
 * Rows whose score was not measured are not ranked: they are listed under the
 * board with the reason they carry.
 */
export default function LeaderboardsTab() {
  const { data, loading, error, refetch } = useApi(
    (signal) => PerformanceApi.leaderboards({}, signal),
    [],
  );
  const boards = useMemo(() => data?.boards ?? [], [data]);

  return (
    <div className="pf-stack">
      {loading && !data ? (
        <div className="text-dim p-4 text-sm">Loading leaderboards…</div>
      ) : error ? (
        <div className="p-4 text-sm" style={{ color: 'var(--critical)' }}>
          Could not load leaderboards. {error.message || ''}
          <button type="button" className="pf-retry" onClick={refetch}>
            Retry
          </button>
        </div>
      ) : boards.length === 0 ? (
        <Empty
          title="No leaderboards in this window"
          hint="A board appears once the server has rows for it in the last 30 days."
        />
      ) : (
        boards.map((board) => <Board board={board} key={board.key || board.label} />)
      )}
      <p className="pf-note">
        A row whose score was not measured stays last and unranked, with the reason beside it. It is
        never shown as a zero.
      </p>
    </div>
  );
}
