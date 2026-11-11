import { useState } from 'react';
import { BarChart3, CloudOff, Plus, Route, Search, Settings2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import { Button } from '../../../components/ui/button';
import SetSapDialog from '../../Sap/SetSapDialog';
import { kmText } from '../../Sap/sapModel';
import LegEnd from '../intelligence/LegEnd.jsx';
import RouteComparison from '../intelligence/RouteComparison.jsx';
import { messageOf } from '../intelligence/model/requestOutcome.js';
import { minutesLabel } from '../intelligence/model/unitLabels.js';
import { placeTitle } from '../intelligence/model/siteSummary.js';
import { countText, sapDelta } from '../intelligence/model/deliveryRoutesModel.js';
import Kpi from './Kpi.jsx';
import Empty from './Empty.jsx';
import ListSkeleton from './ListSkeleton.jsx';
import Segmented from './Segmented.jsx';

const REVIEW = [
  { id: '', label: 'Usual' },
  { id: 'NEEDS_REVIEW', label: 'Needs review' },
  { id: 'REJECTED', label: 'Rejected' },
];
const SAP_CHIPS = [
  ['', 'All'],
  ['OVER', 'Over SAP'],
  ['WITHIN', 'Within'],
  ['UNDER', 'Under'],
  ['NO_SAP', 'SAP not set'],
  ['NO_TRIPS', 'No trips yet'],
  ['NO_KM', 'Needs km evidence'],
];

/** Left rail for delivery routes: same anatomy as the movements list, plus SAP. */
export default function DeliveryRoutesPanel({ d }) {
  const [creating, setCreating] = useState(false);
  const max = Math.max(1, ...d.legs.map((l) => l.n || 0));
  const site = d.siteId ? d.sites.get(d.siteId) : null;
  const totals = d.totals;
  return (
    <aside className="ph-side ph-delivery" aria-label="Delivery route list">
      {d.showSap && (
        <div className="ph-delivery-actions">
          <button type="button" className="ph-btn ph-btn--sm" onClick={() => d.setIntent('month')}>
            <BarChart3 size={14} aria-hidden="true" /> SAP performance
          </button>
          <button
            type="button"
            className="ph-btn ph-btn--sm"
            onClick={() => d.setIntent('settings')}
            aria-label="Settings & import"
            title="SAP settings & import"
          >
            <Settings2 size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="ph-btn ph-btn--sm ph-btn--primary"
            onClick={() => setCreating(true)}
          >
            <Plus size={14} aria-hidden="true" /> New route
          </button>
        </div>
      )}
      <div
        className={`ph-route-kpis${d.showSap ? ' ph-delivery-kpis' : ''}`}
        aria-label="Route summary"
      >
        <Kpi label="Routes" value={totals ? countText(totals.routes) : '—'} />
        <Kpi label="Trips" value={totals ? countText(totals.trips) : '—'} />
        {d.showSap && (
          <>
            <Kpi
              label="Over SAP"
              value={totals ? countText(totals.over) : '—'}
              tone={totals?.over ? 'warn' : undefined}
            />
            <Kpi label="No SAP" value={totals ? countText(totals.withoutSap) : '—'} />
          </>
        )}
      </div>
      <div className="ph-route-controls">
        <label className="ph-delivery-search">
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search deliveries"
            placeholder="Search pickup or drop…"
            maxLength={60}
            value={d.search}
            onChange={(e) => d.setSearch(e.target.value)}
          />
        </label>
        <Segmented
          label="Route review status"
          value={d.review}
          options={REVIEW}
          onChange={d.setReview}
        />
        {d.showSap && (
          <div className="ph-route-chips" role="group" aria-label="Filter SAP status">
            {SAP_CHIPS.map(([id, label]) => (
              <button
                type="button"
                key={id}
                aria-pressed={d.sapStatus === id}
                onClick={() => d.setSapStatus(id)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <label>
          Sort{' '}
          <SearchableSelect value={d.sort} onChange={(e) => d.setSort(e.target.value)}>
            <option value="trips">Most trips</option>
            <option value="distance">Longest</option>
            {d.showSap && <option value="over">Most over SAP</option>}
            <option value="name">Name</option>
          </SearchableSelect>
        </label>
        {d.siteId && (
          <button type="button" className="ph-delivery-site" onClick={() => d.setSiteId(null)}>
            Routes at {site ? placeTitle(site) : 'this place'} <X size={12} aria-hidden="true" />
          </button>
        )}
      </div>
      {d.loading && !d.loaded && <ListSkeleton />}
      {d.error && (
        <div className="ph-route-error" role="alert">
          <CloudOff size={24} aria-hidden="true" />
          <strong>Delivery routes are temporarily unavailable</strong>
          <span className="ph-muted">{messageOf(d.error, 'Could not load delivery routes')}</span>
          <Button variant="outline" size="sm" onClick={d.refetch}>
            Retry
          </Button>
        </div>
      )}
      {d.loaded && !d.error && !d.legs.length && (
        <Empty
          icon={Route}
          title="No delivery routes in this view"
          body="Routes appear from completed loaded trips. Try another search or filter; configured SAP routes stay listed before their first trip."
        />
      )}
      <div className="ph-route-list" aria-busy={d.loading || undefined}>
        {d.legs.map((leg) => {
          const id = String(leg._id);
          const delta = d.showSap ? sapDelta(leg) : null;
          return (
            <button
              type="button"
              key={id}
              aria-label={`${leg.fromName} → ${leg.toName}`}
              aria-pressed={d.selectedId === id}
              className={`ph-route-row ph-delivery-row${d.selectedId === id ? ' is-selected' : ''}${d.hoveredId === id ? ' is-hovered' : ''}`}
              onClick={() => d.pick(id)}
              onMouseEnter={() => d.setHoveredId(id)}
              onMouseLeave={() => d.setHoveredId(null)}
              onFocus={() => d.setHoveredId(id)}
              onBlur={() => d.setHoveredId(null)}
            >
              <span className="ph-delivery-ends">
                <LegEnd site={d.sites.get(String(leg.fromSiteId))} fallback="UNKNOWN" />
                <LegEnd site={d.sites.get(String(leg.toSiteId))} fallback="UNKNOWN" />
              </span>
              <span className="ph-route-meta">
                {leg.n
                  ? `${countText(leg.n)} ${leg.n === 1 ? 'trip' : 'trips'} · ${minutesLabel(leg.minutes?.p50)} · ${kmText(leg.km?.p50)}`
                  : 'Configured · awaiting first trip'}
              </span>
              {d.showSap && (
                <span className="ph-delivery-sap">
                  <RouteComparison route={leg} compact />
                  {leg.sap && <span>SAP {kmText(leg.sap.sapKm)}</span>}
                  {delta && delta.tone !== 'within' && (
                    <span className={`ud-delta ud-delta--${delta.tone}`}>{delta.km}</span>
                  )}
                </span>
              )}
              <span
                className="ph-route-bar"
                style={{ width: `${Math.max(3, ((leg.n || 0) / max) * 100)}%` }}
              />
            </button>
          );
        })}
      </div>
      {creating && (
        <SetSapDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            d.refresh();
            toast.success('Route SAP saved. Trip snapshots refresh shortly.');
          }}
        />
      )}
    </aside>
  );
}
