import { Fuel, TrendingDown, Wallet, FileWarning, Droplets } from 'lucide-react';
import { formatINR, formatLitres } from '../../utils/formatters';
import FiKpi from './FiKpi.jsx';

export default function KpiStrip({ totals, windowDays, lossL, billCount, defCount, pricePerL }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <FiKpi
        icon={Fuel}
        label="Total Fills"
        value={formatLitres(totals?.fillsLitres)}
        sub={windowDays != null ? `over ${windowDays} days` : ''}
        accent="var(--gnb-400)"
      />
      <FiKpi
        icon={TrendingDown}
        label="Unexplained Loss"
        value={formatLitres(lossL)}
        sub="please review"
        accent="var(--critical)"
        emphasis={lossL > 0}
      />
      <FiKpi
        icon={Wallet}
        label="Est. Loss Value"
        value={formatINR(totals?.siphonSuspectedLossInr)}
        sub={`at ₹${pricePerL}/L (est.)`}
        accent="var(--critical)"
        emphasis={(totals?.siphonSuspectedLossInr || 0) > 0}
      />
      <FiKpi
        icon={FileWarning}
        label="Flagged Bills"
        value={billCount}
        sub="bill vs tank mismatch"
        accent="var(--caution)"
        emphasis={billCount > 0}
      />
      <FiKpi
        icon={Droplets}
        label="DEF Flags"
        value={defCount}
        sub="AdBlue ratio off"
        accent="var(--caution)"
        emphasis={defCount > 0}
      />
    </div>
  );
}
