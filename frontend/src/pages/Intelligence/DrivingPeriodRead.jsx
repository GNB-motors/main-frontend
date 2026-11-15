import { useApi } from '@/hooks/useApi';
import { formatDuration, formatInr, formatNumber } from '@/utils/redesign/format';
import IntelligenceService from './IntelligenceService';
import { humanizeDates } from './intelligenceModel';
import { truncatedNote } from './truncatedLists';
import './reportCardsReference.css';
import './drivingReference.css';
import '../Vehicle360/panels/overview/referenceOverview.css';

const LABELS = {
  idle: 'idle events',
  overspeed: 'overspeed stretches',
  detour: 'detours',
  cruise: 'cruise readings',
  gear: 'gear readings',
};

export function DrivingPeriodRead({
  kind,
  summary,
  total,
  truncated = [],
  loading = false,
  error = null,
  held = null,
}) {
  const ready = !loading && !error && !held;
  const count = ready ? summary?.count : null;
  const truncatedText = truncatedNote(truncated);
  return (
    <section
      className="intel-assessment-briefing"
      aria-label="Driving period read"
      aria-busy={loading}
    >
      <div className="intel-assessment-brief-copy">
        <span>✧ Period read</span>
        <p>
          {loading
            ? 'Loading recorded driving activity…'
            : error
              ? 'The driving summary is unavailable.'
              : held?.text || (
                  <>
                    {count != null ? (
                      <>
                        <b>{formatNumber(count)}</b> {LABELS[kind] || 'events'} recorded in the
                        selected period.
                      </>
                    ) : (
                      'The event count is not available for this period.'
                    )}
                  </>
                )}
        </p>
        <small>
          {ready
            ? humanizeDates(summary?.why?.text) ||
              'Based on recorded driving events in the selected period.'
            : 'Unavailable measurements are shown as a dash.'}
        </small>
        {ready && summary?.why?.basis ? <small>{humanizeDates(summary.why.basis)}</small> : null}
        {truncatedText ? <small>{truncatedText}</small> : null}
      </div>
      <div className="intel-assessment-brief-kpis">
        {[
          ['Recorded events', count == null ? '—' : formatNumber(count), 'Selected period'],
          [
            'Duration',
            ready && summary?.totalMin != null ? formatDuration(summary.totalMin) : '—',
            'in total',
          ],
          [
            'Fuel used',
            ready && summary?.totalL != null
              ? `${formatNumber(summary.totalL, { digits: 1 })} L`
              : '—',
            'Recorded fuel estimate',
          ],
          [
            'Estimated cost',
            ready && summary?.totalInr != null ? formatInr(summary.totalInr) : '—',
            total == null
              ? 'Recorded events'
              : `${formatNumber(total)} ${total === 1 ? 'event record' : 'event records'}`,
          ],
        ].map(([label, value, note]) => (
          <div className="intel-driving-kpi" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DrivingBriefing({ kind, from, to, vehicle = '', driver = '' }) {
  const { data, loading, error } = useApi(
    (signal) =>
      IntelligenceService.getInstances({
        kind,
        from,
        to,
        vehicle,
        driver,
        page: 1,
        limit: 1,
        signal,
      }),
    [kind, from, to, vehicle, driver],
    { scopeKey: `${kind}:${from}:${to}:${vehicle}:${driver}` },
  );
  return (
    <DrivingPeriodRead
      kind={kind}
      summary={data?.summary}
      total={data?.total}
      truncated={data?.truncated}
      loading={loading}
      error={error}
      held={data?.held ? data.why : null}
    />
  );
}
