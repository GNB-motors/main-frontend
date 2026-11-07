import { vehicleAxles } from '../vehicleAxles';
import { useState } from 'react';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import useApi from '../../../hooks/useApi';
import FleetDataService from '../../../services/FleetDataService';
import { formatKm, formatINR } from '../../../utils/formatters';
import { formatDateIST } from '../../../utils/dateUtils';
import { pickTyreRow } from './serviceInsightsModel';
import { numeric } from './overview/referenceOverviewModel';
import { OverviewCardSkeleton } from './overview/OverviewSkeleton';
import './overview/referenceOverview.css';
import './vehicleTyres.css';

const CONFIGS = [
  { wheels: 6, axles: 2 },
  { wheels: 10, axles: 3 },
  { wheels: 14, axles: 4 },
  { wheels: 18, axles: 5 },
];
function positions(config) {
  return Array.from({ length: config.axles }, (_, index) => {
    const dual = index > 0;
    const role = index === 0 ? 'Front steer' : `Rear axle ${index}`;
    const side = (letter) =>
      (dual ? (letter === 'L' ? ['O', 'I'] : ['I', 'O']) : ['']).map((suffix) => ({
        code: `A${index + 1}-${letter}${suffix}`,
        name: `Axle ${index + 1} ${letter === 'L' ? 'left' : 'right'}${suffix ? (suffix === 'O' ? ' outer' : ' inner') : ''}`,
        role: `${role}${dual ? ' · dual' : ''}`,
      }));
    return {
      label: `Axle ${index + 1} · ${role.toLowerCase()}`,
      left: side('L'),
      right: side('R'),
    };
  });
}
const km = (value) => (numeric(value) != null ? formatKm(Number(value)) : '—');
const date = (value) =>
  value && Number.isFinite(new Date(value).getTime()) ? formatDateIST(value) : '—';

export default function TyresPanel({ fleetMaster, fleetEdge, health, ialert }) {
  const vehicleId = fleetMaster?.id;
  const registrationNumber =
    fleetMaster?.registrationNumber || fleetEdge?.registrationNumber || ialert?.registrationNumber;
  const tyres$ = useApi(
    (signal) => FleetDataService.getTyreStatus({ vehicleId, registrationNumber }, signal),
    [vehicleId, registrationNumber],
    {
      enabled: Boolean(vehicleId || registrationNumber),
      scopeKey: vehicleId || registrationNumber,
    },
  );
  const set = pickTyreRow(tyres$.data, { vehicleId, registrationNumber });
  const recordedCount = numeric(set?.tyreCount) ?? numeric(fleetMaster?.wheelCount);
  const configured =
    CONFIGS.find((config) => config.axles === vehicleAxles(fleetMaster)) ||
    CONFIGS.find((config) => config.wheels === recordedCount);
  const [preview, setPreview] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [selected, setSelected] = useState('A1-L');
  const config = CONFIGS.find((item) => item.wheels === preview) || configured || CONFIGS[0];
  const axles = positions(config);
  const all = axles.flatMap((axle) => [...axle.left, ...axle.right]);
  const wheel = all.find((item) => item.code === selected) || all[0];
  const currentKnown = numeric(set?.currentOdometer) != null;
  const facts = [
    ['Fitted at', date(set?.fittedAt)],
    ['Fitment odometer', km(set?.fittedOdometer)],
    ['Current odometer', km(set?.currentOdometer)],
    ['Distance run · set', currentKnown ? km(set?.kmRun) : '—'],
    ['Expected life · set', km(set?.expectedLifeKm)],
    ['Estimated remaining · set', currentKnown ? km(set?.remainingKm) : '—'],
    [
      'Cost per km · set',
      currentKnown && numeric(set?.costPerKmInr) != null
        ? `${formatINR(Number(set.costPerKmInr), { decimals: 2 })}/km`
        : '—',
    ],
    ['Replacement projected', currentKnown ? date(set?.projectedReplacementDate) : '—'],
  ];
  const model = ialert?.vehicleModel || fleetEdge?.vehicleModel || fleetMaster?.model;
  const size = fleetMaster?.tyreSize || null;
  return (
    <PanelErrorBoundary name="vehicle-tyres">
      <div className="vdo-overview vtyres">
        <div className="vtyres-top">
          <section className="vdo-card vtyres-layout">
            <div className="vtyres-head">
              <div>
                <h3>Axle &amp; tyre layout</h3>
                <p>
                  {config.axles} axles · {config.wheels} wheel positions ·{' '}
                  {preview
                    ? 'Preview configuration'
                    : configured
                      ? 'Based on recorded configuration'
                      : 'Illustrative layout; configuration not recorded'}{' '}
                  <button className="vtyres-link" onClick={() => setConfigOpen(!configOpen)}>
                    {configOpen ? 'Hide options' : 'Change layout'}
                  </button>
                </p>
              </div>
              <span className="vtyres-badge">Position fitments unavailable</span>
            </div>
            {configOpen ? (
              <div className="vtyres-configs" role="group" aria-label="Preview axle configuration">
                {CONFIGS.map((item) => (
                  <button
                    key={item.wheels}
                    aria-pressed={config.wheels === item.wheels}
                    onClick={() => {
                      setPreview(item.wheels);
                      setSelected('A1-L');
                    }}
                  >
                    {item.axles} axles · {item.wheels} wheels
                  </button>
                ))}
              </div>
            ) : null}
            <div className="vtyres-chassis">
              <span className="vtyres-front">⌃ Front</span>
              {axles.map((axle) => (
                <div className="vtyres-axle" key={axle.label}>
                  <small>{axle.label}</small>
                  <div className="vtyres-axle-row">
                    {[axle.left, axle.right].map((side, index) => (
                      <div className="vtyres-wheel-side" key={index}>
                        {side.map((item) => (
                          <button
                            key={item.code}
                            className={`vtyres-wheel${wheel.code === item.code ? ' vtyres-wheel--selected' : ''}`}
                            aria-pressed={wheel.code === item.code}
                            aria-label={item.name}
                            onClick={() => setSelected(item.code)}
                          >
                            <b>{item.code}</b>
                            <span>
                              Not
                              <br />
                              recorded
                            </span>
                          </button>
                        ))}
                      </div>
                    ))}
                    <span className="vtyres-beam">
                      <i />
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="vtyres-legend">
              <span>□ Position not recorded</span>
              <span>▣ Selected position</span>
            </div>
            <p>
              Changing this layout previews positions; it does not update the vehicle or create
              fitment records.
            </p>
          </section>
          <section className="vdo-card vtyres-selected">
            <div className="vtyres-head">
              <div>
                <small>Selected position</small>
                <strong>{wheel.name}</strong>
                <code>{wheel.code}</code>
              </div>
              <span className="vtyres-badge">No position record</span>
            </div>
            <div className="vtyres-facts">
              <div>
                <span>Tyre size</span>
                <b>{size || 'Not recorded'}</b>
              </div>
              <div>
                <span>Axle role</span>
                <b>{wheel.role}</b>
              </div>
              <div>
                <span>Vehicle model</span>
                <b>{model || 'Not recorded'}</b>
              </div>
              <div>
                <span>Pressure</span>
                <b>Position reading unavailable</b>
              </div>
            </div>
            <div className="vtyres-empty">
              <h3>No individual fitment returned</h3>
              <p>
                The tyre API records a vehicle-level set. It does not identify which tyre is fitted
                at this position.
              </p>
              <div className="vtyres-chips">
                {['Brand & pattern', 'Fitment odometer', 'Tread depth', 'Purchase price'].map(
                  (label) => (
                    <span key={label}>{label}</span>
                  ),
                )}
              </div>
            </div>
            <div className="vtyres-insight">
              ✧ Set-level distance and estimated life are shown separately below. They do not
              establish tread depth, pressure or wear for this individual wheel.{' '}
              {health?.tpmsFitted === false
                ? 'The vehicle reports that TPMS is not fitted.'
                : 'A mapped pressure reading is needed to monitor this position.'}
            </div>
          </section>
        </div>
        {tyres$.loading && !tyres$.data ? (
          <OverviewCardSkeleton />
        ) : (
          <section className="vdo-card">
            <div className="vtyres-head">
              <h3>Recorded tyre set</h3>
              <span className="vtyres-badge">
                {tyres$.error
                  ? 'Couldn’t load tyre data'
                  : set
                    ? `${set.tyreCount ?? '—'} tyres recorded`
                    : 'No active set returned'}
              </span>
            </div>
            {set ? (
              <>
                <div className="vtyres-set-facts">
                  {facts.map(([label, value]) => (
                    <div key={label}>
                      <small>{label}</small>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
                <p>
                  Estimated life is based on the set’s recorded expected life and odometer distance;
                  it is not a measured tread reading.
                  {set.odometerSource ? ` Odometer source: ${set.odometerSource}.` : ''}
                </p>
              </>
            ) : (
              <div className="vtyres-empty">
                <h3>
                  {tyres$.error ? 'Tyre-set data unavailable' : 'No active tyre set on record'}
                </h3>
                <p>
                  {tyres$.error
                    ? 'The tyre status API could not be loaded.'
                    : 'A recorded tyre set and current odometer are needed to calculate distance, cost per km and estimated replacement.'}
                </p>
              </div>
            )}
          </section>
        )}
        <section className="vdo-card vtyres-positions">
          <div className="vtyres-head">
            <div>
              <h3>All positions</h3>
              <p>Illustrated layout · individual fitments not supplied by the current ledger</p>
            </div>
            <span className="vtyres-badge">{all.length} positions</span>
          </div>
          <div className="vtyres-table-wrap">
            <table className="vtyres-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Axle</th>
                  <th>Tyre</th>
                  <th>Distance run</th>
                  <th>Tread depth</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {all.map((item) => (
                  <tr
                    key={item.code}
                    className={wheel.code === item.code ? 'vtyres-row--selected' : ''}
                  >
                    <td>
                      <button
                        className="vtyres-position-button"
                        onClick={() => setSelected(item.code)}
                        aria-pressed={wheel.code === item.code}
                      >
                        {item.code}
                      </button>
                    </td>
                    <td>{item.role}</td>
                    <td>Not recorded</td>
                    <td>—</td>
                    <td>—</td>
                    <td>
                      <span className="vtyres-badge">No position record</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PanelErrorBoundary>
  );
}
