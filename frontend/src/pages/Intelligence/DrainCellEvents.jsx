import { trackLink } from '../../utils/redesign/links';
import { Link } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import { formatDateTimeIST } from '../../utils/dateUtils';
import { formatLitres } from './intelligenceFormat';

export default function DrainCellEvents({ cell, onClear }) {
  return (
    <section className="intel-fuel-log">
      <div className="flex items-center justify-between gap-3 py-3">
        <p>Parked drops and theft alerts in the selected map cell · {cell.events} events</p>
        <button type="button" className="pshell-btn" onClick={onClear}>
          Show balance windows
        </button>
      </div>
      <DataTable
        rows={cell.records || []}
        rowKey={(r) => r.id}
        columns={[
          { key: 'registrationNumber', label: 'Truck' },
          {
            key: 'startAt',
            label: 'Recorded at (IST)',
            render: (r) => formatDateTimeIST(r.startAt),
          },
          { key: 'source', label: 'Evidence' },
          { key: 'litres', label: 'Sensor drop', render: (r) => formatLitres(r.litres) },
          {
            key: 'replay',
            label: '',
            render: (r) =>
              r.registrationNumber && r.startAt ? (
                <Link to={trackLink({ reg: r.registrationNumber, at: r.startAt })}>
                  View at event time
                </Link>
              ) : (
                'Time unavailable'
              ),
          },
        ]}
        emptyTitle="Event evidence unavailable"
      />
    </section>
  );
}
