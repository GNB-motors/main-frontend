import { AlertTriangle, Fuel, TrendingUp } from 'lucide-react';
import Skel from './Skel';
import { fmtMoney, fmtLitres } from './receiptFormat';
const ReceiptKpiGrid = ({ loading, kpis, odoFilter, setOdoFilter }) => (
  <div className="ra-kpi-grid">
    <div className="ra-kpi-card ra-kpi-card--pending">
      <div className="ra-kpi-card__head">
        <span className="ra-kpi-card__title">Pending Approvals</span>
        {loading ? (
          <Skel w={74} h={21} round />
        ) : (
          <span className="ra-kpi-card__badge-pulse">{kpis.pendingCount} Pending</span>
        )}
      </div>
      <div className="ra-kpi-card__val font-mono">
        {loading ? <Skel w={128} h={26} /> : fmtMoney(kpis.pendingAmount)}
      </div>
      <div className="ra-kpi-card__sub">
        {loading ? (
          <Skel w="80%" h={11} />
        ) : (
          <>Awaiting manager verification across {kpis.pendingCount} fuel slips</>
        )}
      </div>
    </div>

    <div className="ra-kpi-card">
      <div className="ra-kpi-card__head">
        <span className="ra-kpi-card__title">Total Volume</span>
        <Fuel size={16} className="ra-kpi-card__icon" />
      </div>
      <div className="ra-kpi-card__val font-mono">
        {loading ? <Skel w={104} h={26} /> : fmtLitres(kpis.totalLitres)}
      </div>
      <div className="ra-kpi-card__sub">
        {loading ? <Skel w="70%" h={11} /> : <>Diesel logged across {kpis.totalCount} receipts</>}
      </div>
    </div>

    <div className="ra-kpi-card">
      <div className="ra-kpi-card__head">
        <span className="ra-kpi-card__title">Total Fuel Billed</span>
        <TrendingUp size={16} className="ra-kpi-card__icon" />
      </div>
      <div className="ra-kpi-card__val font-mono">
        {loading ? <Skel w={128} h={26} /> : fmtMoney(kpis.totalAmount)}
      </div>
      <div className="ra-kpi-card__sub">
        {loading ? (
          <Skel w="75%" h={11} />
        ) : (
          <>
            Average price: <strong>₹{kpis.avgRate}/L</strong> across regional stations
          </>
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
        <span className="ra-kpi-card__title">Missing Odometer</span>
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

export default ReceiptKpiGrid;
