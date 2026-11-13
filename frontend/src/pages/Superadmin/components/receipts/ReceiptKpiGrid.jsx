import { AlertTriangle, Fuel, TrendingUp } from 'lucide-react';
import Skel from './Skel';
import { fmtMoney, fmtLitres } from './receiptFormat';

/**
 * The KPI cards.
 *
 * A card shows a number only when we measured it. The server's summary covers
 * the whole tab; the numbers we work out ourselves cover one page, so those
 * are never shown as a tab total.
 */
const ReceiptKpiGrid = ({ loading, kpis, odoFilter, setOdoFilter, error = '', onRetry }) => {
  // A failed load is a failure, never a zero. The cards say they could not be
  // read and offer a way to try again.
  if (error && !loading) {
    return (
      <div className="ra-kpi-grid">
        <div className="ra-kpi-card ra-kpi-card--error" role="alert">
          <div className="ra-kpi-card__head">
            <span className="ra-kpi-card__title">Pending approvals</span>
            <AlertTriangle size={16} color="var(--amber-500, #F59E0B)" />
          </div>
          <div className="ra-kpi-card__val">Couldn&apos;t load</div>
          <div className="ra-kpi-card__sub">
            The inbox could not be read just now, so these numbers are unknown.
            <div style={{ marginTop: 8 }}>
              <button type="button" className="ra-btn ra-btn--ghost" onClick={onRetry}>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only the server's summary covers the whole tab.
  const isTab = kpis?.scope === 'tab';
  const coverage = kpis?.coverage || null;
  const notMeasured = 'Not measured for this tab.';

  const pendingAmount = kpis?.pendingAmount ?? null;
  const pendingCount = kpis?.pendingCount ?? null;
  const totalLitres = kpis?.totalLitres ?? null;
  const totalAmount = kpis?.totalAmount ?? null;
  const missingOdoCount = kpis?.missingOdoCount ?? null;

  const amountCoverage = coverage?.amount || null;
  const litresCoverage = coverage?.litres || null;

  return (
    <div className="ra-kpi-grid">
      <div className="ra-kpi-card ra-kpi-card--pending">
        <div className="ra-kpi-card__head">
          <span className="ra-kpi-card__title">Pending approvals</span>
          {loading ? (
            <Skel w={74} h={21} round />
          ) : pendingCount != null ? (
            <span className="ra-kpi-card__badge-pulse">{pendingCount} Pending</span>
          ) : null}
        </div>
        <div className="ra-kpi-card__val font-mono">
          {loading ? (
            <Skel w={128} h={26} />
          ) : isTab && pendingAmount != null ? (
            fmtMoney(pendingAmount)
          ) : (
            '—'
          )}
        </div>
        <div className="ra-kpi-card__sub">
          {loading ? (
            <Skel w="80%" h={11} />
          ) : isTab && pendingAmount != null && pendingCount != null ? (
            <>Awaiting manager verification across {pendingCount} fuel slips</>
          ) : (
            notMeasured
          )}
        </div>
      </div>

      <div className="ra-kpi-card">
        <div className="ra-kpi-card__head">
          <span className="ra-kpi-card__title">Total volume</span>
          <Fuel size={16} className="ra-kpi-card__icon" />
        </div>
        <div className="ra-kpi-card__val font-mono">
          {loading ? (
            <Skel w={104} h={26} />
          ) : isTab && totalLitres != null ? (
            fmtLitres(totalLitres)
          ) : (
            '—'
          )}
        </div>
        <div className="ra-kpi-card__sub">
          {loading ? (
            <Skel w="70%" h={11} />
          ) : isTab && totalLitres != null ? (
            litresCoverage ? (
              <>
                Known volume: <strong>{fmtLitres(totalLitres)}</strong> · {litresCoverage.with} of{' '}
                {litresCoverage.of} bills have litres.
              </>
            ) : (
              'Total litres billed on this tab.'
            )
          ) : (
            notMeasured
          )}
        </div>
      </div>

      <div className="ra-kpi-card">
        <div className="ra-kpi-card__head">
          <span className="ra-kpi-card__title">Total fuel billed</span>
          <TrendingUp size={16} className="ra-kpi-card__icon" />
        </div>
        <div className="ra-kpi-card__val font-mono">
          {loading ? (
            <Skel w={128} h={26} />
          ) : isTab && totalAmount != null ? (
            fmtMoney(totalAmount)
          ) : (
            '—'
          )}
        </div>
        <div className="ra-kpi-card__sub">
          {loading ? (
            <Skel w="75%" h={11} />
          ) : isTab && totalAmount != null ? (
            amountCoverage ? (
              <>
                Known amount: <strong>{fmtMoney(totalAmount)}</strong> · {amountCoverage.with} of{' '}
                {amountCoverage.of} bills have an amount.
              </>
            ) : (
              'Total amount billed on this tab.'
            )
          ) : (
            notMeasured
          )}
        </div>
      </div>

      <div
        className={`ra-kpi-card ${missingOdoCount > 0 ? 'ra-kpi-card--alert' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => setOdoFilter(odoFilter === 'MISSING' ? 'ALL' : 'MISSING')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOdoFilter(odoFilter === 'MISSING' ? 'ALL' : 'MISSING');
          }
        }}
        style={{ cursor: 'pointer' }}
        title="Click to toggle missing odometer filter"
      >
        <div className="ra-kpi-card__head">
          <span className="ra-kpi-card__title">Missing odometer</span>
          <AlertTriangle size={16} color={missingOdoCount > 0 ? '#2563eb' : 'currentColor'} />
        </div>
        <div className="ra-kpi-card__val font-mono">
          {loading ? (
            <Skel w={40} h={26} />
          ) : isTab && missingOdoCount != null ? (
            missingOdoCount
          ) : (
            '—'
          )}
        </div>
        <div className="ra-kpi-card__sub">
          {loading ? (
            <Skel w="70%" h={11} />
          ) : odoFilter === 'MISSING' ? (
            <span style={{ color: '#2563eb', fontWeight: 600 }}>Active Filter Applied ✓</span>
          ) : isTab && missingOdoCount != null ? (
            'Slips without dash photo or telematics reading'
          ) : (
            notMeasured
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptKpiGrid;
