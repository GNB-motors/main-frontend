import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import PageShell from '../../components/ui/PageShell';
import { ServiceBillService } from '../../services/ServiceBillService';
import {
  STATE_STYLE,
  STATE_FILTERS,
  SIGNAL_LABEL,
  formatMoney,
  formatIstDay,
  formatFigure,
  provenanceText,
  deltaText,
  lagText,
  readingText,
} from './serviceBillLogic';
import './ServiceBillPage.css';

/**
 * ServiceBillPage — "service done, where's the bill?" (00_PLAN item 19).
 *
 * The screen answers one question per row: a service happened, so where is the
 * money? Three answers are possible and all three are shown as themselves:
 *   · no bill yet    → the state, with how long it has been open
 *   · a bill exists  → both sides, named, with the bill's approver
 *   · they disagree  → BOTH figures, unblended, never averaged
 *
 * No cell renders a missing number as ₹0 and no cell says "paid": an Expense
 * says who submitted a bill and who accepted it, not that money left a bank.
 */
const ServicesView = () => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1, summary: {} });
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState('OPEN');
  const [page, setPage] = useState(1);
  const [sinceDays, setSinceDays] = useState(180);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async (nextState, nextPage, nextDays) => {
    setLoading(true);
    try {
      const res = await ServiceBillService.list({
        state: nextState,
        page: nextPage,
        limit: 50,
        sinceDays: nextDays,
      });
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err?.message || 'Could not load the bill list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(state, page, sinceDays);
  }, [load, state, page, sinceDays]);

  const summary = meta.summary || {};
  const signalsSummary = useMemo(
    () =>
      rows.reduce((acc, row) => {
        (row.signalsAgreed || []).forEach((s) => {
          acc[s] = (acc[s] || 0) + 1;
        });
        return acc;
      }, {}),
    [rows],
  );

  const linkFirstCandidate = async (row) => {
    const candidate = (row.candidates || [])[0];
    if (!candidate) return;
    setBusyId(row.id);
    try {
      await ServiceBillService.linkBill(row.id, candidate.expenseId);
      toast.success('Bill linked to the service');
      load(state, page, sinceDays);
    } catch (err) {
      toast.error(err?.message || 'Could not link that bill');
    } finally {
      setBusyId(null);
    }
  };

  const closeWithoutBill = async (row) => {
    // A reason is required by the backend too: "no bill expected" is a claim
    // somebody is making about their own money, not a state the system can infer.
    const note = window.prompt('Why will no bill arrive? (warranty, AMC, goodwill…)');
    if (!note || !note.trim()) return;
    setBusyId(row.id);
    try {
      await ServiceBillService.closeWithoutBill(row.id, note.trim());
      toast.success('Marked as never billed');
      load(state, page, sinceDays);
    } catch (err) {
      toast.error(err?.message || 'Could not close that item');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageShell
      title="Service done — where's the bill?"
      count={meta.total}
      subtitle="Every service joined to the bill it has. A missing bill is a state, never a zero."
      filters={
        <div className="sbp-filters">
          {STATE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`sbp-chip${state === f.key ? ' sbp-chip--on' : ''}`}
              onClick={() => {
                setPage(1);
                setState(f.key);
              }}
            >
              {f.label}
            </button>
          ))}
          <label className="sbp-window">
            Last
            <select
              value={sinceDays}
              onChange={(e) => {
                setPage(1);
                setSinceDays(Number(e.target.value));
              }}
            >
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
              <option value={730}>2 years</option>
            </select>
          </label>
        </div>
      }
      footer={
        <span>
          {summary.noBill ?? 0} with no bill · {summary.mismatches ?? 0} where the bill and the
          service record disagree · {summary.closedNoBill ?? 0} marked never billed ·{' '}
          {summary.suspected ?? 0} suspected and unlogged
        </span>
      }
    >
      {signalsSummary && Object.keys(signalsSummary).length > 0 ? (
        <p className="sbp-signals">
          Signals that agreed:
          {Object.entries(signalsSummary).map(([key, n]) => (
            <span key={key} className="sbp-signal">
              {SIGNAL_LABEL[key] || key}: {n}
            </span>
          ))}
        </p>
      ) : null}

      {loading ? <p className="sbp-empty">Loading…</p> : null}
      {!loading && !rows.length ? (
        <p className="sbp-empty">
          Nothing here. Every service in this window has its bill accounted for.
        </p>
      ) : null}

      {rows.map((row) => {
        const style = STATE_STYLE[row.state] || STATE_STYLE.NO_BILL;
        const suggestion = (row.candidates || [])[0];
        return (
          <article key={row.id} className="sbp-row">
            <header className="sbp-row-head">
              <div>
                <strong>{row.service.vehicle?.registrationNumber || 'Unregistered vehicle'}</strong>
                <span className="sbp-when"> · {formatIstDay(row.service.date)}</span>
                {row.service.workshop ? <span> · {row.service.workshop}</span> : null}
                {row.service.type ? <span> · {row.service.type}</span> : null}
              </div>
              <span
                className="sbp-state"
                style={{ color: style.color, background: style.bg, borderColor: style.border }}
              >
                {style.label}
              </span>
            </header>

            <p className="sbp-signals">
              {(row.signalsAgreed || []).length
                ? (row.signalsAgreed || []).map((s) => SIGNAL_LABEL[s] || s).join(' · ')
                : 'No signal agreed on this one yet'}
              {row.kind === 'SUSPECTED' ? ' · suspected: no service was logged' : ''}
            </p>

            {/* BOTH figures, always named. Never one number standing in for both. */}
            <dl className="sbp-figures">
              <div>
                <dt>Service record says</dt>
                <dd>
                  {formatFigure(row.service.amountProvenance)}
                  <small>{provenanceText(row.service.amountProvenance)}</small>
                </dd>
              </div>
              <div>
                <dt>Bill says</dt>
                <dd>
                  {row.bill ? formatFigure(row.bill.amountProvenance) : 'No bill yet'}
                  <small>
                    {row.bill
                      ? `${provenanceText(row.bill.amountProvenance)}${
                          row.bill.approvedBy
                            ? ` · approved by ${String(row.bill.approvedBy)}`
                            : ' · not approved yet'
                        }`
                      : 'Not a zero — the bill has not arrived'}
                  </small>
                </dd>
              </div>
              {row.billReading ? (
                <div>
                  <dt>Workshop bill reads</dt>
                  <dd>
                    {readingText(row.billReading).figure}
                    <small>{readingText(row.billReading).note}</small>
                  </dd>
                </div>
              ) : null}
              {row.readingComparison && row.readingComparison.verdict === 'DISAGREES' ? (
                <div className="sbp-figures--mismatch">
                  <dt>Bill and record disagree</dt>
                  <dd>
                    {deltaText(row.readingComparison)}
                    <small>Both figures stand. Nothing was averaged.</small>
                  </dd>
                </div>
              ) : null}
              {row.comparison && row.comparison.verdict === 'DISAGREES' ? (
                <div className="sbp-figures--mismatch">
                  <dt>They disagree</dt>
                  <dd>
                    {deltaText(row.comparison)}
                    <small>Both figures stand. Nothing was averaged.</small>
                  </dd>
                </div>
              ) : null}
            </dl>

            <p className="sbp-lag">{lagText(row.lag)}</p>

            {row.estimate && row.estimate.amount !== null ? (
              <p className="sbp-estimate">
                Jobs like this usually cost you {formatMoney(row.estimate.amount)} —{' '}
                {provenanceText(row.estimate)}, from {row.estimate.sampleSize} of your own bills.
                Not a bill, not counted as spend.
              </p>
            ) : null}

            {row.bill?.document ? (
              <p className="sbp-doc">
                Bill document: {row.bill.document.docType} · OCR{' '}
                {row.bill.document.processingStatus === 'SUCCESS'
                  ? `read it at ${Math.round(row.bill.document.ocrConfidence ?? 0)}% confidence`
                  : `not read (${row.bill.document.processingStatus || 'unknown'})`}
              </p>
            ) : null}

            {row.resolution ? <p className="sbp-closed">Closed: {row.resolution.note}</p> : null}

            {row.open && row.kind === 'RECORDED' ? (
              <div className="sbp-actions">
                {suggestion ? (
                  <button
                    type="button"
                    className="sbp-btn sbp-btn--primary"
                    disabled={busyId === row.id}
                    onClick={() => linkFirstCandidate(row)}
                  >
                    Link “{suggestion.title}” ({formatFigure(suggestion)})
                  </button>
                ) : (
                  <span className="sbp-hint">No bill found that could honestly be this one.</span>
                )}
                <button
                  type="button"
                  className="sbp-btn"
                  disabled={busyId === row.id}
                  onClick={() => closeWithoutBill(row)}
                >
                  No bill is coming
                </button>
              </div>
            ) : null}

            {row.kind === 'SUSPECTED' && row.open ? (
              <p className="sbp-hint">
                A truck standing at a workshop is not a service record. Log the service first, then
                its bill.
              </p>
            ) : null}
          </article>
        );
      })}

      {meta.totalPages > 1 ? (
        <div className="sbp-pager">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </PageShell>
  );
};

// D4's OCR review queue: what each workshop bill says, before anyone trusts it.
// One page, one nav entry, two views of the same question.
const BillReviewQueue = lazy(() => import('../ServiceBills/ServiceBillsPage.jsx'));

const TABS = [
  { key: 'services', label: 'Services and their bills' },
  { key: 'review', label: 'Bill review (OCR)' },
];

const ServiceBillPage = () => {
  const [tab, setTab] = useState('services');
  return (
    <>
      <div className="sbp-tabs" role="tablist" aria-label="Service bills views">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`sbp-chip${tab === t.key ? ' sbp-chip--on' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'services' ? (
        <ServicesView />
      ) : (
        <Suspense fallback={<p className="sbp-loading">Loading the bill review queue…</p>}>
          <BillReviewQueue />
        </Suspense>
      )}
    </>
  );
};

export default ServiceBillPage;
