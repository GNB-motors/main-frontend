import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ErpDrawer from '../../components/Erp/ErpDrawer';
import ErpCallService from './ErpCallService';
import {
  kamName, relativeDate, scheduleLabel, shortDate, taskState,
} from './callSchedule.utils';

const Row = ({ label, children }) => (
  <div className="erp-detail-row">
    <span className="erp-detail-label">{label}</span>
    <span className="erp-detail-value">{children}</span>
  </div>
);

/**
 * What a schedule actually looks like in practice: the configuration on top, the
 * last ten calls underneath. The configuration alone never answered "is this
 * account being worked?" — a schedule can be perfectly set up and every task
 * closed as NOT_CALLED for a month.
 */
const ScheduleDetailDrawer = ({ schedule, onClose, onEdit }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const partyId = schedule?.partyId?._id || schedule?.partyId || null;

  const fetchHistory = useCallback(async () => {
    if (!partyId) return;
    setLoading(true);
    try {
      const res = await ErpCallService.getTasks({ partyId, limit: 10 });
      setHistory(res.data || []);
    } catch {
      // A failed history load must not blank the configuration above it, which
      // is the part the user opened this drawer to see.
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [partyId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (!schedule) return null;

  const paused = schedule.status === 'PAUSED';

  return (
    <ErpDrawer
      isOpen
      onClose={onClose}
      title={schedule.partyId?.name || 'Calling schedule'}
      subtitle={schedule.partyId?.code || undefined}
      maxWidth="560px"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onEdit(schedule)}>
            Edit schedule
          </button>
        </>
      }
    >
      <div className="erp-detail-block">
        <Row label="Owner">{kamName(schedule.kamId)}</Row>
        <Row label="Frequency">
          {schedule.daysOfWeek?.length || 0} call
          {schedule.daysOfWeek?.length === 1 ? '' : 's'} a week
        </Row>
        <Row label="Call days">{scheduleLabel(schedule.daysOfWeek)}</Row>
        <Row label="Next call">
          {schedule.nextCallDate ? (
            relativeDate(schedule.nextCallDate)
          ) : (
            <span className="erp-cell-muted">Not scheduled</span>
          )}
        </Row>
        <Row label="Status">
          <span className={`erp-badge ${paused ? 'warning' : 'active'}`}>
            {paused ? 'Paused' : 'Active'}
          </span>
          {paused && (
            <span className="erp-cell-muted" style={{ marginLeft: 8 }}>
              {schedule.pausedUntil
                ? `Resumes ${shortDate(schedule.pausedUntil)}`
                : "Tasks won't be generated"}
            </span>
          )}
        </Row>
      </div>

      <h3 className="erp-detail-heading">Recent calls</h3>

      {loading ? (
        <p className="erp-cell-muted">Loading call history…</p>
      ) : history.length === 0 ? (
        <p className="erp-cell-muted">
          No calls logged yet. The first task opens on {relativeDate(schedule.nextCallDate)}.
        </p>
      ) : (
        <div className="erp-table-scroll">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>KAM</th>
                <th>Status</th>
                <th>Outcome</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {history.map((t) => (
                <tr key={t._id}>
                  <td>{shortDate(t.scheduledDate)}</td>
                  <td>{kamName(t.kamId)}</td>
                  <td>
                    <span className={`erp-badge ${t.status === 'OPEN' ? 'open' : 'neutral'}`}>
                      {t.status === 'OPEN' ? 'Open' : 'Closed'}
                    </span>
                  </td>
                  <td>
                    {t.outcome ? (
                      <span className={`erp-badge ${taskState(t).tone}`}>
                        {taskState(t).label}
                      </span>
                    ) : (
                      <span className="erp-cell-muted">Not yet recorded</span>
                    )}
                  </td>
                  <td className="erp-cell-muted">{t.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link className="erp-inline-link" to="/erp/call-tasks" style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        Open call tasks <ArrowRight size={14} />
      </Link>

      <div className="erp-detail-audit">
        Created {shortDate(schedule.createdAt)}
        {schedule.updatedAt && schedule.updatedAt !== schedule.createdAt && (
          <>
            {' · '}last updated {shortDate(schedule.updatedAt)}
            {schedule.updatedBy && ` by ${kamName(schedule.updatedBy)}`}
          </>
        )}
      </div>
    </ErpDrawer>
  );
};

export default ScheduleDetailDrawer;
