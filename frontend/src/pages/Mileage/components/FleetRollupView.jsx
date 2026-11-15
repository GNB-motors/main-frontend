import React from 'react';
import DataTable from '../../../components/ui/DataTable';
import { useApi } from '../../../hooks/useApi';
import { MileageApi } from '../mileageApi';
import {
  DASH,
  UNIT_TEXT,
  dutyCut,
  ecuCrossCheck,
  fleetHeadline,
  groupCards,
  learnedGate,
  rankingRows,
  withheldRows,
  windowText,
} from '../rollupModel';

/**
 * The fleet km/L roll-up — GET /api/mileage-rollup.
 *
 * One number for the whole fleet: Σ km ÷ Σ litres over COMPLETED fill-to-full
 * cycles. It is never the mean of per-truck rates, and the ECU figure beside
 * it is a SECOND number over the same counted cycles — never averaged into the
 * first. Anything the roll-up does not have is a dash with the reason it is
 * not there.
 */

const RANKING_COLUMNS = [
  {
    key: 'rank',
    label: '#',
    width: 48,
    render: (r) => <span className="num">{r.rank ?? DASH}</span>,
  },
  {
    key: 'truck',
    label: 'Truck',
    render: (r) => (
      <span className="mhub-cell">
        <span className="mhub-plate">{r.registrationNumber}</span>
        {r.model ? <span className="mhub-sub">{r.model}</span> : null}
      </span>
    ),
  },
  {
    key: 'duty',
    label: 'Duty group',
    render: (r) => <span className="mhub-dim">{r.duty}</span>,
  },
  {
    key: 'kmPerL',
    label: 'km/L',
    align: 'right',
    render: (r) => <span className="num">{r.kmPerLText}</span>,
  },
  {
    key: 'expected',
    label: 'Should be',
    align: 'right',
    render: (r) => (
      <span className="mhub-cell">
        <span className="num">{r.expectedText}</span>
        <span className="mhub-sub">{r.expectedReason || r.expectedBasis || ''}</span>
      </span>
    ),
  },
  {
    key: 'variance',
    label: 'vs should be',
    align: 'right',
    render: (r) => (
      <span className="mhub-cell">
        <span className="num">{r.varianceText}</span>
        <span className="mhub-sub">{r.varianceReason || ''}</span>
      </span>
    ),
  },
  {
    key: 'cycles',
    label: 'Cycles',
    align: 'right',
    render: (r) => <span className="num">{r.cycles ?? DASH}</span>,
  },
];

const TILE = ({ label, value, unit, foot, reason }) => (
  <div className="mhub-kpi">
    <div className="mhub-kpi-head">{label}</div>
    <div className="mhub-kpi-value">
      {value}
      {unit ? <small>{unit}</small> : null}
    </div>
    <div className="mhub-kpi-foot">
      {reason ? <span className="mhub-reason">{reason}</span> : foot ? <span>{foot}</span> : null}
    </div>
  </div>
);

export default function FleetRollupView({ range }) {
  const scopeKey = JSON.stringify([range.manufacturer, range.from, range.to]);
  const rollup = useApi(
    (signal) => MileageApi.rollup(range, signal),
    [range.manufacturer, range.from, range.to],
    { scopeKey },
  );

  const data = rollup.data || null;
  const kmPerLitre = data?.kmPerLitre || null;

  if (rollup.error) {
    return (
      <div className="mhub">
        <div className="mhub-box">
          <h3>Fleet mileage</h3>
          <p className="mhub-reason">Couldn&rsquo;t load the fleet mileage roll-up.</p>
          <div className="mhub-actions">
            <button type="button" className="pshell-btn" onClick={rollup.refetch}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mhub" aria-busy="true" aria-label="Loading the fleet mileage roll-up">
        <div className="mhub-kpis">
          {[0, 1, 2].map((tile) => (
            <div className="mhub-kpi" key={tile}>
              <div className="mhub-kpi-head">&nbsp;</div>
              <div className="mhub-kpi-value">&nbsp;</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!kmPerLitre) {
    return (
      <div className="mhub">
        <div className="mhub-box">
          <h3>Fleet mileage</h3>
          <p className="mhub-reason">
            No fleet mileage result was returned for these dates. Try refreshing.
          </p>
        </div>
      </div>
    );
  }

  const headline = fleetHeadline(kmPerLitre);
  const ecu = ecuCrossCheck(kmPerLitre);
  const groups = groupCards(kmPerLitre);
  const rows = rankingRows(kmPerLitre);
  const withheld = withheldRows(kmPerLitre);
  const gate = learnedGate(kmPerLitre);
  const cut = dutyCut(kmPerLitre);
  const win = windowText(kmPerLitre);

  return (
    <div className="mhub">
      <div className="mhub-kpis">
        <TILE
          label="Fleet km/L"
          value={headline.text}
          foot={headline.foot}
          reason={headline.reason}
        />
        <TILE label="Engine (ECU) km/L" value={ecu.text} foot={ecu.over} reason={ecu.reason} />
        <TILE
          label="Bill vs engine"
          value={ecu.gapText}
          foot={ecu.pctText}
          reason={ecu.gapReason}
        />
      </div>

      {headline.trucks ? <p className="mhub-note">{headline.trucks}</p> : null}

      <div className="mhub-box">
        <h3>
          How this is measured
          <span className="mhub-dim">{win || ''}</span>
        </h3>
        <div className="mhub-kv">
          <span>Unit</span>
          <span>{UNIT_TEXT}</span>
        </div>
        <div className="mhub-kv">
          <span>Headline</span>
          <span>Σ km ÷ Σ litres over completed fill-to-full cycles</span>
        </div>
        <p className="mhub-footnote">
          Cycles completed in these dates (IST), including their full distance and diesel even if
          they started earlier. Unusable cycles are excluded as in the fill-to-fill KPI.
        </p>
        <div className="mhub-kv">
          <span>Cross-check</span>
          <span>
            {ecu.over || 'The ECU figure is a second number over the same counted cycles.'}
          </span>
        </div>
        {ecu.uncoveredNote ? (
          <div className="mhub-kv">
            <span>Not covered by the engine</span>
            <span>{ecu.uncoveredNote}</span>
          </div>
        ) : null}
        <div className="mhub-kv">
          <span>Duty cut</span>
          <span>
            {cut.cutText}
            {cut.cutReason ? ` — ${cut.cutReason}` : ''}
          </span>
        </div>
        <div className="mhub-kv">
          <span>Evidence gate</span>
          <span>
            {gate.basis
              ? 'Learned per duty group from this org’s own distribution'
              : 'Not learned yet'}
            {gate.learnedAt ? ` · learned ${gate.learnedAt}` : ''}
          </span>
        </div>
        {range?.manufacturer ? (
          <p className="mhub-reason">
            This roll-up covers the whole fleet — the manufacturer filter does not narrow it.
          </p>
        ) : null}
      </div>

      <div className="mhub-cols">
        {groups.map((group) => (
          <div className="mhub-box" key={group.key}>
            <h3>{group.label}</h3>
            <div className="mhub-kv">
              <span>km/L</span>
              <span>{group.text}</span>
            </div>
            {group.reason ? <p className="mhub-reason">{group.reason}</p> : null}
            <div className="mhub-kv">
              <span>Trucks counted</span>
              <span>
                {group.vehiclesCounted ?? DASH} of {group.vehicles ?? DASH}
              </span>
            </div>
            <div className="mhub-kv">
              <span>Cycles</span>
              <span>{group.cycles ?? DASH}</span>
            </div>
            <div className="mhub-kv">
              <span>Distance / diesel</span>
              <span>
                {group.km ?? DASH} km · {group.litres ?? DASH} L
              </span>
            </div>
            {!group.ranked && group.excludeNote ? (
              <p className="mhub-reason">{group.excludeNote}</p>
            ) : null}
            {group.excluded.length ? (
              <ul className="mhub-list">
                {group.excluded.map((t) => (
                  <li key={t.registrationNumber}>
                    <span className="mhub-plate">{t.registrationNumber}</span> {t.reason}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>

      <DataTable
        columns={RANKING_COLUMNS}
        rows={rows}
        rowKey={(r) => r.registrationNumber}
        loading={Boolean(rollup.loading) && rows.length === 0}
        error={null}
        showing={rows.length}
        total={rows.length}
        emptyTitle="No truck has cleared the evidence gate yet"
        emptyHint="The gate is learned per duty group, from this org’s own trucks."
      />

      <div className="mhub-cols">
        <div className="mhub-box">
          <h3>Held back</h3>
          {withheld.length ? (
            <ul className="mhub-list">
              {withheld.map((t) => (
                <li key={t.registrationNumber}>
                  <span className="mhub-plate">{t.registrationNumber}</span> — {t.reason}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mhub-reason">
              Every truck in this window cleared its duty group&rsquo;s evidence gate.
            </p>
          )}
        </div>
        <div className="mhub-box">
          <h3>What the gate asks for</h3>
          {gate.rows.length ? (
            gate.rows.map((row) => (
              <div className="mhub-kv" key={row.key}>
                <span>{row.label}</span>
                <span>
                  {row.text}
                  {row.trucks == null ? '' : ` · ${row.trucks} trucks`}
                </span>
              </div>
            ))
          ) : (
            <p className="mhub-reason">
              No evidence bar has been learned yet, so no truck is published and none is held back.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
