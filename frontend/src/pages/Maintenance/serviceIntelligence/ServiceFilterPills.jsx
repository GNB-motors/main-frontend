import { Droplets, ShieldAlert, Zap, CalendarCheck } from 'lucide-react';

const ServiceFilterPills = ({ activeServiceFilter, setActiveServiceFilter, filterCounts }) => (
  <>
    <button
      type="button"
      className={`si-filter-pill ${activeServiceFilter === 'ALL' ? 'si-filter-pill--active' : ''}`}
      onClick={() => setActiveServiceFilter('ALL')}
    >
      <span>All Services</span>
      <span className="si-filter-pill-count">{filterCounts.all ?? 0}</span>
    </button>
    <button
      type="button"
      className={`si-filter-pill ${activeServiceFilter === 'PERIODIC' ? 'si-filter-pill--active' : ''}`}
      onClick={() => setActiveServiceFilter('PERIODIC')}
    >
      <CalendarCheck size={13} />
      <span>Periodic / Scheduled</span>
      <span className="si-filter-pill-count">{filterCounts.periodic ?? 0}</span>
    </button>
    <button
      type="button"
      className={`si-filter-pill ${activeServiceFilter === 'OIL' ? 'si-filter-pill--active' : ''}`}
      onClick={() => setActiveServiceFilter('OIL')}
    >
      <Droplets size={13} />
      <span>Oil & Lubrication</span>
      <span className="si-filter-pill-count">{filterCounts.oil ?? 0}</span>
    </button>
    <button
      type="button"
      className={`si-filter-pill ${activeServiceFilter === 'BRAKE' ? 'si-filter-pill--active' : ''}`}
      onClick={() => setActiveServiceFilter('BRAKE')}
    >
      <ShieldAlert size={13} />
      <span>Brakes & Suspension</span>
      <span className="si-filter-pill-count">{filterCounts.brake ?? 0}</span>
    </button>
    <button
      type="button"
      className={`si-filter-pill ${activeServiceFilter === 'ELECTRICAL' ? 'si-filter-pill--active' : ''}`}
      onClick={() => setActiveServiceFilter('ELECTRICAL')}
    >
      <Zap size={13} />
      <span>Electrical & Battery</span>
      <span className="si-filter-pill-count">{filterCounts.electrical ?? 0}</span>
    </button>
  </>
);

export default ServiceFilterPills;
