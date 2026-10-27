import React, { useEffect, useMemo, useState } from 'react';
import DataTable from '../../components/ui/DataTable';
import Empty from '../Vehicle360/panels/Empty';
import Trend from '../Vehicle360/panels/Trend';
import useApi from '../../hooks/useApi';
import PerformanceApi from '../../api/performance';
import SourceCell from './SourceCell';
import SourceLegend from './SourceLegend';
import { cellNumber, formatCellNumber, isKnownSource } from './performanceCells';

const COLUMNS = [
  {
    key: 'vehicle',
    label: 'Vehicle',
    render: (v) => (
      <>
        <span className="pf-veh">{v.registration || '—'}</span>
        <span className="pf-sub">{v.vehicleId || ''}</span>
      </>
    ),
  },
  {
    key: 'provider',
    label: 'Provider',
    render: (v) => (
      <span className={`pf-prov pf-prov--${String(v.provider || '').toLowerCase()}`}>
        {v.provider || '—'}
      </span>
    ),
  },
  {
    key: 'kmPerL',
    label: 'km/L',
    render: (v) => <SourceCell cell={v.kmPerL} decimals={2} />,
  },
  {
    key: 'idlePct',
    label: 'Idle %',
    align: 'right',
    render: (v) => <SourceCell cell={v.idlePct} />,
  },
  {
    key: 'topGearPct',
    label: 'Top gear %',
    align: 'right',
    render: (v) => <SourceCell cell={v.topGearPct} />,
  },
  {
    key: 'overRevPct',
    label: 'Over-rev %',
    align: 'right',
    render: (v) => <SourceCell cell={v.overRevPct} />,
  },
  {
    key: 'healthFindings',
    label: 'Health',
    align: 'right',
    render: (v) => <span className="num">{v.healthFindings == null ? '—' : v.healthFindings}</span>,
  },
];

const barWidth = (cell) => {
  const n = cellNumber(cell);
  if (n == null) return 0;
  return Math.max(0, Math.min(100, n));
};

const edgesText = (edges) => {
  if (edges == null) return '';
  if (typeof edges === 'object') return JSON.stringify(edges);
  return String(edges);
};

/**
 * Vehicles — the fleet table and the selected vehicle's own numbers.
 *
 * The table is the Mileage performance view rebuilt on the performance API:
 * one row per truck, every number a cell with its source.
 */
export default function VehiclesTab() {
  const { data, loading, error, refetch } = useApi(
    (signal) => PerformanceApi.vehicles({}, signal),
    [],
  );
  const vehicles = useMemo(() => data?.vehicles ?? [], [data]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!vehicles.length) {
      if (selectedId) setSelectedId(null);
      return;
    }
    if (!vehicles.some((v) => v.vehicleId === selectedId)) setSelectedId(vehicles[0].vehicleId);
  }, [vehicles, selectedId]);

  const detail = useApi((signal) => PerformanceApi.vehicle(selectedId, {}, signal), [selectedId], {
    enabled: Boolean(selectedId),
  });

  const vehicle = detail.data?.vehicle ?? null;
  const gear = detail.data?.gearRpm ?? null;
  const findings = detail.data?.health ?? [];
  const drift = detail.data?.efficiencyDrift ?? null;
  const harsh = detail.data?.harshEvents ?? [];

  const gearEntries = Object.entries(gear?.gearPct ?? {});
  const bandEntries = Object.entries(gear?.rpmBandPct ?? {});
  const series = drift?.series ?? [];
  const points = series.map((p) => ({ t: p.istDay, kmPerL: cellNumber(p.kmPerL) }));
  const unknownDays = series.filter((p) => cellNumber(p.kmPerL) == null);

  return (
    <div className="pf-stack">
      <SourceLegend />

      <section className="pf-card">
        <header className="pf-card-head">
          <h2 className="pf-card-title">Fleet</h2>
          <span className="pf-hint">click a row</span>
        </header>
        <DataTable
          columns={COLUMNS}
          rows={vehicles}
          rowKey={(v) => v.vehicleId}
          loading={loading && !data}
          error={error}
          onRetry={refetch}
          showing={vehicles.length}
          total={vehicles.length}
          onRowClick={(v) => setSelectedId(v.vehicleId)}
          rowClassName={(v) => (v.vehicleId === selectedId ? 'dt-row--selected' : '')}
          emptyTitle="No vehicles in this window"
          emptyHint="A truck shows up once the server has a reading for it in the last 30 days."
        />
      </section>

      <section className="pf-card">
        <header className="pf-card-head">
          <h2 className="pf-card-title">Selected vehicle</h2>
          <span className="pf-hint">{vehicle?.registration || '—'}</span>
        </header>
        {vehicle ? (
          <dl className="pf-kv">
            <div className="pf-kv-row">
              <dt>Registration</dt>
              <dd>{vehicle.registration || '—'}</dd>
            </div>
            <div className="pf-kv-row">
              <dt>Provider</dt>
              <dd>{vehicle.provider || '—'}</dd>
            </div>
            <div className="pf-kv-row">
              <dt>km/L</dt>
              <dd>
                <SourceCell cell={vehicle.kmPerL} decimals={2} />
              </dd>
            </div>
            <div className="pf-kv-row">
              <dt>Idle share</dt>
              <dd>
                <SourceCell cell={vehicle.idlePct} />
              </dd>
            </div>
            <div className="pf-kv-row">
              <dt>Top gear share</dt>
              <dd>
                <SourceCell cell={vehicle.topGearPct} />
              </dd>
            </div>
            <div className="pf-kv-row">
              <dt>Over-rev share</dt>
              <dd>
                <SourceCell cell={vehicle.overRevPct} />
              </dd>
            </div>
          </dl>
        ) : (
          <Empty
            title="No vehicle selected"
            hint="Pick a truck from the fleet table to see its own numbers."
          />
        )}
      </section>

      <div className="pf-grid">
        <section className="pf-card">
          <header className="pf-card-head">
            <h2 className="pf-card-title">Gear &amp; RPM behaviour</h2>
          </header>
          {gearEntries.length || bandEntries.length ? (
            <>
              <h3 className="pf-sub-title">Gear share</h3>
              <div className="pf-bars">
                {gearEntries.map(([key, cell]) => (
                  <div className="pf-bar" key={key}>
                    <span className="pf-bar-label">{key}</span>
                    <span className="pf-bar-track">
                      <span className="pf-bar-fill" style={{ width: `${barWidth(cell)}%` }} />
                    </span>
                    <span className="pf-bar-value">
                      <SourceCell cell={cell} />
                    </span>
                  </div>
                ))}
              </div>
              <h3 className="pf-sub-title">RPM bands</h3>
              <div className="pf-bars">
                {bandEntries.map(([key, cell]) => (
                  <div className="pf-bar" key={key}>
                    <span className="pf-bar-label">{key}</span>
                    <span className="pf-bar-track">
                      <span className="pf-bar-fill" style={{ width: `${barWidth(cell)}%` }} />
                    </span>
                    <span className="pf-bar-value">
                      <SourceCell cell={cell} />
                    </span>
                  </div>
                ))}
              </div>
              {gear?.bandEdgesRpm != null ? (
                <p className="pf-edges">
                  <span className="pf-bar-label">Band edges</span>
                  <span className="num">{edgesText(gear.bandEdgesRpm)}</span>
                  {isKnownSource({ source: gear.bandEdgesSource }) ? (
                    <span className={`psrc-badge psrc-badge--${gear.bandEdgesSource}`}>
                      {gear.bandEdgesSource}
                    </span>
                  ) : null}
                </p>
              ) : null}
            </>
          ) : (
            <Empty
              title="No gear or RPM reading"
              hint="Gear comes from rpm and speed until a real vendor gear label arrives."
            />
          )}
        </section>

        <section className="pf-card">
          <header className="pf-card-head">
            <h2 className="pf-card-title">Engine health</h2>
            <span className="pf-hint">shadow — findings do not raise an alert yet</span>
          </header>
          {findings.length ? (
            <ul className="pf-findings">
              {findings.map((f) => (
                <li
                  className={`pf-finding pf-finding--${f.status}`}
                  key={`${f.monitor}-${f.title}`}
                >
                  <span className="pf-finding-title">{f.title || f.monitor}</span>
                  {f.detail ? <span className="pf-finding-detail">{f.detail}</span> : null}
                  {f.since ? <span className="pf-finding-meta">since {f.since}</span> : null}
                  <span className={`pf-status pf-status--${f.status}`}>{f.status}</span>
                  {isKnownSource({ source: f.source }) ? (
                    <span className={`psrc-badge psrc-badge--${f.source}`}>{f.source}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              title="No health findings"
              hint="Nothing was flagged for this truck in this window."
            />
          )}
        </section>
      </div>

      <div className="pf-grid">
        <section className="pf-card">
          <header className="pf-card-head">
            <h2 className="pf-card-title">Efficiency drift</h2>
            <span className="pf-hint">vs the truck&apos;s own baseline</span>
          </header>
          {points.length ? (
            <>
              <Trend
                data={points}
                dataKey="kmPerL"
                format={(v) => `${formatCellNumber(v, 2)} km/L`}
              />
              <p className="pf-note">
                Drift is <SourceCell cell={drift?.driftPct} /> against this truck&apos;s own
                baseline.
              </p>
              {unknownDays.length ? (
                <ul className="pf-unknown-days">
                  {unknownDays.map((p) => (
                    <li key={p.istDay}>
                      <span className="num">{p.istDay}</span>
                      <span className="pf-finding-detail">{p.kmPerL?.reason || 'No reading.'}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <Empty
              title="No drift series"
              hint="Drift needs enough of this truck's own history to compare against."
            />
          )}
        </section>

        <section className="pf-card">
          <header className="pf-card-head">
            <h2 className="pf-card-title">Vendor harsh events</h2>
            <span className="pf-hint">last 30 days</span>
          </header>
          {harsh.length ? (
            <ul className="pf-harsh">
              {harsh.map((h, i) => (
                <li className="pf-harsh-row" key={`${h.at}-${h.type}-${i}`}>
                  <span className="pf-harsh-type">{h.type}</span>
                  <span className="num pf-harsh-value">
                    {h.value == null ? '—' : h.value} {h.unit || ''}
                  </span>
                  {h.vendorThreshold != null ? (
                    <span className="pf-harsh-threshold">vendor threshold {h.vendorThreshold}</span>
                  ) : null}
                  <span className="pf-harsh-at">{h.at}</span>
                  <span className="psrc-badge psrc-badge--vendor">vendor</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              title="No vendor harsh events"
              hint="iALERT counts these from the OBU. We grade our own count against theirs; we never adopt theirs."
            />
          )}
        </section>
      </div>
    </div>
  );
}
