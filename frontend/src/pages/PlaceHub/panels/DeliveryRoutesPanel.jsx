import { useState } from 'react';
import { BarChart3, CloudOff, Plus, Route, Search, Settings2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../../../components/ui/button';
import SetSapDialog from '../../Sap/SetSapDialog';
import { kmText } from '../../Sap/sapModel';
import { messageOf } from '../intelligence/model/requestOutcome.js';
import { placeTitle } from '../intelligence/model/siteSummary.js';
import { countText, routeTag } from '../intelligence/model/deliveryRoutesModel.js';
import Empty from './Empty.jsx';
import ListSkeleton from './ListSkeleton.jsx';

// One filter at a time: each chip sets the SAP status and review status together.
const FILTERS = [
  { id: 'all', label: 'All', review: '', sapStatus: '' },
  { id: 'over', label: 'Over SAP', review: '', sapStatus: 'OVER', sap: true },
  { id: 'nosap', label: 'No SAP', review: '', sapStatus: 'NO_SAP', sap: true },
  { id: 'review', label: 'Needs review', review: 'NEEDS_REVIEW', sapStatus: '' },
];
// Rejected routes are rarely needed: reached from the list foot, shown as a removable chip.
const REJECTED = { id: 'rejected', label: 'Rejected', review: 'REJECTED', sapStatus: '' };
const SORTS = [
  ['trips', 'Most trips'],
  ['distance', 'Longest'],
  ['over', 'Most over SAP', true],
  ['name', 'A–Z'],
];

/** Left rail for delivery routes: search, one row of filters, a quiet summary, the list. */
export default function DeliveryRoutesPanel({ d }) {
  const [creating, setCreating] = useState(false);
  const site = d.siteId ? d.sites.get(d.siteId) : null;
  const filters = FILTERS.filter((f) => d.showSap || !f.sap);
  const viewingRejected = d.review === REJECTED.review;
  const active = viewingRejected
    ? REJECTED.id
    : filters.find((f) => f.review === d.review && f.sapStatus === d.sapStatus)?.id || 'all';
  const pickFilter = (f) => {
    d.setReview(f.review);
    d.setSapStatus(f.sapStatus);
  };
  return (
    <aside className="ph-side ph-delivery" aria-label="Delivery route list">
      <div className="ph-delivery-head">
        <div className="ph-delivery-top">
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
          {d.showSap && (
            <>
              <button
                type="button"
                className="ph-icon-btn"
                onClick={() => d.setIntent('month')}
                aria-label="SAP performance"
                title="SAP performance"
              >
                <BarChart3 size={16} />
              </button>
              <button
                type="button"
                className="ph-icon-btn"
                onClick={() => d.setIntent('settings')}
                aria-label="Settings & import"
                title="SAP settings & import"
              >
                <Settings2 size={16} />
              </button>
              <button
                type="button"
                className="ph-icon-btn ph-icon-btn--primary"
                onClick={() => setCreating(true)}
                aria-label="New route"
                title="New route with SAP"
              >
                <Plus size={16} />
              </button>
            </>
          )}
        </div>
        <div className="ph-delivery-filters" role="group" aria-label="Filter routes">
          {filters.map((f) => (
            <button
              type="button"
              key={f.id}
              aria-pressed={active === f.id}
              onClick={() => pickFilter(f)}
            >
              {f.label}
            </button>
          ))}
          {viewingRejected && (
            <button
              type="button"
              aria-pressed="true"
              aria-label="Rejected routes, show usual routes"
              onClick={() => pickFilter(FILTERS[0])}
            >
              Rejected <X size={11} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="ph-delivery-summary">
          <span aria-live="polite">
            {d.totals
              ? `${countText(d.totals.routes)} routes · ${countText(d.totals.trips)} trips`
              : ' '}
          </span>
          <select
            aria-label="Sort routes"
            value={d.sort}
            onChange={(e) => d.setSort(e.target.value)}
          >
            {SORTS.filter(([, , sap]) => d.showSap || !sap).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {d.siteId && (
          <button type="button" className="ph-delivery-site" onClick={() => d.setSiteId(null)}>
            At {site ? placeTitle(site) : 'this place'} <X size={12} aria-hidden="true" />
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
          title="No delivery routes here"
          body="Routes appear from completed loaded trips. Try another search or filter."
        />
      )}
      <div className="ph-delivery-list" aria-busy={d.loading || undefined}>
        {d.legs.map((leg) => {
          const id = String(leg._id);
          const tag = d.showSap ? routeTag(leg) : null;
          return (
            <button
              type="button"
              key={id}
              aria-label={`${leg.fromName} → ${leg.toName}`}
              aria-pressed={d.selectedId === id}
              className={`ph-delivery-row${d.selectedId === id ? ' is-selected' : ''}${d.hoveredId === id ? ' is-hovered' : ''}`}
              onClick={() => d.pick(id)}
              onMouseEnter={() => d.setHoveredId(id)}
              onMouseLeave={() => d.setHoveredId(null)}
              onFocus={() => d.setHoveredId(id)}
              onBlur={() => d.setHoveredId(null)}
            >
              <span className="ph-delivery-name" title={`${leg.fromName} → ${leg.toName}`}>
                <strong>{leg.fromName || 'Unnamed pickup'}</strong>
                <span>→ {leg.toName || 'Unnamed drop'}</span>
              </span>
              <span className="ph-delivery-meta">
                <span>
                  {leg.n
                    ? `${countText(leg.n)} ${leg.n === 1 ? 'trip' : 'trips'} · ${kmText(leg.km?.p50)}`
                    : 'Awaiting first trip'}
                </span>
                {tag && (
                  <span className={`ph-delivery-tag is-${tag.tone}`} title={tag.title}>
                    {tag.text}
                  </span>
                )}
              </span>
            </button>
          );
        })}
        {d.loaded && !d.error && !viewingRejected && (
          <button type="button" className="ph-delivery-foot" onClick={() => pickFilter(REJECTED)}>
            Show rejected routes
          </button>
        )}
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
