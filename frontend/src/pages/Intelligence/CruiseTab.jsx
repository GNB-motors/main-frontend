import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { formatDuration, formatPct } from '@/utils/redesign/format';
import IntelligenceService from './IntelligenceService';
import IntelligenceDataState from './IntelligenceDataState';
import IntelCard from './IntelCard';
import InstancesTab from './InstancesTab';

function CruiseShare({ from, to, vehicle }) {
  const { data, loading, error, refetch } = useApi(
    (signal) => IntelligenceService.getCruiseShare({ from, to, vehicle, signal }),
    [from, to, vehicle],
    { scopeKey: `${from}:${to}:${vehicle}` },
  );
  const rows = data?.items || [];
  return (
    <IntelligenceDataState
      loading={loading}
      error={error}
      isEmpty={!rows.length}
      emptyMessage="No consecutive engine readings with a drive gear for these dates."
      what="Cruise share"
      onRetry={refetch}
    >
      <IntelCard title="Share of recorded driving time in the cruise band">
        <p>900–1,700 rpm with a drive gear engaged. Gaps over five minutes are excluded.</p>
        <table className="intel-table">
          <thead>
            <tr>
              <th>Truck</th>
              <th>Cruise share</th>
              <th>Recorded driving</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.registrationNumber}>
                <th scope="row">{row.registrationNumber}</th>
                <td>
                  <span className="intel-score">
                    <span className="intel-score-bar" aria-hidden="true">
                      <span style={{ width: `${row.cruisePct}%` }} />
                    </span>
                    {formatPct(row.cruisePct)}
                  </span>
                </td>
                <td>{formatDuration(row.drivingMinutes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </IntelCard>
    </IntelligenceDataState>
  );
}

export default function CruiseTab({ from, to, vehicle, driver }) {
  const [showReadings, setShowReadings] = useState(false);
  if (driver)
    return <InstancesTab kind="cruise" from={from} to={to} vehicle={vehicle} driver={driver} />;
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        className="intel-link self-start"
        onClick={() => setShowReadings(!showReadings)}
      >
        {showReadings ? 'View cruise share' : 'View engine readings'}
      </button>
      {showReadings ? (
        <InstancesTab kind="cruise" from={from} to={to} vehicle={vehicle} />
      ) : (
        <CruiseShare from={from} to={to} vehicle={vehicle} />
      )}
    </div>
  );
}
