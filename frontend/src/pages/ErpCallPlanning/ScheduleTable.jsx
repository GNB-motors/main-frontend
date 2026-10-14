import { Pencil, Pause, Play, History, Trash2 } from 'lucide-react';
import RowMenu from '../../components/Erp/RowMenu';
import { kamName, relativeDate, scheduleLabel, shortDate } from './callSchedule.utils';

const ScheduleTable = ({ filtered, setDetail, openEdit, handleToggleStatus, setDeleteTarget }) => (
  <div className="erp-table-scroll">
    <table className="erp-table">
      <thead>
        <tr>
          <th>Account</th>
          <th>KAM</th>
          <th>Calling schedule</th>
          <th>Next call</th>
          <th>Last call</th>
          <th>Status</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {filtered.map((s) => {
          const paused = s.status === 'PAUSED';
          return (
            <tr key={s._id} className="clickable" onClick={() => setDetail(s)}>
              <td>
                <div className="erp-cell-strong">{s.partyId?.name || '—'}</div>
                {s.partyId?.code && <div className="erp-cell-muted">{s.partyId.code}</div>}
              </td>
              <td>{kamName(s.kamId)}</td>
              <td>
                <div>{scheduleLabel(s.daysOfWeek)}</div>
                <div className="erp-cell-muted">{s.daysOfWeek?.length || 0}× / week</div>
              </td>
              <td>
                {s.nextCallDate ? (
                  relativeDate(s.nextCallDate)
                ) : (
                  <span className="erp-cell-muted">Not scheduled</span>
                )}
              </td>
              <td>
                {s.lastCall ? (
                  <>
                    <div>{shortDate(s.lastCall.date)}</div>
                    <div className="erp-cell-muted">
                      {s.lastCall.outcome?.replace(/_/g, ' ').toLowerCase() || '—'}
                    </div>
                  </>
                ) : (
                  <span className="erp-cell-muted">Never called</span>
                )}
              </td>
              <td>
                <span className={`erp-badge ${paused ? 'warning' : 'active'}`}>
                  {paused ? 'Paused' : 'Active'}
                </span>
                {paused && (
                  <div className="erp-cell-muted" style={{ marginTop: 2 }}>
                    {s.pausedUntil ? `Resumes ${shortDate(s.pausedUntil)}` : 'Creating no tasks'}
                  </div>
                )}
              </td>
              <td onClick={(e) => e.stopPropagation()}>
                <RowMenu
                  label={`Actions for ${s.partyId?.name || 'schedule'}`}
                  items={[
                    {
                      key: 'history',
                      label: 'View call history',
                      icon: History,
                      onSelect: () => setDetail(s),
                    },
                    {
                      key: 'edit',
                      label: 'Edit schedule',
                      icon: Pencil,
                      onSelect: () => openEdit(s),
                    },
                    {
                      key: 'status',
                      label: paused ? 'Resume schedule' : 'Pause schedule',
                      icon: paused ? Play : Pause,
                      onSelect: () => handleToggleStatus(s),
                    },
                    {
                      key: 'delete',
                      label: 'Delete schedule',
                      icon: Trash2,
                      tone: 'danger',
                      onSelect: () => setDeleteTarget(s),
                    },
                  ]}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default ScheduleTable;
