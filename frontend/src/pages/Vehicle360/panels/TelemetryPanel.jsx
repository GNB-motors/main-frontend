import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import useApi from '../../../hooks/useApi';
import FleetDataService from '../../../services/FleetDataService';
import DataTooltip from '../../../components/ui/DataTooltip';
import { formatNum, timeAgo } from '../../../utils/formatters';
import { formatDateIST, formatDateTimeIST } from '../../../utils/dateUtils';
import { OverviewCardSkeleton } from './overview/OverviewSkeleton';
import './overview/referenceOverview.css';
import './vehicleTelemetry.css';

const stamp = (value) =>
  value && Number.isFinite(new Date(value).getTime()) ? new Date(value).getTime() : null;
const dateTime = (value) => (stamp(value) != null ? formatDateTimeIST(value) : 'No timestamp');
const display = (reading) => {
  if (reading.value == null) return 'No data';
  if (reading.key === 'power')
    return reading.value === 1 || reading.value === true
      ? 'Connected'
      : reading.value === 0 || reading.value === false
        ? 'Disconnected'
        : String(reading.value);
  return typeof reading.value === 'number'
    ? formatNum(reading.value, { decimals: 1 })
    : String(reading.value);
};

export default function TelemetryPanel({ registrationNumber, assignedDriver }) {
  const telemetry = useApi(
    (signal) => FleetDataService.getVehicleTelemetry(registrationNumber, signal),
    [registrationNumber],
    { enabled: Boolean(registrationNumber), scopeKey: registrationNumber },
  );
  const channels = telemetry.data?.channels || [];
  const readings = telemetry.data?.readings || [];
  const dates = channels.map((channel) => stamp(channel.at)).filter((at) => at != null);
  const latest = dates.length ? Math.max(...dates) : null;
  const daysOld = latest != null ? Math.max(0, Math.floor((Date.now() - latest) / 86400000)) : null;
  const gps = channels.find((channel) => channel.key === 'position');
  const engine = channels.find((channel) => channel.key === 'odometer');
  const checks = [
    [
      'Confirm the truck’s location',
      'Compare the last position timestamp with the driver’s current location.',
    ],
    [
      'Check tracker power and connections',
      'If data is delayed, have the device power and CAN connections inspected.',
    ],
    [
      'Check connectivity with the provider',
      'Ask the provider to confirm device and SIM status when observations stop arriving.',
    ],
  ];
  return (
    <PanelErrorBoundary name="vehicle-telemetry">
      <div className="vdo-overview vtelemetry">
        {telemetry.loading && !telemetry.data ? (
          <div className="vtelemetry-top">
            <OverviewCardSkeleton />
            <OverviewCardSkeleton />
          </div>
        ) : telemetry.error ? (
          <>
            <section className="vdo-card">
              <div className="vtelemetry-head">
                <h3>Data connection</h3>
                <span className="vtelemetry-badge">Data unavailable</span>
              </div>
              <div className="vtelemetry-age">
                <strong>0</strong>
                <span>observations available</span>
              </div>
              <p>
                Telemetry could not be retrieved. Values below are placeholders until data is
                available.
              </p>
              <button className="vtelemetry-button" onClick={telemetry.refetch}>
                Refresh
              </button>
            </section>
            <section className="vdo-card">
              <div className="vtelemetry-head">
                <h3>Engine &amp; electrical · readings</h3>
                <span className="vtelemetry-badge">Data unavailable</span>
              </div>
              <div className="vtelemetry-readings">
                {[
                  ['Odometer', 'km'],
                  ['Engine hours', 'h'],
                  ['Engine speed', 'rpm'],
                  ['Gear', ''],
                  ['Coolant temperature', '°C'],
                  ['Exhaust temperature', '°C'],
                  ['Battery voltage', 'V'],
                  ['Diesel tank', 'L'],
                  ['DEF level', '%'],
                  ['Vehicle speed', 'km/h'],
                ].map(([label, unit]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <div>
                      <strong className="vtelemetry-muted">0</strong>
                      <span>{unit}</span>
                    </div>
                    <small>Data unavailable</small>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <div className="vtelemetry-top">
              <section className="vdo-card vtelemetry-connection">
                <div className="vtelemetry-head">
                  <div>
                    <div className="vtelemetry-title">
                      <h3>Data connection</h3>
                      <span
                        className={`vtelemetry-badge${daysOld != null && daysOld >= 1 ? ' vtelemetry-badge--warn' : ''}`}
                      >
                        {latest == null
                          ? 'No observations returned'
                          : daysOld >= 1
                            ? 'Historical observations'
                            : 'Recent observation available'}
                      </span>
                    </div>
                    <div className="vtelemetry-age">
                      <strong>
                        {latest == null
                          ? 'No timestamp'
                          : daysOld >= 1
                            ? `${daysOld} days`
                            : timeAgo(new Date(latest))}
                      </strong>
                      <span>
                        {latest != null
                          ? `since latest recorded channel data · ${dateTime(latest)}`
                          : 'Channel freshness cannot be determined'}
                      </span>
                    </div>
                  </div>
                  {assignedDriver?.mobileNumber ? (
                    <a className="vtelemetry-button" href={`tel:${assignedDriver.mobileNumber}`}>
                      Call driver
                    </a>
                  ) : null}
                </div>
                <div className="vtelemetry-channel-table">
                  <div className="vtelemetry-channel-heading">
                    <span>Channel</span>
                    <span>Stored observations · last 30 days</span>
                    <span>Last data</span>
                  </div>
                  {channels.map((channel) => (
                    <div className="vtelemetry-channel-row" key={channel.key}>
                      <span>
                        <b>{channel.name}</b>
                        <small>{channel.via}</small>
                      </span>
                      <span className="vtelemetry-cells">
                        {channel.days.map((day, index) => (
                          <button
                            key={day.day}
                            className={day.received ? 'vtelemetry-cell--received' : ''}
                            aria-label={`${channel.name} · ${day.day} · ${day.received ? 'Observation recorded' : 'No observation recorded'}`}
                          >
                            <DataTooltip
                              className={`vtelemetry-tooltip${index > 15 ? ' vtelemetry-tooltip--end' : ''}`}
                              aria-hidden="true"
                              label={channel.name}
                              details={[
                                formatDateIST(`${day.day}T12:00:00+05:30`),
                                day.received ? 'Observation recorded' : 'No observation recorded',
                              ]}
                            />
                          </button>
                        ))}
                      </span>
                      <span className="vtelemetry-last">
                        {stamp(channel.at) != null ? formatDateIST(channel.at) : 'Not available'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="vtelemetry-legend">
                  <span>
                    <i /> Observation recorded
                  </span>
                  <span>
                    <i /> No observation recorded
                  </span>
                </div>
                <p>{telemetry.data?.coverageNote}</p>
              </section>
              <section className="vdo-card vtelemetry-diagnosis">
                <span className="vtelemetry-eyebrow">✧ Connection checks</span>
                <p className="vtelemetry-diagnosis-lead">
                  {latest == null
                    ? 'There are no recorded channel timestamps to assess the connection.'
                    : `Position: ${gps?.at ? dateTime(gps.at) : 'not available'}. Engine odometer: ${engine?.at ? dateTime(engine.at) : 'not available'}.`}
                </p>
                <p>
                  Channel timestamps show when measurements were recorded. They do not establish
                  whether a delay comes from the device, network, provider or ingestion.
                </p>
                <div>
                  {checks.map(([title, note], index) => (
                    <div className="vtelemetry-check" key={title}>
                      <span>{index + 1}</span>
                      <div>
                        <b>{title}</b>
                        <p>{note}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <small>
                  Suggested checks only. No device fault has been diagnosed or maintenance job
                  created.
                </small>
              </section>
            </div>
            <section className="vdo-card">
              <div className="vtelemetry-head">
                <div>
                  <h3>Engine &amp; electrical · last known readings</h3>
                  <p>
                    Each value keeps its own sensor timestamp. Readings may come from different
                    reports.
                  </p>
                </div>
                <span className="vtelemetry-badge">Recorded values</span>
              </div>
              <div className="vtelemetry-readings">
                {readings.map((reading) => (
                  <div key={reading.key}>
                    <span>{reading.label}</span>
                    <div>
                      <strong className={reading.value == null ? 'vtelemetry-muted' : ''}>
                        {display(reading)}
                      </strong>
                      <span>{reading.value != null ? reading.unit : ''}</span>
                    </div>
                    <small>
                      {reading.value != null
                        ? dateTime(reading.at)
                        : 'No recorded reading returned'}
                    </small>
                    <small>{reading.source?.replace(/_/g, ' ') || 'Source unavailable'}</small>
                  </div>
                ))}
              </div>
              <div className="vtelemetry-note">
                Measurements are shown as reported. Missing engine hours, RPM, gear, battery state
                and temperature are not filled with estimates or normal-state defaults.
              </div>
            </section>
          </>
        )}
      </div>
    </PanelErrorBoundary>
  );
}
