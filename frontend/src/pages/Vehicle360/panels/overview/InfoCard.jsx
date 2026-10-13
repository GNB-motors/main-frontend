import { documentSummary } from '../../vehicle360Logic';
import CardHead from './CardHead';
import InfoRow from './InfoRow';

/**
 * Compact document list — the same rows `DocumentsPanel` shows on the
 * Documents tab, just capped and linked out rather than duplicating the
 * upload/manage flow here.
 */
export default function InfoCard({ documents, onGoDocuments }) {
  const rows = documents || [];
  const summary = documentSummary(rows);

  return (
    <section className="v360-card">
      <CardHead
        title="Info"
        action={
          <button type="button" className="v360-link" onClick={onGoDocuments}>
            Manage →
          </button>
        }
      />
      {rows.length === 0 ? (
        <div className="v360-empty">
          <span className="v360-empty-title">No documents on record</span>
          <span className="v360-empty-hint">
            RC, insurance, fitness and permits appear here once uploaded.
          </span>
        </div>
      ) : (
        <>
          <span
            className={`v360-pill v360-pill--${summary.expired > 0 ? 'crit' : summary.expiring > 0 ? 'warn' : 'ok'}`}
          >
            <span className="v360-pill-dot" aria-hidden="true" />
            {summary.expired > 0
              ? `${summary.expired} expired`
              : summary.expiring > 0
                ? `${summary.expiring} expiring soon`
                : 'All current'}
          </span>
          <dl className="v360-kv">
            {rows.slice(0, 4).map((d) => (
              <InfoRow key={d.docType} docType={d.docType} expiryDate={d.expiryDate} />
            ))}
          </dl>
        </>
      )}
    </section>
  );
}
