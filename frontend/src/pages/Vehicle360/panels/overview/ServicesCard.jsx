import { formatKm } from '../../../../utils/formatters';
import { serviceState } from '../../vehicle360Logic';
import { Ring } from '../../vehicle360Header';
import CardHead from './CardHead';

/** "Last check-in" donut — the service-interval ring, restyled with the odometer it was last serviced at. */
export default function ServicesCard({ prediction }) {
  const svc = serviceState(prediction);
  return (
    <section className="v360-card">
      <CardHead title="Services" />
      <Ring
        pct={svc.overdue ? 1 : svc.level === 'none' ? 0 : 0.6}
        dashed={svc.level === 'none'}
        stroke={svc.overdue ? 'var(--red)' : svc.level === 'none' ? 'var(--grey)' : 'var(--green)'}
        ink={svc.overdue ? 'var(--red-ink)' : 'var(--ink3)'}
        big={
          prediction?.lastServiceOdometer != null ? formatKm(prediction.lastServiceOdometer) : '—'
        }
        label="Last check-in"
        sub={
          prediction?.lastServiceOdometer != null
            ? 'odometer at last service'
            : 'no service record yet'
        }
      />
    </section>
  );
}
