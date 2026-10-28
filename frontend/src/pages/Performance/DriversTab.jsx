import React, { useEffect, useMemo, useState } from 'react';
import DataTable from '../../components/ui/DataTable';
import Empty from '../Vehicle360/panels/Empty';
import { GradePill } from '../DrivingDna/GradePill';
import useApi from '../../hooks/useApi';
import PerformanceApi from '../../api/performance';
import SourceCell from './SourceCell';
import { cellNumber } from './performanceCells';

const COLUMNS = [
  {
    key: 'driver',
    label: 'Driver',
    render: (d) => (
      <>
        <span className="pf-veh">{d.name || '—'}</span>
        <span className="pf-sub">{d.driverId || ''}</span>
      </>
    ),
  },
  {
    key: 'vehicles',
    label: 'Vehicles',
    render: (d) => <span>{(d.vehicles ?? []).join(', ') || '—'}</span>,
  },
  {
    key: 'dnaScore',
    label: 'DNA score',
    render: (d) => <SourceCell cell={d.dnaScore} decimals={0} />,
  },
  {
    key: 'harshPer100Km',
    label: 'Harsh /100 km',
    align: 'right',
    render: (d) => <SourceCell cell={d.harshPer100Km} />,
  },
  {
    key: 'idlePct',
    label: 'Idle %',
    align: 'right',
    render: (d) => <SourceCell cell={d.idlePct} />,
  },
];

const isCell = (v) => !!v && typeof v === 'object' && !Array.isArray(v) && 'source' in v;

const labelFor = (key) =>
  String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());

/**
 * Drivers — the fleet's drivers and the Driver DNA behind each score.
 *
 * The DNA payload arrives with every number already a cell, so each trait is
 * rendered with its own source and its own reason when it is unknown.
 */
export default function DriversTab() {
  const { data, loading, error, refetch } = useApi(
    (signal) => PerformanceApi.drivers({}, signal),
    [],
  );
  const drivers = useMemo(() => data?.drivers ?? [], [data]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!drivers.length) {
      if (selectedId) setSelectedId(null);
      return;
    }
    if (!drivers.some((d) => d.driverId === selectedId)) setSelectedId(drivers[0].driverId);
  }, [drivers, selectedId]);

  const detail = useApi((signal) => PerformanceApi.driver(selectedId, {}, signal), [selectedId], {
    enabled: Boolean(selectedId),
  });

  const selected = drivers.find((d) => d.driverId === selectedId) ?? null;
  const dna = detail.data?.dna ?? null;
  const dnaRows = useMemo(() => Object.entries(dna ?? {}).filter(([, v]) => isCell(v)), [dna]);
  const dnaTextRows = useMemo(
    () => Object.entries(dna ?? {}).filter(([, v]) => typeof v === 'string'),
    [dna],
  );
  const grade = typeof dna?.grade === 'string' ? dna.grade : null;
  const scoreEntry = dnaRows.find(([key]) => /score/i.test(key));
  const scoreValue = scoreEntry ? cellNumber(scoreEntry[1]) : null;

  return (
    <div className="pf-stack">
      <section className="pf-card">
        <header className="pf-card-head">
          <h2 className="pf-card-title">Driver DNA</h2>
          <span className="pf-hint">{selected?.name || '—'}</span>
        </header>
        {selected ? (
          <>
            <dl className="pf-kv">
              <div className="pf-kv-row">
                <dt>Driver</dt>
                <dd>{selected.name || '—'}</dd>
              </div>
              <div className="pf-kv-row">
                <dt>Vehicles</dt>
                <dd>{(selected.vehicles ?? []).join(', ') || '—'}</dd>
              </div>
              <div className="pf-kv-row">
                <dt>DNA score</dt>
                <dd>
                  <SourceCell cell={selected.dnaScore} decimals={0} />
                </dd>
              </div>
              {grade ? (
                <div className="pf-kv-row">
                  <dt>Grade</dt>
                  <dd>
                    <GradePill grade={grade} score={scoreValue} />
                  </dd>
                </div>
              ) : null}
            </dl>

            {dnaRows.length ? (
              <div className="pf-bars">
                {dnaRows.map(([key, cell]) => (
                  <div className="pf-bar" key={key}>
                    <span className="pf-bar-label">{labelFor(key)}</span>
                    <span className="pf-bar-track">
                      <span
                        className="pf-bar-fill"
                        style={{ width: `${Math.max(0, Math.min(100, cellNumber(cell) ?? 0))}%` }}
                      />
                    </span>
                    <span className="pf-bar-value">
                      <SourceCell cell={cell} decimals={0} />
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {dnaTextRows.length ? (
              <ul className="pf-dna-text">
                {dnaTextRows.map(([key, value]) => (
                  <li key={key}>
                    <span className="pf-bar-label">{labelFor(key)}</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <Empty
            title="No driver selected"
            hint="Pick a driver from the table below to see their DNA."
          />
        )}
      </section>

      <section className="pf-card">
        <header className="pf-card-head">
          <h2 className="pf-card-title">Drivers</h2>
        </header>
        <DataTable
          columns={COLUMNS}
          rows={drivers}
          rowKey={(d) => d.driverId}
          loading={loading && !data}
          error={error}
          onRetry={refetch}
          showing={drivers.length}
          total={drivers.length}
          onRowClick={(d) => setSelectedId(d.driverId)}
          rowClassName={(d) => (d.driverId === selectedId ? 'dt-row--selected' : '')}
          emptyTitle="No drivers in this window"
          emptyHint="A driver shows up once the server has a reading for them in the last 30 days."
        />
      </section>
    </div>
  );
}
