import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import PageShell from '../../components/ui/PageShell';
import EmptyState from '../../components/cluster/EmptyState';
import ServiceBillService from '../../services/ServiceBillService';
import BillReviewModal from './BillReviewModal.jsx';
import {
  buildQueueRows,
  CONFIDENCE_BAND_LABEL,
  formatLineItemAmount,
  scanStatusLabel,
} from './serviceBillFields';
import './ServiceBillsPage.css';

/**
 * Service bills — the queue of workshop bills that came off a photo.
 *
 * Every figure on this page is a claim. The queue says how many fields were read
 * and how many were not, because a bill that was only half read is the normal
 * case, not an error. Opening a row shows the photo next to the extractor's
 * reading, with the confidence that came with each figure, and the record's own
 * figure beside it wherever the two disagree.
 */
const ServiceBillsPage = () => {
  const [bills, setBills] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showReviewed, setShowReviewed] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [floor, setFloor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, settings] = await Promise.all([
        ServiceBillService.listBills({ reviewed: showReviewed ? 'true' : 'false', limit: 50 }),
        ServiceBillService.getBillSettings(),
      ]);
      setBills(list.data);
      setMeta(list.meta);
      setFloor(settings?.minFieldConfidence ?? null);
    } catch (err) {
      setError(err?.message || 'Could not load bills');
    } finally {
      setLoading(false);
    }
  }, [showReviewed]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => buildQueueRows(bills), [bills]);

  return (
    <PageShell
      title="Service bills"
      count={meta?.total ?? rows.length}
      subtitle="Bills read from a photo. Nothing here is applied to a maintenance record until someone accepts it."
      actions={
        <button type="button" className="pshell-btn" onClick={load}>
          Refresh
        </button>
      }
      filters={
        <div className="sbills-filters">
          <label className="sbills-toggle">
            <input
              type="checkbox"
              checked={showReviewed}
              onChange={(e) => setShowReviewed(e.target.checked)}
            />
            Show already reviewed
          </label>
          <span className="sbills-floor">
            {floor === null
              ? 'No confidence floor set — every figure is shown with the confidence the extractor reported'
              : `Confidence floor ${floor}% — figures read below it are held back and shown as unread`}
          </span>
        </div>
      }
      footer={
        meta
          ? `Showing ${rows.length} of ${meta.total} bills`
          : `${rows.length} bill${rows.length === 1 ? '' : 's'}`
      }
    >
      {error ? (
        <EmptyState
          title="Bills could not be loaded"
          hint={`${error}. The bills themselves are safe — reload to try again.`}
          action={
            <button type="button" className="pshell-btn pshell-btn--primary" onClick={load}>
              Reload
            </button>
          }
        />
      ) : loading ? (
        <div className="sbills-loading">Loading bills…</div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={showReviewed ? 'No reviewed bills yet' : 'No bills waiting to be read'}
          hint={
            showReviewed
              ? 'Bills appear here once someone has accepted, corrected or kept their figures.'
              : 'Upload a workshop bill photo against a vehicle and it lands here with each figure it read, and the reason for each one it could not.'
          }
        />
      ) : (
        <table className="sbills-table">
          <thead>
            <tr>
              <th>Uploaded</th>
              <th>Vehicle</th>
              <th>Read</th>
              <th>Workshop</th>
              <th>Bill total</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.needsReview ? 'sbills-row--open' : ''}>
                <td>{row.uploadedAt ? new Date(row.uploadedAt).toLocaleDateString('en-IN') : '—'}</td>
                <td className="num">{row.vehicleId?.slice(-6) || '—'}</td>
                <td className="num">
                  {row.fieldsRead}/{row.fieldsTotal} fields
                </td>
                <td>{row.vendor || <span className="sbills-muted">not read</span>}</td>
                <td>
                  {row.total ? (
                    <span className={`sbills-amount sbills-amount--${row.totalBand}`}>
                      {row.total}
                      <span className="sbills-confidence">
                        {row.totalConfidence ?? '—'}% · {CONFIDENCE_BAND_LABEL[row.totalBand]}
                      </span>
                    </span>
                  ) : (
                    <span className="sbills-muted">not read</span>
                  )}
                </td>
                <td>{row.scanStatusLabel}</td>
                <td>
                  <button
                    type="button"
                    className="pshell-btn pshell-btn--primary"
                    onClick={() => setOpenId(row.id)}
                  >
                    {row.needsReview ? 'Read it' : 'Open'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {openId ? (
        <BillReviewModal
          billId={openId}
          onClose={() => setOpenId(null)}
          onReviewed={() => {
            setOpenId(null);
            load();
            toast.success('Review saved. Both figures are kept.');
          }}
          scanStatusLabel={scanStatusLabel}
          formatLineItemAmount={formatLineItemAmount}
        />
      ) : null}
    </PageShell>
  );
};

export default ServiceBillsPage;