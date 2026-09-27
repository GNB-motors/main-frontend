import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import useApi from '../../hooks/useApi';
import EmptyState from '../../components/cluster/EmptyState';
import { formatNum } from '../../utils/formatters';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import PanelLoading from './PanelLoading';
import LegDetail from './LegDetail';
import { endpointLabel, messageOf, minutesLabel } from './placeIntelligenceModel';

/** Route leaderboard: legs between places, most travelled first. */
export default function RoutesTab() {
  const { data, loading, error } = useApi(
    (signal) => PlaceIntelligenceService.listLegs({ limit: 100 }, { signal }),
    [],
  );
  const [openId, setOpenId] = useState(null);
  if (loading && !data) return <PanelLoading />;
  if (error)
    return <EmptyState title="Routes unavailable" hint={messageOf(error, 'Try again later')} />;
  const records = data?.records || [];
  if (!records.length)
    return <EmptyState title="No legs yet" hint="Legs are learned from tours once they close." />;
  return (
    <div className="overflow-x-auto">
      <table className="oa-table">
        <thead>
          <tr>
            <th aria-label="Expand" />
            <th>From → to</th>
            <th>Trips</th>
            <th>Typical km</th>
            <th>Typical time</th>
            <th>Slow (p90)</th>
            <th>Fuel / km</th>
            <th>Fuel cost</th>
          </tr>
        </thead>
        <tbody>
          {records.map((n) => (
            <Fragment key={n._id}>
              <tr>
                <td>
                  <button
                    type="button"
                    className="p-1"
                    aria-label={
                      openId === n._id ? 'Hide trips on this leg' : 'Show trips on this leg'
                    }
                    onClick={() => setOpenId(openId === n._id ? null : n._id)}
                  >
                    {openId === n._id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                </td>
                <td className="text-xs font-semibold">
                  {endpointLabel(n.from)} → {endpointLabel(n.to)}
                </td>
                <td className="num font-mono font-bold">{n.traversals}</td>
                <td className="num font-mono">{n.stats?.km?.p50 ?? '—'}</td>
                <td className="num font-mono">{minutesLabel(n.stats?.minutes?.p50)}</td>
                <td className="num font-mono">{minutesLabel(n.stats?.minutes?.p90)}</td>
                <td className="num font-mono">
                  {n.stats?.fuelPerKm?.p50 != null ? n.stats.fuelPerKm.p50.toFixed(2) : '—'}
                </td>
                <td className="num font-mono" title={n.costBasis || ''}>
                  {n.fuelCostP50 != null ? `₹${formatNum(n.fuelCostP50)}` : '—'}
                </td>
              </tr>
              {openId === n._id ? (
                <tr>
                  <td colSpan={8}>
                    <LegDetail id={n._id} />
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
