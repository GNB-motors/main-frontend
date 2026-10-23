import { Wrench, AlertTriangle, AlertOctagon, CheckCircle2, Check } from 'lucide-react';

const RepairFilterPills = ({ activePriorityFilter, setActivePriorityFilter, filterCounts }) => (
  <>
    <button
      type="button"
      className={`si-filter-pill ${activePriorityFilter === 'ALL' ? 'si-filter-pill--active' : ''}`}
      onClick={() => setActivePriorityFilter('ALL')}
    >
      <span>All Issues</span>
      <span className="si-filter-pill-count">{filterCounts.all ?? 0}</span>
    </button>
    <button
      type="button"
      className={`si-filter-pill ${activePriorityFilter === 'P0' ? 'si-filter-pill--active' : ''}`}
      onClick={() => setActivePriorityFilter('P0')}
      style={activePriorityFilter !== 'P0' ? { borderColor: '#fca5a5', color: '#dc2626' } : {}}
    >
      <AlertOctagon size={13} color={activePriorityFilter === 'P0' ? '#fff' : '#dc2626'} />
      <span>P0 Critical (Axle / Engine / Brakes)</span>
      <span className="si-filter-pill-count">{filterCounts.p0 ?? 0}</span>
    </button>
    <button
      type="button"
      className={`si-filter-pill ${activePriorityFilter === 'P1' ? 'si-filter-pill--active' : ''}`}
      onClick={() => setActivePriorityFilter('P1')}
      style={activePriorityFilter !== 'P1' ? { borderColor: '#fdba74', color: '#ea580c' } : {}}
    >
      <AlertTriangle size={13} color={activePriorityFilter === 'P1' ? '#fff' : '#ea580c'} />
      <span>P1 High (Clutch / Suspension)</span>
      <span className="si-filter-pill-count">{filterCounts.p1 ?? 0}</span>
    </button>
    <button
      type="button"
      className={`si-filter-pill ${activePriorityFilter === 'P2' ? 'si-filter-pill--active' : ''}`}
      onClick={() => setActivePriorityFilter('P2')}
      style={activePriorityFilter !== 'P2' ? { borderColor: '#fde047', color: '#ca8a04' } : {}}
    >
      <Wrench size={13} color={activePriorityFilter === 'P2' ? '#fff' : '#ca8a04'} />
      <span>P2 Medium (Tyres / Roadside)</span>
      <span className="si-filter-pill-count">{filterCounts.p2 ?? 0}</span>
    </button>
    <button
      type="button"
      className={`si-filter-pill ${activePriorityFilter === 'P3' ? 'si-filter-pill--active' : ''}`}
      onClick={() => setActivePriorityFilter('P3')}
      style={activePriorityFilter !== 'P3' ? { borderColor: '#86efac', color: '#16a34a' } : {}}
    >
      <CheckCircle2 size={13} color={activePriorityFilter === 'P3' ? '#fff' : '#16a34a'} />
      <span>P3 Routine / Minor</span>
      <span className="si-filter-pill-count">{filterCounts.p3 ?? 0}</span>
    </button>
    <div
      style={{
        width: 1,
        height: 22,
        background: '#e2e8f0',
        margin: '0 4px',
        flexShrink: 0,
      }}
    />
    <button
      type="button"
      className={`si-filter-pill ${activePriorityFilter === 'OPEN' ? 'si-filter-pill--active' : ''}`}
      onClick={() => setActivePriorityFilter('OPEN')}
      style={activePriorityFilter !== 'OPEN' ? { borderColor: '#fecdd3', color: '#e11d48' } : {}}
    >
      <span className="si-status-dot" />
      <span>Open Issues</span>
      <span className="si-filter-pill-count">{filterCounts.open ?? 0}</span>
    </button>
    <button
      type="button"
      className={`si-filter-pill ${activePriorityFilter === 'RESOLVED' ? 'si-filter-pill--active' : ''}`}
      onClick={() => setActivePriorityFilter('RESOLVED')}
      style={
        activePriorityFilter !== 'RESOLVED' ? { borderColor: '#bbf7d0', color: '#16a34a' } : {}
      }
    >
      <Check size={13} color={activePriorityFilter === 'RESOLVED' ? '#fff' : '#16a34a'} />
      <span>Resolved</span>
      <span className="si-filter-pill-count">{filterCounts.resolved ?? 0}</span>
    </button>
  </>
);

export default RepairFilterPills;
