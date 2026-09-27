import { useState } from 'react';
import useApi from '../../hooks/useApi';
import EmptyState from '../../components/cluster/EmptyState';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import PanelLoading from './PanelLoading';
import { gateRows, messageOf } from './placeIntelligenceModel';

const CHIP =
  'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wide border';
const OBJECT_ID = /^[a-f0-9]{24}$/i;

function summary(r) {
  return [
    `Parity: ${r.parity?.ok ? 'exact' : `${r.parity?.missing ?? '?'} missing, ${r.parity?.differing ?? '?'} differ`}`,
    `Hotspot lookups: ${r.hotspotParity ? `${r.hotspotParity.identical}/${r.hotspotParity.points} identical` : '—'}`,
    `Place labels: ${r.placesParity ? `${r.placesParity.identical}/${r.placesParity.points} identical` : '—'}`,
    `Engine vs legacy: ${r.engineVsLegacy ? `${r.engineVsLegacy.agree} agree, ${r.engineVsLegacy.conflict} conflict` : '—'}`,
    `New places: ${r.newPlaces?.total ?? '—'}`,
    `Trip km: ${r.tripKm ? `${r.tripKm.changed} of ${r.tripKm.comparable} change; frozen changed ${r.tripKm.frozenChanged}` : '—'}`,
    `Unexplained stops: ${r.stops?.unexplainedShare != null ? `${Math.round(r.stops.unexplainedShare * 100)}%` : '—'}`,
    `Run errors: ${(r.runErrors || []).length}`,
  ];
}

/** SUPER_ADMIN: the nightly old-vs-new comparison that decides each reader switch. */
export default function ShadowReportTab() {
  const [orgId, setOrgId] = useState('');
  const valid = OBJECT_ID.test(orgId);
  const { data, loading, error } = useApi(
    (signal) => PlaceIntelligenceService.shadowReports(orgId, { signal }),
    [orgId],
    { enabled: valid },
  );

  let body;
  if (!valid) {
    body = (
      <EmptyState
        title="Pick an organisation"
        hint="Shadow reports compare the old place systems with the new registry, per org."
      />
    );
  } else if (loading && !data) {
    body = <PanelLoading />;
  } else if (error) {
    body = <EmptyState title="Reports unavailable" hint={messageOf(error, 'Try again later')} />;
  } else if (!(data || []).length) {
    body = (
      <EmptyState
        title="No reports yet"
        hint="The nightly sweep writes one per day once it is enabled."
      />
    );
  } else {
    body = (data || []).map((r) => (
      <div key={r._id} className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
        <div className="mb-2 font-semibold">{r.day}</div>
        <div className="mb-2 flex flex-wrap gap-2">
          {gateRows(r).map((g) => (
            <span
              key={g.reader}
              className={`${CHIP} ${g.ready ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300'}`}
            >
              {g.reader}: {g.ready ? 'ready' : 'wait'}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
          {summary(r).map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      </div>
    ));
  }

  return (
    <div className="space-y-3 p-4">
      <input
        className="w-80 rounded-md border border-slate-300 px-2 py-1 font-mono text-xs"
        placeholder="Organisation id"
        aria-label="Organisation id"
        value={orgId}
        onChange={(e) => setOrgId(e.target.value.trim())}
      />
      {body}
    </div>
  );
}
