import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import StatusBadge from '../StatusBadge';
import { documentPathFor } from '../../../pages/ErpAccounts/documentRoutes';
import { money, RECEIVABLE_STATES, PAYABLE_STATES } from './tripFinance';

const day = (d) => (d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—');

const AccountsOnly = () => <span className="trip360-accounts-only">Accounts only</span>;

const Facts = ({ items }) => (
  <dl className="trip360-fin-facts">
    {items.filter((f) => f && f.value != null && f.value !== '').map((f) => (
      <React.Fragment key={f.label}>
        <dt>{f.label}</dt>
        <dd>{f.value}</dd>
      </React.Fragment>
    ))}
  </dl>
);

/**
 * State-aware finance snapshot for the trip. The trip screen EXPLAINS finance;
 * the Finance module OPERATES it — so Accounts users get real actions and
 * deep-links, and everyone else sees read-only status with an "Accounts only"
 * label rather than a dead, greyed-out button. Payment is not a trip step here:
 * it hangs off the receivable / payable documents.
 */
const TripFinancials = ({ finance, unloadingDone, onRecordReceipt }) => {
  if (!finance) {
    return (
      <section className="trip360-fin">
        <h2 className="trip360-fin-title">Financials</h2>
        <p className="trip360-muted">Finance summary unavailable.</p>
      </section>
    );
  }

  const caps = finance.capabilities || {};
  const recv = finance.receivable || {};
  const pay = finance.payable || {};
  const { margin } = finance;
  const sb = recv.saleBill;
  const pb = pay.purchaseBill;

  const recvMeta = RECEIVABLE_STATES[recv.state] || RECEIVABLE_STATES.NOT_GENERATED;
  const payMeta = PAYABLE_STATES[pay.state] || PAYABLE_STATES.NOT_GENERATED;
  const recvActionable = recv.state === 'APPROVED_OUTSTANDING' || recv.state === 'PARTIALLY_PAID';

  return (
    <section className="trip360-fin">
      <h2 className="trip360-fin-title">Financials</h2>
      <div className="trip360-fin-grid">
        {/* ── Customer receivable ── */}
        <article className="trip360-fin-card">
          <header className="trip360-fin-card-head">
            <span className="trip360-fin-card-label">Customer receivable</span>
            <StatusBadge label={recvMeta.label} tone={recvMeta.tone} />
          </header>

          {recv.state === 'NOT_GENERATED' ? (
            <p className="trip360-fin-empty">
              {unloadingDone ? 'Sale bill not generated yet.' : 'Available after unloading.'}
            </p>
          ) : (
            <>
              <div className="trip360-fin-amount">
                {money(recv.state === 'PAID' ? sb?.netAmount : recv.outstanding)}
              </div>
              <Facts
                items={[
                  { label: 'Customer', value: sb?.partyName },
                  { label: 'Sale bill', value: sb?.billNumber },
                  { label: 'Invoice', value: sb?.netAmount != null ? money(sb.netAmount) : null },
                  recv.state !== 'PAID' && recv.state !== 'PENDING_APPROVAL'
                    ? { label: 'Outstanding', value: money(recv.outstanding) }
                    : null,
                  { label: 'Due', value: sb?.dueDate ? day(sb.dueDate) : null },
                ]}
              />
            </>
          )}

          <footer className="trip360-fin-card-foot">
            {recvActionable && (
              caps.canRecordReceipt
                ? (
                  <button type="button" className="trip360-btn secondary" onClick={onRecordReceipt}>
                    Record receipt
                  </button>
                )
                : <AccountsOnly />
            )}
            {sb && (
              <Link
                className="trip360-fin-link"
                to={documentPathFor('SALE_BILL', sb.billId) || '/erp/billing?tab=outstanding'}
              >
                Open receivable
                <ArrowUpRight size={13} />
              </Link>
            )}
          </footer>
        </article>

        {/* ── Vendor payable (hire trips only) ── */}
        {pay.applicable && (
          <article className="trip360-fin-card">
            <header className="trip360-fin-card-head">
              <span className="trip360-fin-card-label">Vendor payable</span>
              <StatusBadge label={payMeta.label} tone={payMeta.tone} />
            </header>

            {pay.state === 'NOT_GENERATED' ? (
              <p className="trip360-fin-empty">
                {unloadingDone ? 'Purchase bill not generated yet.' : 'Available after unloading.'}
              </p>
            ) : (
              <>
                <div className="trip360-fin-amount">
                  {money(pay.state === 'PAID' ? pb?.netAmount : pay.payable)}
                </div>
                <Facts
                  items={[
                    { label: 'Vendor', value: pb?.vendorName },
                    { label: 'Purchase bill', value: pb?.billNumber },
                    { label: 'Net payable', value: pb?.netAmount != null ? money(pb.netAmount) : null },
                  ]}
                />
              </>
            )}

            <footer className="trip360-fin-card-foot">
              {pay.state === 'APPROVED_UNPAID' && (
                caps.canCreateVendorPayment
                  ? (
                    <Link className="trip360-btn secondary" to="/erp/payables?tab=vendor">
                      Create vendor payment
                    </Link>
                  )
                  : <AccountsOnly />
              )}
              {pb && (
                <Link
                  className="trip360-fin-link"
                  to={documentPathFor('PURCHASE_BILL', pb.billId) || '/erp/payables?tab=vendor'}
                >
                  Open payable
                  <ArrowUpRight size={13} />
                </Link>
              )}
            </footer>
          </article>
        )}

        {/* ── Trip margin (commercial roles only; margin is null otherwise) ── */}
        {margin && (
          <article className="trip360-fin-card trip360-fin-card--margin">
            <header className="trip360-fin-card-head">
              <span className="trip360-fin-card-label">Trip margin</span>
              {margin.marginPct != null && (
                <StatusBadge label={`${margin.marginPct}%`} tone={margin.profit >= 0 ? 'success' : 'danger'} />
              )}
            </header>
            <div className={`trip360-fin-amount ${margin.profit >= 0 ? 'pos' : 'neg'}`}>
              {money(margin.profit)}
            </div>
            <Facts
              items={[
                { label: 'Sale value', value: money(margin.revenue) },
                { label: finance.vehicleType === 'HIRE' ? 'Hire cost' : 'Trip cost', value: money(margin.cost) },
              ]}
            />
            {!margin.billed && (
              <p className="trip360-fin-note">Firms up once the sale bill is approved.</p>
            )}
          </article>
        )}
      </div>
    </section>
  );
};

export default TripFinancials;
