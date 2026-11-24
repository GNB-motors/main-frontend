import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import useApi from '../../../hooks/useApi';
import FleetDataService from '../../../services/FleetDataService';
import { formatNum, timeAgo } from '../../../utils/formatters';
import { formatDateTimeIST } from '../../../utils/dateUtils';
import TelemetryHistory from './TelemetryHistory';
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
          <section className="vdo-card" role="alert">
            <h3>Could not load telemetry</h3>
            <button type="button" className="vtelemetry-button" onClick={telemetry.refetch}>
              Try again
            </button>
          </section>
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
                    <span>Last data</span>
                  </div>
                  {channels.map((channel) => (
                    <div className="vtelemetry-channel-row" key={channel.key}>
                      <b>{channel.name}</b>
                      <span className="vtelemetry-last">
                        {stamp(channel.at) != null ? (
                          <time
                            dateTime={new Date(channel.at).toISOString()}
                            title={dateTime(channel.at)}
                          >
                            {timeAgo(new Date(channel.at))}
                          </time>
                        ) : (
                          'No reading recorded'
                        )}
                      </span>
                    </div>
                  ))}
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
        <TelemetryHistory key={registrationNumber} registrationNumber={registrationNumber} />
      </div>
    </PanelErrorBoundary>
  );
}
