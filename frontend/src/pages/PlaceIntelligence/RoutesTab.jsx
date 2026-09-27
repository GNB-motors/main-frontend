import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight, ArrowRight, Route } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { formatNum } from '../../utils/formatters';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import PanelLoading from './PanelLoading';
import EmptyPanel from './EmptyPanel';
import LegDetail from './LegDetail';
import LegEnd from './LegEnd';
import { kmLabel, messageOf, minutesLabel } from './placeIntelligenceModel';

/**
 * Every leg the fleet drives between two places, most travelled first, with
 * what a normal run costs in time, km and fuel. Open a leg to see each run
 * scored against that leg's own history.
 */
export default function RoutesTab({ version }) {
  const { data, loading, error } = useApi(
    (signal) => PlaceIntelligenceService.listLegs({ limit: 100 }, { signal }),
    [version],
  );
  const sitesQ = useApi(
    (signal) => PlaceIntelligenceService.listSites({ limit: 200 }, { signal }),
    [version],
  );
  const sitesById = new Map((sitesQ.data?.records || []).map((s) => [s._id, s]));
  const [openId, setOpenId] = useState(null);

  if (loading && !data) return <PanelLoading />;
  if (error)
    return (
      <EmptyPanel title="Could not load routes" hint={messageOf(error, 'Try again in a minute.')} />
    );
  const records = data?.records || [];
  if (!records.length)
    return (
      <EmptyPanel
        Icon={Route}
        title="No routes learned yet"
        hint="A leg appears once trucks have driven between the same two places at least twice."
      />
    );
  return (
    <div className="pi-table-wrap">
      <table className="pi-table">
        <thead>
          <tr>
            <th aria-label="Expand" />
            <th>Leg</th>
            <th className="pi-num">Runs</th>
            <th className="pi-num">Usual distance</th>
            <th className="pi-num">Usual time</th>
            <th className="pi-num">Slow run (1 in 10)</th>
            <th className="pi-num">Fuel / km</th>
            <th className="pi-num">Fuel cost</th>
          </tr>
        </thead>
        <tbody>
          {records.map((n) => {
            const open = openId === n._id;
            const toggle = () => setOpenId(open ? null : n._id);
            return (
              <Fragment key={n._id}>
                <tr className={open ? 'is-open' : ''}>
                  <td>
                    <button
                      type="button"
                      className="pi-btn-quiet"
                      style={{ height: 28, padding: '0 6px' }}
                      aria-label={open ? 'Hide runs on this leg' : 'Show runs on this leg'}
                      aria-expanded={open}
                      onClick={toggle}
                    >
                      {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </button>
                  </td>
                  <td>
                    <span className="pi-leg">
                      <LegEnd site={sitesById.get(n.fromSiteId)} fallback={n.from} />
                      <ArrowRight size={13} aria-hidden="true" />
                      <LegEnd site={sitesById.get(n.toSiteId)} fallback={n.to} />
                    </span>
                  </td>
                  <td className="pi-num">
                    <b>{n.traversals}</b>
                  </td>
                  <td className="pi-num">{kmLabel(n.stats?.km?.p50)}</td>
                  <td className="pi-num">{minutesLabel(n.stats?.minutes?.p50)}</td>
                  <td className="pi-num">{minutesLabel(n.stats?.minutes?.p90)}</td>
                  <td className="pi-num">
                    {n.stats?.fuelPerKm?.p50 != null
                      ? `${n.stats.fuelPerKm.p50.toFixed(2)} L`
                      : '—'}
                  </td>
                  <td className="pi-num" title={n.costBasis || ''}>
                    {n.fuelCostP50 != null ? `₹${formatNum(n.fuelCostP50)}` : '—'}
                  </td>
                </tr>
                {open ? (
                  <tr className="is-open">
                    <td colSpan={8} style={{ paddingLeft: 52 }}>
                      <LegDetail id={n._id} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
