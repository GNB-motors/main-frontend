import { Link } from 'react-router-dom';
import { trackAlertView, truckOwnerAlertsLink } from './trackAlertPresentation';
import './VehicleAlertSummary.css';

export default function VehicleAlertSummary({
  alerts = [],
  registrationNumber,
  showHeading = true,
}) {
  if (!alerts.length) return null;
  return (
    <section className="lt-truck-alerts" aria-label="Truck alerts to review">
      {showHeading ? (
        <div>
          <h3>Alerts to review · {alerts.length}</h3>
          <p className="lt-truck-alert-window">Unacknowledged · last 24 hours</p>
        </div>
      ) : null}
      <ul className="lt-truck-alert-list">
        {alerts.map((alert) => {
          const view = trackAlertView(alert);
          return (
            <li key={alert.id || alert._id}>
              <div className="lt-truck-alert-heading">
                <strong>{view.title}</strong>
                {view.severity ? <span>{view.severity.toLowerCase()}</span> : null}
              </div>
              <p className="lt-truck-alert-reason">{view.message}</p>
              {alert.billCheck?.reason ? (
                <p className="lt-truck-alert-reason">{alert.billCheck.reason}</p>
              ) : null}
              {alert.resolutionNote ? (
                <p className="lt-truck-alert-reason">{alert.resolutionNote}</p>
              ) : null}
              <time dateTime={view.at || undefined}>{view.timeLabel}</time>
            </li>
          );
        })}
      </ul>
      <Link to={truckOwnerAlertsLink(alerts[0]?.vehicleNumber || registrationNumber)}>
        Review this truck&apos;s alerts
      </Link>
    </section>
  );
}
