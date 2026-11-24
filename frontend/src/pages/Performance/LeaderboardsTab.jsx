import React, { useMemo, useState } from 'react';
import useApi from '../../hooks/useApi';
import useUrlFilter from '../../hooks/useUrlFilter';
import PerformanceApi from '../../api/performance';
import { humanizeCode } from '../../utils/format';
import IntelligenceDataState from '../Intelligence/IntelligenceDataState';
import { PerformanceBriefing } from './PerformanceParts';
import { windowLabel } from './performanceGaps';
import {
  DASH,
  boardStats,
  coverageText,
  floorText,
  formatBoardValue,
  formatVsExpected,
  boardTabLabel,
  methodRows,
  rankLabel,
  unknownKmNote,
  vehicleCoverageRows,
  vsExpectedTone,
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
/** "pool of 5, this row excluded", or the words for a row with no peers. */
const poolText = (r) =>
  r.expectedPeers
    ? `pool of ${r.expectedPeers}${r.expectedExcludesSelf ? ', this row excluded' : ''}`
    : 'no peers to compare to';

/** The pool note of a whole duty group, said once. */
const sharedPoolText = (r) =>
  r.expectedPeers
    ? `Expected value from a pool of ${r.expectedPeers} drivers${
        r.expectedExcludesSelf ? ', leaving out the driver being compared' : ''
      }.`
    : 'No peers to compare to.';

/** The one value every entry shares, or null when they differ (or there are fewer than two). */
const sharedValue = (values) => {
  const present = values.filter(Boolean);
  if (present.length < 2 || present.length !== values.length) return null;
  return present.every((value) => value === present[0]) ? present[0] : null;
};

function DutyGroup({ group, board }) {
  const rows = group.rows || [];
  const floor = floorText(group.floor);
  const unit = board.unit;
  // A note every row would repeat is said once, in the group's head.
  const sharedRankNote = sharedValue(rows.filter((r) => r.rank == null).map((r) => r.rankNote));
  const sharedPool = sharedValue(rows.map(poolText));

  return (
    <>
      <div className="pf-group-head">
        <h4>
          {`Duty group ${group.dutyGroup}`}
          <span>{`${group.rankedCount ?? 0} ranked of ${rows.length}`}</span>
        </h4>
        {floor ? <small>{`Rank floor: ${floor}`}</small> : null}
        {sharedRankNote || sharedPool ? (
          <p>
            {[
              sharedRankNote ? `Unranked: ${sharedRankNote}` : null,
              sharedPool ? sharedPoolText(rows[0]) : null,
            ]
              .filter(Boolean)
              .join(' ')}
          </p>
        ) : null}
      </div>
      <div className="pf-lb-wrap">
        <table className="pf-lb-table">
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Driver</th>
              <th scope="col" className="is-num">
                This driver
              </th>
              <th scope="col" className="is-num">
                Expected for this duty
              </th>
              <th scope="col" className="is-num">
                Vs expected
              </th>
              <th scope="col">Based on</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((r) => {
                const tone = vsExpectedTone(r.vsExpectedPct, board.direction);
                return (
                  <tr key={r.key || r.driverId}>
                    <td className="is-wrap">
                      <span className={r.rank != null ? 'pf-rank' : 'pf-rank--none'}>
                        {rankLabel(r)}
                      </span>
                      {r.rankNote && !sharedRankNote ? <small>{r.rankNote}</small> : null}
                    </td>
                    <td>
                      <strong className="font-semibold">
                        {r.driverName || r.driverId || DASH}
                      </strong>
                    </td>
                    <td className="is-num">{formatBoardValue(r.value, unit)}</td>
                    <td className="is-num">
                      <span>{formatBoardValue(r.expectedValue, unit)}</span>
                      {sharedPool ? null : <small>{poolText(r)}</small>}
                    </td>
                    <td className="is-num">
                      <span className={tone ? `pf-${tone}` : undefined}>
                        {formatVsExpected(r.vsExpectedPct)}
                      </span>
                    </td>
                    <td className="is-wrap">
                      <span className="text-[12.5px]">{coverageText(r.sample) || DASH}</span>
                      {vehicleCoverageRows(r).map((truck) => (
                        <small key={truck.vehicleNumber || truck.dutyGroup}>
                          {truck.vehicleNumber || 'Truck without a plate'}
                          {truck.km != null
                            ? ` · ${Math.round(truck.km).toLocaleString('en-IN')} km`
                            : ''}
                          {truck.trips != null ? ` · ${truck.trips} trips` : ''}
                          {truck.biasPct != null
                            ? ` · bill↔ECU ${truck.biasPct.toFixed(1)}% (${truck.biasSamples ?? 0} samples)`
                            : ''}
                        </small>
                      ))}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-[12.5px] text-[var(--ui-ink-3)]">
                  No driver in this duty group yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function BoardCard({ board, id }) {
  const groups = board.groups || [];
  const title = board.title || humanizeCode(board.key);

  return (
    <section className="pf-card" aria-label={title} id={id} role="tabpanel">
      <header className="pf-card-head">
        <div className="min-w-0">
          <h3>{title}</h3>
          {board.doesNotMeasure ? <p>{board.doesNotMeasure}</p> : null}
          {board.measures ? <p>{`Measures: ${String(board.measures).toLowerCase()}`}</p> : null}
        </div>
        <div className="pf-card-meta">
          <span className="pf-pill">
            {board.direction === 'higher' ? 'Higher is better' : 'Lower is better'}
          </span>
          {board.unit ? <span className="pf-pill">{board.unit}</span> : null}
        </div>
      </header>

      {groups.length ? (
        groups.map((group) => <DutyGroup group={group} board={board} key={group.dutyGroup} />)
      ) : (
        <p className="pf-board-empty">
          No duty group yet. A board needs this fleet’s own cycles before it can tell which trucks
          do comparable work.
        </p>
      )}
    </section>
  );
}

/** The method behind the boards, as the server wrote it — closed until asked for. */
function MethodNotes({ notes }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="pf-card">
      <button
        type="button"
        className="pf-expand"
        aria-expanded={open}
        aria-controls="pf-method-notes"
        onClick={() => setOpen((value) => !value)}
      >
        <span>How these boards are worked out</span>
        <span>{open ? 'Hide' : `Show ${notes.length} notes`}</span>
      </button>
      {open ? (
        <dl id="pf-method-notes" className="pf-fields">
          {notes.map((note) => (
            <div key={note.label}>
              <dt>{note.label}</dt>
              <dd>{humanizeCode(note.value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
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
  const stats = useMemo(() => boardStats(boards), [boards]);
  const days = data?.window?.days ?? 30;
  const range = windowLabel(data?.window);

  const [boardKey, setBoardKey] = useUrlFilter('board');
  const active = boards.find((board) => board.key === boardKey) ?? boards[0] ?? null;

  return (
    <div className="pf-tab">
      <IntelligenceDataState
        loading={loading && !data}
        loadingVariant="table"
        error={error}
        isEmpty={!boards.length}
        emptyMessage={`No board has rows in the last ${days} days yet. A board appears once this fleet’s own trips give it something to compare.`}
        what="Leaderboards"
        onRetry={refetch}
      >
        <>
          <PerformanceBriefing
            label="Leaderboards read"
            eyebrow={`How drivers compare · last ${days} days`}
            lead={
              <>
                <b>{stats.ranked.toLocaleString('en-IN')}</b> of{' '}
                <b>{stats.drivers.toLocaleString('en-IN')}</b>{' '}
                {stats.drivers === 1 ? 'driver' : 'drivers'} earned a rank on at least one board.
              </>
            }
            notes={[
              'A rank is given only when a driver is clearly ahead of the one below, so most drivers stay unranked.',
              unmeasuredTrips,
              range ? `Readings from ${range}.` : null,
            ]}
            kpis={[
              { label: 'Boards', value: boards.length, note: 'one per measure' },
              {
                label: 'Drivers ranked',
                value: stats.ranked.toLocaleString('en-IN'),
                note: `of ${stats.drivers.toLocaleString('en-IN')} compared`,
              },
              {
                label: 'Duty groups',
                value: stats.groups.toLocaleString('en-IN'),
                note: 'learned from this fleet’s own cycles',
              },
              {
                label: 'Drivers without a rank',
                value: stats.unranked.toLocaleString('en-IN'),
                note: 'across all boards',
              },
            ]}
          />

          <div className="pf-board-tabs" role="tablist" aria-label="Boards">
            {boards.map((board) => {
              const selected = board === active;
              const ranked = boardStats([board]).ranked;
              return (
                <button
                  key={board.key || board.title}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="pf-board-panel"
                  onClick={() => setBoardKey(board.key || '')}
                >
                  {boardTabLabel(board)}
                  {ranked ? <span aria-label={`${ranked} ranked`}>{ranked}</span> : null}
                </button>
              );
            })}
          </div>

          {active ? (
            <BoardCard board={active} id="pf-board-panel" key={active.key || active.title} />
          ) : null}

          {notes.length ? <MethodNotes notes={notes} /> : null}
        </>
      </IntelligenceDataState>
    </div>
  );
}
