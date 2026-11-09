import React, { useMemo } from 'react';
import DataTable from '../../components/ui/DataTable';
import Empty from '../Vehicle360/panels/Empty';
import useApi from '../../hooks/useApi';
import PerformanceApi from '../../api/performance';
import {
  DASH,
  coverageText,
  floorText,
  formatBoardValue,
  formatVsExpected,
  methodRows,
  rankLabel,
  sumLine,
  unknownKmNote,
  vehicleCoverageRows,
} from './leaderboardsModel';

/**
 * Leaderboards — the learned duty-group boards.
 *
 * A board ranks drivers against the expected value for the duty group they
 * work in, never against each other's raw number. The expected value is the
 * pool WITHOUT the row itself, so a driver is never their own benchmark, and
 * both numbers are shown side by side.
 *
 * A rank is only awarded where the row's 95% interval does not overlap the
 * row above it, so a healthy fleet produces FEW ranks. That is the correct
 * output, and every unranked row says why in words.
 */
function columnsFor(board) {
  const unit = board.unit;
  return [
    {
      key: 'driver',
      label: 'Driver',
      render: (r) => (
        <>
          <span className="pf-veh">{r.driverName || r.driverId || DASH}</span>
          <span className="pf-sub">{r.driverId || ''}</span>
        </>
      ),
    },
    {
      key: 'value',
      label: unit || 'Value',
      align: 'right',
      render: (r) => <span className="num">{formatBoardValue(r.value, unit)}</span>,
    },
    {
      key: 'expected',
      label: 'Expected (peers)',
      align: 'right',
      render: (r) => (
        <>
          <span className="num">{formatBoardValue(r.expectedValue, unit)}</span>
          <span className="pf-sub">
            {r.expectedPeers
              ? `pool of ${r.expectedPeers}${r.expectedExcludesSelf ? ', this row excluded' : ''}`
              : 'no peers to compare to'}
          </span>
        </>
      ),
    },
    {
      key: 'vsExpected',
      label: 'Vs expected',
      align: 'right',
      render: (r) => <span className="num">{formatVsExpected(r.vsExpectedPct)}</span>,
    },
    {
      key: 'rank',
      label: 'Rank',
      render: (r) => (
        <>
          <span className="num">{rankLabel(r)}</span>
          {r.rankNote ? <span className="pf-sub">{r.rankNote}</span> : null}
        </>
      ),
    },
    {
      key: 'coverage',
      label: 'Coverage',
      render: (r) => {
        const trucks = vehicleCoverageRows(r);
        return (
          <>
            <span className="pf-sub">{coverageText(r.sample) || DASH}</span>
            {trucks.map((truck) => (
              <span className="pf-sub" key={truck.vehicleNumber || truck.dutyGroup}>
                {truck.vehicleNumber || 'truck without a plate'}
                {truck.km != null ? ` · ${Math.round(truck.km).toLocaleString('en-IN')} km` : ''}
                {truck.trips != null ? ` · ${truck.trips} trips` : ''}
                {truck.biasPct != null
                  ? ` · bill↔ECU ${truck.biasPct.toFixed(1)}% (${truck.biasSamples ?? 0} samples)`
                  : ''}
              </span>
            ))}
          </>
        );
      },
    },
  ];
}

function DutyGroup({ group, board }) {
  const columns = useMemo(() => columnsFor(board), [board]);
  const floor = floorText(group.floor);

  return (
    <div style={{ marginTop: 14 }}>
      <h3 className="pf-sub-title">
        Duty group {group.dutyGroup} — {group.rankedCount} ranked
      </h3>
      {floor ? <p className="pf-sub">Rank floor: {floor}</p> : null}
      <DataTable
        columns={columns}
        rows={group.rows || []}
        rowKey={(r) => r.key || r.driverId}
        showing={(group.rows || []).length}
        total={(group.rows || []).length}
        emptyTitle="No rows in this duty group"
        emptyHint="A row appears once the server has a reading for that driver in this window."
      />
    </div>
  );
}

function BoardCard({ board }) {
  const groups = board.groups || [];
  const direction = board.direction === 'higher' ? 'higher is better' : 'lower is better';
  const sum = sumLine(board);

  return (
    <section className="pf-card">
      <header className="pf-card-head">
        <h2 className="pf-card-title">{board.title || board.key}</h2>
        <span className="pf-hint">
          {direction} · {board.unit || ''}
        </span>
      </header>

      {board.measures ? <p className="pf-sub-title">Measures: {board.measures}</p> : null}
      {board.doesNotMeasure ? <p className="pf-note">{board.doesNotMeasure}</p> : null}
      {sum ? <p className="pf-sub">{sum}</p> : null}

      {groups.length ? (
        groups.map((group) => (
          <DutyGroup group={group} board={board} key={group.dutyGroup} />
        ))
      ) : (
        <Empty
          title="No duty group yet"
          hint="A board needs this org's own cycles before it can learn which trucks are doing comparable work."
        />
      )}
    </section>
  );
}

/**
 * The boards, as the server writes them.
 *
 * The window, the duty method, the ranking rule and the notes about what these
 * numbers are NOT are shown as they arrive — paraphrasing them away is how a
 * board starts claiming things its source never said.
 */
export default function LeaderboardsTab() {
  const { data, loading, error, refetch } = useApi(
    (signal) => PerformanceApi.boards({}, signal),
    [],
  );
  const boards = useMemo(() => data?.boards ?? [], [data]);
  const notes = useMemo(() => methodRows(data?.meta), [data]);
  const unmeasuredTrips = useMemo(() => unknownKmNote(data?.meta), [data]);

  return (
    <div className="pf-stack">
      {loading && !data ? (
        <div className="text-dim p-4 text-sm">Loading boards…</div>
      ) : error ? (
        <div className="p-4 text-sm" style={{ color: 'var(--critical)' }}>
          Could not load the boards. {error.message || ''}
          <button type="button" className="pf-retry" onClick={refetch}>
            Retry
          </button>
        </div>
      ) : boards.length === 0 ? (
        <Empty
          title="No boards in this window"
          hint="A board appears once the server has rows for it in the last 30 days."
        />
      ) : (
        boards.map((board) => <BoardCard board={board} key={board.key || board.title} />)
      )}

      {unmeasuredTrips ? <p className="pf-note">{unmeasuredTrips}</p> : null}

      {notes.length ? (
        <section className="pf-card">
          <header className="pf-card-head">
            <h2 className="pf-card-title">How these boards are worked out</h2>
          </header>
          <dl className="pf-kv">
            {notes.map((note) => (
              <div className="pf-kv-row" key={note.label}>
                <dt>{note.label}</dt>
                <dd>{note.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <p className="pf-note">
        A row whose number was not measured stays unranked, with the reason beside it. It is never
        shown as a zero, and it is never ranked above a driver who was measured.
      </p>
    </div>
  );
}
