import { useMemo } from 'react';
import {
  Check,
  Wrench,
  Clock,
  FileWarning,
  FileText,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { formatKm } from '../../../utils/formatters';
import { formatDateIST } from '../../../utils/dateUtils';
import { DAY_MS } from './digestDates';

const UPCOMING_BUCKETS = [
  { key: 'today', l: 'Today', s: 0, e: 0, range: 'Due today' },
  { key: 'tomorrow', l: 'Tomorrow', s: 1, e: 1, range: 'Due tomorrow' },
  { key: 'this-week', l: 'This week', s: 2, e: 7, range: 'In 2–7 days' },
  { key: 'next-week', l: 'Next week', s: 8, e: 14, range: 'In 8–14 days' },
];

export default function NdUpcomingCard({ upcoming, onOpenVehicle }) {
  const activeBuckets = useMemo(() => {
    return UPCOMING_BUCKETS.map((b) => ({
      ...b,
      rows: (upcoming || []).filter((u) => u.days >= b.s && u.days <= b.e),
    })).filter((b) => b.rows.length > 0);
  }, [upcoming]);

  const serviceCount = (upcoming || []).filter((u) => u.kind === 'Service').length;
  const docCount = (upcoming || []).filter((u) => u.kind !== 'Service').length;

  return (
    <div className="nd-card" id="nd-upcoming-card">
      <div className="nd-card-head nd-up-head">
        <div className="nd-up-title-block">
          <div className="nd-up-title-row">
            <span className="nd-up-title-ico">
              <CalendarIcon size={16} />
            </span>
            <h2>Upcoming</h2>
            <span className="nd-count-pill">{upcoming.length}</span>
            {serviceCount > 0 && (
              <span className="nd-up-metric-pill nd-up-metric-pill--service">
                <Wrench size={11} />
                <span>{serviceCount} service</span>
              </span>
            )}
            {docCount > 0 && (
              <span className="nd-up-metric-pill nd-up-metric-pill--doc">
                <FileWarning size={11} />
                <span>{docCount} documents</span>
              </span>
            )}
          </div>
          <span className="nd-hint">
            Next 14 days · scheduled maintenance &amp; document expiries
          </span>
        </div>
        <span className="nd-sp" />
        <span className="nd-up-range-pill">
          <Clock size={12} />
          <span>Next 14 days</span>
        </span>
      </div>

      {upcoming.length === 0 ? (
        <div className="nd-empty">
          <span className="nd-ok">
            <Check size={22} />
          </span>
          <b>No upcoming service items</b>
          <span>Service and document reminders will surface here as due dates approach.</span>
        </div>
      ) : (
        <div
          className={`nd-upgrid ${activeBuckets.length === 1 ? 'nd-upgrid--single' : ''}`}
          style={{ '--up-cols': activeBuckets.length }}
        >
          {activeBuckets.map((b) => (
            <div key={b.key} className="nd-daygroup">
              <div className="nd-dghead">
                <div className="nd-dghead-left">
                  <span className="nd-dg-dot" />
                  <span className="nd-t">{b.l}</span>
                  <span className="nd-dg-count">
                    {b.rows.length} item{b.rows.length > 1 ? 's' : ''}
                  </span>
                </div>
                <span className="nd-dg-range">{b.range}</span>
              </div>
              <div className="nd-daygroup-list">
                {b.rows.map((u) => {
                  const isService = u.kind === 'Service';
                  const Icon = isService ? Wrench : u.icon || FileText;
                  let riskLabel = null;
                  let riskClass = 'upcoming';
                  if (u.risk === 'DUE_SOON') {
                    riskLabel = 'Due soon';
                    riskClass = 'due-soon';
                  } else if (u.risk === 'OVERDUE') {
                    riskLabel = 'Overdue';
                    riskClass = 'overdue';
                  } else if (u.risk) {
                    riskLabel = u.risk.toLowerCase().replace(/_/g, ' ');
                    riskClass = u.risk.toLowerCase().replace(/_/g, '-');
                  } else if (!isService && u.days <= 7) {
                    riskLabel = 'Expiring';
                    riskClass = 'due-soon';
                  }

                  const when =
                    u.days === 0
                      ? 'Today'
                      : u.days === 1
                        ? 'Tomorrow'
                        : formatDateIST(new Date(Date.now() + u.days * DAY_MS).toISOString());

                  return (
                    <button
                      key={u.id}
                      type="button"
                      className="nd-upcard"
                      onClick={() => onOpenVehicle(u.registrationNumber)}
                      title={`View ${u.registrationNumber} details`}
                    >
                      <div className="nd-upcard-top">
                        <div className="nd-upcard-veh">
                          <span
                            className={`nd-upcard-ico nd-upcard-ico--${isService ? 'service' : 'doc'}`}
                          >
                            <Icon size={13} />
                          </span>
                          <span className="nd-upcard-plate">{u.registrationNumber}</span>
                          <span className="nd-upcard-kind">{u.kind}</span>
                        </div>
                        {riskLabel && (
                          <div className="nd-upcard-badges">
                            <span className={`nd-upcard-risk nd-upcard-risk--${riskClass}`}>
                              <i className="nd-upcard-risk-dot" />
                              {riskLabel}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="nd-upcard-bot">
                        <div className="nd-upcard-metric">
                          {u.kmUntilDue != null ? (
                            <>
                              <span className="nd-upcard-metric-val">{formatKm(u.kmUntilDue)}</span>
                              <span className="nd-upcard-metric-lbl">remaining</span>
                            </>
                          ) : u.projectedServiceDueOdometer != null ? (
                            <>
                              <span className="nd-upcard-metric-lbl">due at</span>
                              <span className="nd-upcard-metric-val">
                                {formatKm(u.projectedServiceDueOdometer)}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="nd-upcard-metric-lbl">expires in</span>
                              <span className="nd-upcard-metric-val">
                                {u.days} day{u.days === 1 ? '' : 's'}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="nd-upcard-date">
                          <Clock size={11} />
                          <span>{when}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
