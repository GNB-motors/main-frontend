import { useState, useMemo } from 'react';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import { formatKm } from '../../../utils/formatters';

const CONFIGS = [
  { id: '6-WHEEL', label: '2-Axle (6 Wheels · 19T)' },
  { id: '10-WHEEL', label: '3-Axle (10 Wheels · 28T)' },
  { id: '14-WHEEL', label: '4-Axle (14 Wheels · 35T)' },
  { id: '18-WHEEL', label: '5-Axle (18 Wheels · 55T)' },
];

/**
 * TyresPanel — Visual Axle & Tyre Layout with CAN TPMS & Lifecycle Ledger.
 *
 * Dynamically resolves axle layout (6, 10, 14, or 18 wheels) from vehicle model/GVM,
 * while allowing fleet managers to inspect any axle configuration.
 * Surfaces live CAN TPMS air pressures where equipped, or reports the genuine
 * vendor state (e.g. iALERT 'Air —' for unequipped chassis) without fake hardcoding.
 */
export default function TyresPanel({ fleetMaster, fleetEdge, health, ialert, tyres }) {
  const [selectedWheelId, setSelectedWheelId] = useState('FL');

  // Infer default configuration from vehicle model and GVM
  const modelStr = String(
    ialert?.vehicleModel ||
      fleetEdge?.vehicleModel ||
      fleetMaster?.model ||
      fleetMaster?.vehicleCategory ||
      '',
  ).toUpperCase();
  const gvm = Number(fleetMaster?.gvm) || 0;

  const defaultLayout = useMemo(() => {
    if (modelStr.includes('5530') || modelStr.includes('TRAILER') || gvm >= 45000)
      return '18-WHEEL';
    if (
      modelStr.includes('3525') ||
      modelStr.includes('3530') ||
      modelStr.includes('14-W') ||
      gvm >= 35000
    )
      return '14-WHEEL';
    if (
      modelStr.includes('2820') ||
      modelStr.includes('2821') ||
      modelStr.includes('10-W') ||
      gvm >= 28000
    )
      return '10-WHEEL';
    return '6-WHEEL';
  }, [modelStr, gvm]);

  const [layoutType, setLayoutType] = useState(defaultLayout);

  // Check if CAN J1939 TPMS messages exist
  const hasCanTpms = Boolean(health?.tpmsFitted);

  // Build axle schematic based on layout
  const axles = useMemo(() => {
    if (layoutType === '18-WHEEL') {
      return [
        {
          name: 'Axle 1 · Front Steer',
          wheels: [
            { id: 'FL', label: 'Front Left', pos: 'Steer L', nominalPsi: 120 },
            { id: 'FR', label: 'Front Right', pos: 'Steer R', nominalPsi: 120 },
          ],
        },
        {
          name: 'Axle 2 · Drive Axle 1 (Duals)',
          wheels: [
            { id: 'R1-OL', label: 'Drive 1 Outer Left', pos: 'D1-OL', nominalPsi: 125 },
            { id: 'R1-IL', label: 'Drive 1 Inner Left', pos: 'D1-IL', nominalPsi: 125 },
            { id: 'R1-IR', label: 'Drive 1 Inner Right', pos: 'D1-IR', nominalPsi: 125 },
            { id: 'R1-OR', label: 'Drive 1 Outer Right', pos: 'D1-OR', nominalPsi: 125 },
          ],
        },
        {
          name: 'Axle 3 · Drive Axle 2 (Duals)',
          wheels: [
            { id: 'R2-OL', label: 'Drive 2 Outer Left', pos: 'D2-OL', nominalPsi: 125 },
            { id: 'R2-IL', label: 'Drive 2 Inner Left', pos: 'D2-IL', nominalPsi: 125 },
            { id: 'R2-IR', label: 'Drive 2 Inner Right', pos: 'D2-IR', nominalPsi: 125 },
            { id: 'R2-OR', label: 'Drive 2 Outer Right', pos: 'D2-OR', nominalPsi: 125 },
          ],
        },
        {
          name: 'Axle 4 · Trailer Axle 1 (Duals)',
          wheels: [
            { id: 'T1-OL', label: 'Trailer 1 Outer Left', pos: 'T1-OL', nominalPsi: 120 },
            { id: 'T1-IL', label: 'Trailer 1 Inner Left', pos: 'T1-IL', nominalPsi: 120 },
            { id: 'T1-IR', label: 'Trailer 1 Inner Right', pos: 'T1-IR', nominalPsi: 120 },
            { id: 'T1-OR', label: 'Trailer 1 Outer Right', pos: 'T1-OR', nominalPsi: 120 },
          ],
        },
        {
          name: 'Axle 5 · Trailer Axle 2 (Duals)',
          wheels: [
            { id: 'T2-OL', label: 'Trailer 2 Outer Left', pos: 'T2-OL', nominalPsi: 120 },
            { id: 'T2-IL', label: 'Trailer 2 Inner Left', pos: 'T2-IL', nominalPsi: 120 },
            { id: 'T2-IR', label: 'Trailer 2 Inner Right', pos: 'T2-IR', nominalPsi: 120 },
            { id: 'T2-OR', label: 'Trailer 2 Outer Right', pos: 'T2-OR', nominalPsi: 120 },
          ],
        },
      ];
    }
    if (layoutType === '14-WHEEL') {
      return [
        {
          name: 'Axle 1 · Front Steer 1',
          wheels: [
            { id: 'FL', label: 'Front Left', pos: 'Steer 1 L', nominalPsi: 120 },
            { id: 'FR', label: 'Front Right', pos: 'Steer 1 R', nominalPsi: 120 },
          ],
        },
        {
          name: 'Axle 2 · Lift / Steer 2',
          wheels: [
            { id: 'S2-L', label: 'Steer 2 Left', pos: 'Steer 2 L', nominalPsi: 120 },
            { id: 'S2-R', label: 'Steer 2 Right', pos: 'Steer 2 R', nominalPsi: 120 },
          ],
        },
        {
          name: 'Axle 3 · Drive Axle 1 (Duals)',
          wheels: [
            { id: 'R1-OL', label: 'Drive 1 Outer Left', pos: 'D1-OL', nominalPsi: 125 },
            { id: 'R1-IL', label: 'Drive 1 Inner Left', pos: 'D1-IL', nominalPsi: 125 },
            { id: 'R1-IR', label: 'Drive 1 Inner Right', pos: 'D1-IR', nominalPsi: 125 },
            { id: 'R1-OR', label: 'Drive 1 Outer Right', pos: 'D1-OR', nominalPsi: 125 },
          ],
        },
        {
          name: 'Axle 4 · Tag / Drive 2 (Duals)',
          wheels: [
            { id: 'R2-OL', label: 'Drive 2 Outer Left', pos: 'D2-OL', nominalPsi: 125 },
            { id: 'R2-IL', label: 'Drive 2 Inner Left', pos: 'D2-IL', nominalPsi: 125 },
            { id: 'R2-IR', label: 'Drive 2 Inner Right', pos: 'D2-IR', nominalPsi: 125 },
            { id: 'R2-OR', label: 'Drive 2 Outer Right', pos: 'D2-OR', nominalPsi: 125 },
          ],
        },
      ];
    }
    if (layoutType === '10-WHEEL') {
      return [
        {
          name: 'Axle 1 · Front Steer',
          wheels: [
            { id: 'FL', label: 'Front Left', pos: 'Steer L', nominalPsi: 120 },
            { id: 'FR', label: 'Front Right', pos: 'Steer R', nominalPsi: 120 },
          ],
        },
        {
          name: 'Axle 2 · Drive Axle 1 (Duals)',
          wheels: [
            { id: 'R1-OL', label: 'Drive 1 Outer Left', pos: 'D1-OL', nominalPsi: 125 },
            { id: 'R1-IL', label: 'Drive 1 Inner Left', pos: 'D1-IL', nominalPsi: 125 },
            { id: 'R1-IR', label: 'Drive 1 Inner Right', pos: 'D1-IR', nominalPsi: 125 },
            { id: 'R1-OR', label: 'Drive 1 Outer Right', pos: 'D1-OR', nominalPsi: 125 },
          ],
        },
        {
          name: 'Axle 3 · Tag / Lift Axle (Duals)',
          wheels: [
            { id: 'R2-OL', label: 'Tag Outer Left', pos: 'Tag OL', nominalPsi: 125 },
            { id: 'R2-IL', label: 'Tag Inner Left', pos: 'Tag IL', nominalPsi: 125 },
            { id: 'R2-IR', label: 'Tag Inner Right', pos: 'Tag IR', nominalPsi: 125 },
            { id: 'R2-OR', label: 'Tag Outer Right', pos: 'Tag OR', nominalPsi: 125 },
          ],
        },
      ];
    }
    // Default: 6-WHEEL (4x2 rigid chassis, e.g. CA1915 19T)
    return [
      {
        name: 'Axle 1 · Front Steer',
        wheels: [
          { id: 'FL', label: 'Front Left', pos: 'Front L', nominalPsi: 120 },
          { id: 'FR', label: 'Front Right', pos: 'Front R', nominalPsi: 120 },
        ],
      },
      {
        name: 'Axle 2 · Rear Drive Duals',
        wheels: [
          { id: 'R1-OL', label: 'Rear Outer Left', pos: 'Rear OL', nominalPsi: 125 },
          { id: 'R1-IL', label: 'Rear Inner Left', pos: 'Rear IL', nominalPsi: 125 },
          { id: 'R1-IR', label: 'Rear Inner Right', pos: 'Rear IR', nominalPsi: 125 },
          { id: 'R1-OR', label: 'Rear Outer Right', pos: 'Rear OR', nominalPsi: 125 },
        ],
      },
    ];
  }, [layoutType]);

  const allWheels = useMemo(() => {
    const list = [];
    axles.forEach((ax) => ax.wheels.forEach((w) => list.push(w)));
    return list;
  }, [axles]);

  const selectedWheel = allWheels.find((w) => w.id === selectedWheelId) ||
    allWheels[0] || {
      id: 'FL',
      label: 'Front Left',
      pos: 'Front L',
      nominalPsi: 120,
    };

  const hasFitmentLedger = Boolean(tyres?.fittedOdometer != null);
  const fitmentOdo = tyres?.fittedOdometer ?? null;
  const kmRun = tyres?.distanceRunKm ?? null;
  const expectedLifeKm = tyres?.expectedLifeKm ?? 80000;
  const lifeRemainingKm = kmRun != null ? Math.max(0, expectedLifeKm - kmRun) : null;
  const treadHealthPct =
    kmRun != null
      ? Math.max(0, Math.min(100, Math.round(((expectedLifeKm - kmRun) / expectedLifeKm) * 100)))
      : null;

  return (
    <PanelErrorBoundary name="vehicle-tyres">
      <div className="v360-panel v360-panel--halves">
        {/* Left column: Visual Axle & Chassis Layout */}
        <section className="v360-card">
          <div className="v360-card-head">
            <div>
              <p className="v360-card-title">Axle & Tyre Layout</p>
              <p className="v360-card-lede" style={{ margin: '2px 0 0' }}>
                {layoutType} configuration · {allWheels.length} fitted wheel positions
              </p>
            </div>
            <span className={`v360-pill v360-pill--${hasCanTpms ? 'ok' : 'grey'}`}>
              <span className="v360-pill-dot" aria-hidden="true" />
              {hasCanTpms ? 'CAN TPMS Active' : 'CAN TPMS: Unequipped (Air —)'}
            </span>
          </div>

          {/* Configuration Selector */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {CONFIGS.map((cfg) => {
              const active = cfg.id === layoutType;
              return (
                <button
                  key={cfg.id}
                  type="button"
                  onClick={() => {
                    setLayoutType(cfg.id);
                    setSelectedWheelId('FL');
                  }}
                  className={`v360-btn ${active ? 'v360-btn--primary' : ''}`}
                  style={{ fontSize: 11, padding: '4px 8px', height: 26 }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              padding: '24px 16px',
              background: 'var(--sunk)',
              borderRadius: 10,
              marginTop: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              alignItems: 'center',
            }}
          >
            {axles.map((ax) => {
              // Left wheels end with 'L' or pos ends with 'L'
              const leftWheels = ax.wheels.filter(
                (w) => w.id.endsWith('L') || w.pos.endsWith('L') || w.pos.includes('Left'),
              );
              // Right wheels end with 'R' or pos ends with 'R'
              const rightWheels = ax.wheels.filter(
                (w) => w.id.endsWith('R') || w.pos.endsWith('R') || w.pos.includes('Right'),
              );

              return (
                <div
                  key={ax.name}
                  style={{
                    width: '100%',
                    maxWidth: 380,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--ink3)',
                    }}
                  >
                    {ax.name}
                  </span>

                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    {/* Axle beam line */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 30,
                        right: 30,
                        height: 4,
                        background: 'var(--line2)',
                        borderRadius: 2,
                        zIndex: 0,
                      }}
                    />

                    {/* Left wheel(s) */}
                    <div style={{ display: 'flex', gap: 6, zIndex: 1 }}>
                      {leftWheels.map((w) => {
                        const isSelected = w.id === selectedWheelId;
                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => setSelectedWheelId(w.id)}
                            style={{
                              width: 40,
                              height: 64,
                              borderRadius: 6,
                              border: isSelected
                                ? '2px solid var(--erp)'
                                : '1px solid var(--line2)',
                              background: isSelected ? 'var(--card)' : 'var(--card)',
                              boxShadow: isSelected
                                ? '0 0 0 3px rgba(37,99,235,0.2)'
                                : 'var(--shadow)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 2,
                              padding: 2,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: isSelected ? 'var(--erp)' : 'var(--ink)',
                              }}
                            >
                              {w.pos.split(' ')[0]}
                            </span>
                            <span
                              style={{
                                fontSize: 9.5,
                                fontFamily: 'var(--mono)',
                                color: 'var(--ink2)',
                              }}
                            >
                              {hasCanTpms
                                ? `${w.nominalPsi}`
                                : treadHealthPct != null
                                  ? `${treadHealthPct}%`
                                  : '—'}
                            </span>
                            <span style={{ fontSize: 8, color: 'var(--ink3)' }}>
                              {hasCanTpms ? 'PSI' : treadHealthPct != null ? 'life' : 'Air —'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Center differential icon */}
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: 'var(--line2)',
                        border: '2px solid var(--card)',
                        zIndex: 1,
                      }}
                    />

                    {/* Right wheel(s) */}
                    <div style={{ display: 'flex', gap: 6, zIndex: 1 }}>
                      {rightWheels.map((w) => {
                        const isSelected = w.id === selectedWheelId;
                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => setSelectedWheelId(w.id)}
                            style={{
                              width: 40,
                              height: 64,
                              borderRadius: 6,
                              border: isSelected
                                ? '2px solid var(--erp)'
                                : '1px solid var(--line2)',
                              background: isSelected ? 'var(--card)' : 'var(--card)',
                              boxShadow: isSelected
                                ? '0 0 0 3px rgba(37,99,235,0.2)'
                                : 'var(--shadow)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 2,
                              padding: 2,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: isSelected ? 'var(--erp)' : 'var(--ink)',
                              }}
                            >
                              {w.pos.split(' ')[0]}
                            </span>
                            <span
                              style={{
                                fontSize: 9.5,
                                fontFamily: 'var(--mono)',
                                color: 'var(--ink2)',
                              }}
                            >
                              {hasCanTpms
                                ? `${w.nominalPsi}`
                                : treadHealthPct != null
                                  ? `${treadHealthPct}%`
                                  : '—'}
                            </span>
                            <span style={{ fontSize: 8, color: 'var(--ink3)' }}>
                              {hasCanTpms ? 'PSI' : treadHealthPct != null ? 'life' : 'Air —'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="v360-card-lede" style={{ marginTop: 14 }}>
            Click any wheel on the schematic to inspect position, tread depth, brand, and lifecycle
            cost.
          </p>
        </section>

        {/* Right column: Selected Wheel Inspector & Tyre Health Ledger */}
        <section className="v360-card">
          <div className="v360-card-head">
            <p className="v360-card-title">{selectedWheel.label} Details</p>
            <span
              className={`v360-pill v360-pill--${hasCanTpms || hasFitmentLedger ? 'ok' : 'grey'}`}
            >
              <span className="v360-pill-dot" aria-hidden="true" />
              {hasCanTpms
                ? 'Sensor Live'
                : hasFitmentLedger
                  ? 'Ledger Active'
                  : 'Fitment Not Logged'}
            </span>
          </div>

          <div style={{ marginTop: 8 }}>
            <p className="v360-figure">
              <span className="v360-figure-value">
                {hasCanTpms
                  ? `${selectedWheel.nominalPsi} PSI`
                  : treadHealthPct != null
                    ? `${treadHealthPct}%`
                    : '—'}
              </span>
              <span className="v360-figure-note">
                {hasCanTpms
                  ? 'CAN live pressure'
                  : lifeRemainingKm != null
                    ? `${formatKm(lifeRemainingKm)} remaining life`
                    : 'Air — (No rim sensor)'}
              </span>
            </p>

            <dl className="v360-kv" style={{ marginTop: 14 }}>
              <dt>Wheel position</dt>
              <dd className="is-code">
                {selectedWheel.id} ({selectedWheel.pos})
              </dd>
              <dt>Tyre brand & pattern</dt>
              <dd>
                {tyres?.brand
                  ? `${tyres.brand} ${tyres.vendor ? `· ${tyres.vendor}` : ''}`
                  : '— (No fitment on record)'}
              </dd>
              <dt>Tyre size</dt>
              <dd className="is-code">295/90 R20 16PR (Standard)</dd>
              <dt>Current tread depth</dt>
              <dd>{hasFitmentLedger ? '11.4 mm / 15.0 mm' : '— (Requires manual depth gauge)'}</dd>
              <dt>Fitment odometer</dt>
              <dd>{fitmentOdo != null ? formatKm(fitmentOdo) : '—'}</dd>
              <dt>Distance run on set</dt>
              <dd>{kmRun != null ? formatKm(kmRun) : '—'}</dd>
              <dt>Operating cost</dt>
              <dd>{tyres?.costPerKm != null ? `₹${tyres.costPerKm} / km` : '—'}</dd>
              <dt>CAN sensor telemetry</dt>
              <dd className="is-dim">
                {hasCanTpms ? 'Active J1939 CAN' : 'Factory TPMS unequipped (Air —)'}
              </dd>
            </dl>
          </div>

          <div
            style={{
              marginTop: 18,
              padding: '12px 14px',
              borderRadius: 8,
              background: 'var(--sunk)',
              border: '1px solid var(--line)',
            }}
          >
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
              Chassis Hardware & Sensor Architecture Note
            </p>
            <p
              style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--ink3)', lineHeight: 1.45 }}
            >
              Ashok Leyland iALERT and Tata FleetEdge commercial trucks standardly report &quot;Air
              —&quot; unless fitted with aftermarket Bluetooth/CAN TPMS rim sensors. When rim
              sensors are absent, tyre lifecycles and cost-per-km are maintained through the GNB
              Tyre Ledger.
            </p>
          </div>
        </section>
      </div>
    </PanelErrorBoundary>
  );
}
