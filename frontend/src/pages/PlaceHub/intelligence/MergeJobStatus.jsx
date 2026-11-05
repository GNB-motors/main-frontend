import { Button } from '../../../components/ui/button';

const stageText = {
  snapshot: 'Saving the original records',
  identity: 'Combining places',
  references: 'Updating location references',
  visits: 'Rebuilding visits',
  facilities: 'Updating facilities',
  ledger: 'Rebuilding movements',
  trips: 'Recalculating trips',
  routes: 'Rebuilding routes',
  registerMap: 'Updating register mappings',
  sap: 'Updating SAP comparisons',
  deliveryRoutes: 'Updating deliveries',
  corridors: 'Updating corridors',
  arrivalEvents: 'Updating arrival history',
  metrics: 'Recalculating plant statistics',
  cycles: 'Updating fuel cycles',
  plans: 'Updating planned trips',
  registerMatch: 'Updating register comparisons',
  lanes: 'Updating lane reports',
  attachments: 'Updating tolls and deviations',
  validate: 'Checking the results',
  complete: 'Recalculation complete',
  loadState: 'Updating load evidence',
  routeContext: 'Preparing route evidence',
  roadArrivals: 'Recalculating arrival evidence',
  reports: 'Refreshing stored reports',
  regions: 'Updating regions',
  loadEvidence: 'Updating place load evidence',
  placeLabels: 'Updating place labels',
  egressLoss: 'Updating exit fuel reports',
  homes: 'Updating home suggestions',
  zones: 'Updating delivery zones',
};

export default function MergeJobStatus({ job, error, onRetry }) {
  if (!job) return null;
  const finished = job.status === 'COMPLETE';
  const failed = job.status === 'FAILED';
  const review = job.stages?.validate?.result?.reviewRequired || 0;
  return (
    <section className="sap-card sap-stack" role="status" aria-live="polite">
      <strong>
        {finished
          ? job.direction === 'UNDO'
            ? 'Merge undone and results recalculated'
            : 'Places merged and results recalculated'
          : failed
            ? 'Recalculation needs attention'
            : 'Recalculating places and trips'}
      </strong>
      <p>{stageText[job.stage] || 'Waiting for recalculation to start'}</p>
      {!finished && (
        <p>
          Related results will be available when recalculation finishes. You can leave this page and
          return.
        </p>
      )}
      {review > 0 && (
        <p>
          {review} historical trip results need review. Original records and human decisions were
          preserved where automatic correction was not possible.
        </p>
      )}
      {(job.error || error) && <p role="alert">{job.error || error}</p>}
      {failed && job.active !== false && onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Retry recalculation
        </Button>
      )}
    </section>
  );
}
