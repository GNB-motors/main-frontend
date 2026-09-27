import { useState } from 'react';
import useApi from '../../hooks/useApi';
import PlaceLabel from '../../components/ui/PlaceLabel';
import EmptyState from '../../components/cluster/EmptyState';
import { formatNum } from '../../utils/formatters';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import PanelLoading from './PanelLoading';
import { EVIDENCE_LABEL, confidencePct, messageOf, typeLabel } from './placeIntelligenceModel';

function riskText(risk) {
  if (!risk || !(risk.theftIncidents || risk.unauthRefuelIncidents)) return '—';
  return `${risk.theftIncidents || 0} theft · ${risk.unauthRefuelIncidents || 0} off-network refuels`;
}

/** Every place of the org: its type now next to what the engine thinks. */
export default function PlacesTab() {
  const [status, setStatus] = useState('');
  const { data, loading, error } = useApi(
    (signal) =>
      PlaceIntelligenceService.listSites({ status: status || undefined, limit: 100 }, { signal }),
    [status],
  );
  if (error)
    return <EmptyState title="Places unavailable" hint={messageOf(error, 'Try again later')} />;
  const records = data?.records || [];
  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-3">
        <label className="text-xs text-slate-600" htmlFor="pi-status">
          Status
        </label>
        <select
          id="pi-status"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All</option>
          <option value="PROPOSED">Proposed</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <span className="text-xs text-slate-500">
          {data?.total != null ? `${data.total} places` : ''}
        </span>
      </div>
      {loading && !data ? (
        <PanelLoading />
      ) : !records.length ? (
        <EmptyState title="No places yet" hint="Places appear after the nightly sweep runs." />
      ) : (
        <div className="overflow-x-auto">
          <table className="oa-table">
            <thead>
              <tr>
                <th>Place</th>
                <th>Type now</th>
                <th>Engine thinks</th>
                <th>Evidence</th>
                <th>Status</th>
                <th>Visits</th>
                <th>Fuel risk</th>
              </tr>
            </thead>
            <tbody>
              {records.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div className="text-xs font-semibold text-slate-900">{s.name || '—'}</div>
                    <PlaceLabel lat={s.centroidLat} lng={s.centroidLng} />
                  </td>
                  <td>{typeLabel(s.siteType)}</td>
                  <td>
                    {s.engine
                      ? `${typeLabel(s.engine.siteType)} (${confidencePct(s.engine.confidence) ?? '—'}%)`
                      : '—'}
                  </td>
                  <td className="text-xs">
                    {s.engine ? EVIDENCE_LABEL[s.engine.evidenceLevel] : '—'}
                  </td>
                  <td className="text-xs">{s.status}</td>
                  <td className="num font-mono">{formatNum(s.visitCount)}</td>
                  <td className="text-xs">{riskText(s.risk)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
