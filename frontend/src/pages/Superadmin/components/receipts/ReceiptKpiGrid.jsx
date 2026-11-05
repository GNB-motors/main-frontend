import { AlertTriangle, Fuel, TrendingUp } from 'lucide-react';
import Skel from './Skel';
import { fmtMoney, fmtLitres } from './receiptFormat';

const ReceiptKpiGrid = ({ loading, kpis, odoFilter, setOdoFilter }) => {
  // Nothing has come in yet: a zero is not a measurement, so say so instead of
  // showing "₹0" and a rate of "₹—/L".
  const empty = !loading && kpis.totalCount === 0;
  const hasRate = Boolean(kpis.avgRate) && kpis.avgRate !== '—';
  return (
    <div className="ra-kpi-grid">
      <div className="ra-kpi-card ra-kpi-card--pending">
        <div className="ra-kpi-card__head">
          <span className="ra-kpi-card__title">Pending approvals</span>
          {loading ? (
            <Skel w={74} h={21} round />
          ) : empty ? null : (
            <span className="ra-kpi-card__badge-pulse">{kpis.pendingCount} Pending</span>
          )}
        </div>
        <div className="ra-kpi-card__val font-mono">
          {loading ? <Skel w={128} h={26} /> : empty ? '—' : fmtMoney(kpis.pendingAmount)}
        </div>
        <div className="ra-kpi-card__sub">
          {loading ? (
            <Skel w="80%" h={11} />
          ) : empty ? (
            'No receipts yet'
          ) : (
            <>Awaiting manager verification across {kpis.pendingCount} fuel slips</>
          )}
        </div>
      </div>

      <div className="ra-kpi-card">
        <div className="ra-kpi-card__head">
          <span className="ra-kpi-card__title">Total volume</span>
          <Fuel size={16} className="ra-kpi-card__icon" />
        </div>
        <div className="ra-kpi-card__val font-mono">
          {loading ? <Skel w={104} h={26} /> : empty ? '—' : fmtLitres(kpis.totalLitres)}
        </div>
        <div className="ra-kpi-card__sub">
          {loading ? (
            <Skel w="70%" h={11} />
          ) : empty ? (
            'No receipts yet'
          ) : (
            <>Diesel logged across {kpis.totalCount} receipts</>
          )}
        </div>
      </div>

      <div className="ra-kpi-card">
        <div className="ra-kpi-card__head">
          <span className="ra-kpi-card__title">Total fuel billed</span>
          <TrendingUp size={16} className="ra-kpi-card__icon" />
        </div>
        <div className="ra-kpi-card__val font-mono">
          {loading ? <Skel w={128} h={26} /> : empty ? '—' : fmtMoney(kpis.totalAmount)}
        </div>
        <div className="ra-kpi-card__sub">
          {loading ? (
            <Skel w="75%" h={11} />
          ) : empty ? (
            'No receipts yet'
          ) : hasRate ? (
            <>
              Average price: <strong>₹{kpis.avgRate}/L</strong> across regional stations
            </>
          ) : (
            'No litres billed yet'
          )}
        </div>
      </div>

      <div
        className={`ra-kpi-card ${kpis.missingOdoCount > 0 ? 'ra-kpi-card--alert' : ''}`}
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
          <AlertTriangle size={16} color={kpis.missingOdoCount > 0 ? '#2563eb' : 'currentColor'} />
        </div>
        <div className="ra-kpi-card__val font-mono">
          {loading ? <Skel w={40} h={26} /> : kpis.missingOdoCount}
        </div>
        <div className="ra-kpi-card__sub">
          {odoFilter === 'MISSING' ? (
            <span style={{ color: '#2563eb', fontWeight: 600 }}>Active Filter Applied ✓</span>
          ) : (
            'Slips without dash photo or telematics reading'
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptKpiGrid;
