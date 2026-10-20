import { Pause, PhoneCall, CalendarCheck, CircleDot } from 'lucide-react';
import StatTile from '../../components/Erp/StatTile';

const ScheduleStatTiles = ({ stats, loading }) => (
  <div className="erp-stat-grid" style={{ marginTop: 20 }}>
    <StatTile
      label="Active accounts"
      value={stats.activeSchedules}
      icon={CircleDot}
      loading={loading}
      derived
    />
    <StatTile
      label="Calls planned this week"
      value={stats.callsThisWeek}
      sublabel="Schedule occurrences, not open tasks"
      icon={CalendarCheck}
      loading={loading}
      derived
    />
    <StatTile
      label="Due today"
      value={stats.dueToday}
      sublabel={stats.completedToday ? `${stats.completedToday} already logged` : null}
      sublabelTone={stats.dueToday > 0 ? 'warning' : null}
      icon={PhoneCall}
      to="/erp/call-tasks"
      cta="Open tasks"
    />
    <StatTile
      label="Paused"
      value={stats.pausedSchedules}
      sublabel={stats.pausedSchedules > 0 ? 'Generating no tasks' : null}
      icon={Pause}
      loading={loading}
      derived
    />
  </div>
);

export default ScheduleStatTiles;
