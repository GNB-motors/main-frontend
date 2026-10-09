import {
  X,
  Pencil,
  Trash2,
  ExternalLink,
  Copy,
  Truck,
  Flame,
  Droplets,
  Hexagon,
  Warehouse,
  BellRing,
  Undo2,
  Eraser,
  Check,
  Info,
  EyeOff,
  Eye,
  Clock,
  Coffee,
  Briefcase,
  Wrench,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { toast } from 'react-toastify';
import useApi from '../../hooks/useApi';
import PlaceLabel from '../../components/ui/PlaceLabel';
import { inr, num } from '../../utils/formatMoney.js';
import { formatDateIST } from '../../utils/dateUtils';
import {
  minutesLabel,
  placeStats,
  riskSentence,
  tripDropNote,
} from './intelligence/placeIntelligenceModel.js';
import useSiteAnswer from './intelligence/useSiteAnswer.js';
import PlaceVerdict from './intelligence/PlaceVerdict.jsx';
import ReviewActions from './intelligence/ReviewActions.jsx';
import EvidenceList from './intelligence/EvidenceList.jsx';
import PurposeBar from './intelligence/PurposeBar.jsx';
import FacilityCard from './intelligence/FacilityCard.jsx';
import LocationSearch from './LocationSearch.jsx';
import PlaceHubService from './PlaceHubService.js';
import { TypeTile } from './PlaceHubPanels.jsx';
import {
  KIND_META,
  PROVENANCE_LABEL,
  placeTypeLabel,
  radiusLabel,
  durationLabel,
  hoursLabel,
  coordsLabel,
  alertSummary,
  addressParts,
} from './placeHubModel.js';
import {
  IDLE_COLOR,
  idleTone,
  PROVENANCE_COLOR,
  DRAIN_COLOR,
  STOP_COLOR,
} from './placeHubStyle.js';

dayjs.extend(relativeTime);

const RADIUS_STEPS = [
  50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000, 10000, 20000, 50000,
];

/* ─── Frame ──────────────────────────────────────────────────────────────── */

function Frame({ icon, title, eyebrow, label, onClose, children, footer }) {
  return (
    <aside className="ph-panel" aria-label={label || (typeof title === 'string' ? title : eyebrow)}>
      <header className="ph-panel-head">
        {icon}
        <div className="ph-panel-titles">
          {eyebrow && <span className="ph-eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
        <button type="button" className="ph-icon-btn" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </header>
      <div className="ph-panel-body">{children}</div>
      {footer && <footer className="ph-panel-foot">{footer}</footer>}
    </aside>
  );
}

function Stats({ items }) {
  return (
    <dl className="ph-stats">
      {items.filter(Boolean).map((s) => (
        <div key={s.label} className={s.tone ? `ph-stat ph-stat--${s.tone}` : 'ph-stat'}>
          <dt>{s.label}</dt>
          <dd>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Where({ lat, lng, shape, address }) {
  const copy = () => {
    navigator.clipboard?.writeText(`${lat}, ${lng}`).then(
      () => toast.success('Coordinates copied'),
      () => {},
    );
  };
  return (
    <section className="ph-section">
      <h3>Where</h3>
      <div className="ph-where">
        {address ? (
          <p className="ph-where-address">{address}</p>
        ) : (
          <PlaceLabel lat={lat} lng={lng} />
        )}
        <div className="ph-where-line">
          <span className="ph-mono">{coordsLabel(lat, lng)}</span>
          <button type="button" className="ph-link-btn" onClick={copy}>
            <Copy size={12} /> Copy
          </button>
          <a
            className="ph-link-btn"
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={12} /> Google Maps
          </a>
        </div>
        {shape && <p className="ph-where-shape">{shape}</p>}
      </div>
    </section>
  );
}

function Note({ children, tone = 'info' }) {
  const Icon = tone === 'crit' ? ShieldAlert : Info;
  return (
    <p className={`ph-callout ph-callout--${tone}`}>
      <Icon size={14} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/* ─── Place ──────────────────────────────────────────────────────────────── */

function WarehouseRoster({ id }) {
  const { data, loading } = useApi(() => PlaceHubService.warehouseRoster(id), [id]);
  const inside = data?.inside || [];
  return (
    <section className="ph-section">
      <h3>Inside now</h3>
      {loading ? (
        <span className="ph-shimmer ph-ghost-line" />
      ) : inside.length ? (
        <div className="ph-truck-chips">
          {inside.slice(0, 24).map((v) => (
            <span
              key={v.vehicleId}
              className="ph-truck-chip"
              title={v.isHomeWarehouse ? 'Based here' : 'Based elsewhere'}
            >
              <Truck size={11} /> {v.registrationNumber || 'Truck'}
            </span>
          ))}
        </div>
      ) : (
        <p className="ph-muted">No truck is inside right now.</p>
      )}
    </section>
  );
}

/**
 * What the engine makes of a detected place, why, and the answer that teaches
 * it. The list's copy shows at once; the full record (evidence, facility, the
 * address looked up once) replaces it when it arrives.
 */
function SiteInsight({ place, canAnswer, onAnswered }) {
  const { data } = useApi(
    (signal) => PlaceHubService.siteDetail(place.sourceId, { signal }),
    [place.sourceId, place.raw],
  );
  const site =
    data?._id && String(data._id) === place.sourceId ? { ...place.raw, ...data } : place.raw;
  const answer = useSiteAnswer(onAnswered);
  const st = placeStats(site);
  const risk = riskSentence(site.risk, formatDateIST);
  const drops = tripDropNote(site);
  return (
    <>
      {drops && <Note tone="warn">{drops}</Note>}
      <section className="ph-section">
        <h3>What we think</h3>
        <PlaceVerdict site={site} />
        {risk && <Note tone="crit">{risk}</Note>}
      </section>
      {canAnswer && <ReviewActions key={site._id} site={site} answer={answer} />}
      <Stats
        items={[
          { label: 'Stops', value: st.visits == null ? '—' : num(st.visits) },
          { label: 'Different trucks', value: st.trucks == null ? '—' : num(st.trucks) },
          { label: 'Typical stop', value: minutesLabel(st.medianDwellMin) },
          { label: 'Long stops (1 in 10)', value: minutesLabel(st.p90DwellMin) },
          { label: 'First seen', value: st.firstSeenAt ? formatDateIST(st.firstSeenAt) : '—' },
          { label: 'Last seen', value: st.lastSeenAt ? formatDateIST(st.lastSeenAt) : '—' },
        ]}
      />
      <FacilityCard site={site} />
      <section className="ph-section">
        <h3>Why</h3>
        <EvidenceList engine={site.engine} />
      </section>
      <section className="ph-section">
        <h3>What trucks do here</h3>
        <PurposeBar engine={site.engine} />
      </section>
    </>
  );
}

function PlaceDetail({ place, canEdit, onClose, onEdit, onDelete, onReviewed }) {
  const raw = place.raw;
  const isSite = place.source === 'site';
  const shape = place.polygon
    ? `Drawn outline · ${place.polygon.length} points`
    : `Circle · ${radiusLabel(place.radiusM)} radius`;
  const address =
    place.source === 'warehouse'
      ? [raw.address, raw.city, raw.state, raw.pincode].filter(Boolean).join(', ')
      : raw.address?.formatted || '';
  const editable = canEdit && !place.readOnly && !isSite;

  return (
    <Frame
      icon={<TypeTile type={place.type} size={40} />}
      eyebrow={placeTypeLabel(place.type)}
      title={place.name}
      onClose={onClose}
      footer={
        editable && (
          <>
            <span className="ph-spacer" />
            <button
              type="button"
              className="ph-btn ph-btn--ghost ph-btn--danger"
              onClick={() => onDelete(place)}
            >
              <Trash2 size={14} /> {place.source === 'warehouse' ? 'Deactivate' : 'Delete'}
            </button>
            <button type="button" className="ph-btn ph-btn--primary" onClick={() => onEdit(place)}>
              <Pencil size={14} /> Edit
            </button>
          </>
        )
      }
    >
      {place.readOnlyReason && <Note>{place.readOnlyReason}</Note>}

      {place.source === 'warehouse' && (
        <Stats
          items={[
            { label: 'Vehicles based here', value: num(raw.vehicleCount || 0) },
            { label: 'Code', value: raw.code || '—' },
          ]}
        />
      )}
      {place.source === 'zone' && (
        <Stats
          items={[
            { label: 'Alerts', value: alertSummary(place.alerts.entry, place.alerts.exit) },
            { label: 'Shape', value: place.polygon ? 'Outline' : 'Circle' },
          ]}
        />
      )}
      {isSite && (
        <SiteInsight place={place} canAnswer={canEdit && !place.readOnly} onAnswered={onReviewed} />
      )}

      <Where lat={place.lat} lng={place.lng} shape={shape} address={address} />
      {place.source === 'warehouse' && <WarehouseRoster id={place.sourceId} />}
      {place.source === 'zone' && (
        <Note>A truck idling inside this zone counts as legit idling.</Note>
      )}
    </Frame>
  );
}

/* ─── Unexplained stops ──────────────────────────────────────────────────── */

/** The three answers a manager gives a stop; each is evidence for that one stop. */
const STOP_ANSWERS = [
  { purpose: 'REST', label: 'Rest / meal', Icon: Coffee },
  { purpose: 'LOAD', label: 'Work', Icon: Briefcase },
  { purpose: 'SERVICE', label: 'Repair', Icon: Wrench },
];

function StopsDetail({ group, site, canEdit, busy, onClose, onAnswer, onOpenSite }) {
  const many = group.stops.length > 1;
  return (
    <Frame
      icon={
        site ? (
          <TypeTile type={site.type} size={40} />
        ) : (
          <TypeTile Icon={Clock} color={STOP_COLOR} size={40} />
        )
      }
      eyebrow="Unexplained stops"
      title={site ? site.name : <PlaceLabel lat={group.lat} lng={group.lng} showMap={false} />}
      label={site ? site.name : 'Unexplained stops'}
      onClose={onClose}
    >
      <Stats
        items={[
          { label: 'Unexplained', value: hoursLabel(group.minutes / 60), tone: 'warn' },
          { label: 'Stops · 7 days', value: num(group.stops.length) },
        ]}
      />
      {group.siteId && canEdit && (
        <button type="button" className="ph-btn" onClick={() => onOpenSite(group.siteId)}>
          Say what this place is <ArrowRight size={14} />
        </button>
      )}

      <section className="ph-section">
        <h3>Each stop · newest first</h3>
        <ul className="ph-stops">
          {group.stops.map((st) => (
            <li key={st._id} className="ph-stop">
              <div className="ph-stop-line">
                <span className="ph-truck-chip">
                  <Truck size={11} /> {st.registrationNumber || 'Truck'}
                </span>
                <span className="ph-muted">{dayjs(st.startAt).format('D MMM, h:mm a')}</span>
                <strong>{minutesLabel(st.dwellMinutes)}</strong>
              </div>
              {canEdit && (
                <div className="ph-btn-row">
                  {STOP_ANSWERS.map((a) => (
                    <button
                      key={a.purpose}
                      type="button"
                      className="ph-btn ph-btn--sm"
                      disabled={busy}
                      onClick={() => onAnswer([st], a.purpose)}
                    >
                      <a.Icon size={12} /> {a.label}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {canEdit && many && (
        <section className="ph-section">
          <h3>Were they all the same thing?</h3>
          <div className="ph-btn-row">
            {STOP_ANSWERS.map((a) => (
              <button
                key={a.purpose}
                type="button"
                className="ph-btn ph-btn--sm"
                disabled={busy}
                onClick={() => onAnswer(group.stops, a.purpose)}
              >
                <a.Icon size={12} /> All {group.stops.length} were {a.label.toLowerCase()}
              </button>
            ))}
          </div>
        </section>
      )}

      <Where lat={group.lat} lng={group.lng} />
    </Frame>
  );
}

/* ─── Idling ─────────────────────────────────────────────────────────────── */

function AddHere({ canEdit, onAdd, center, name }) {
  if (!canEdit) return null;
  return (
    <section className="ph-section">
      <h3>Trucks wait here for work?</h3>
      <p className="ph-muted">
        Idling inside a warehouse or zone counts as legit. Add this spot as a place and future
        idling here stops showing as excess.
      </p>
      <div className="ph-btn-row">
        <button type="button" className="ph-btn" onClick={() => onAdd('ZONE', { center, name })}>
          <Hexagon size={14} /> Add as zone
        </button>
        <button
          type="button"
          className="ph-btn"
          onClick={() => onAdd('WAREHOUSE', { center, name })}
        >
          <Warehouse size={14} /> Add as warehouse
        </button>
      </div>
    </section>
  );
}

function LiveIdleDetail({ event, canEdit, onClose, onAdd }) {
  const excess = event.legitimacy === 'excess';
  const center = { lat: Number(event.lat), lng: Number(event.lng) };
  return (
    <Frame
      icon={
        <TypeTile Icon={Truck} color={excess ? IDLE_COLOR.excess : IDLE_COLOR.legit} size={40} />
      }
      eyebrow="Idling now"
      title={event.registrationNumber || 'Unknown truck'}
      onClose={onClose}
    >
      <Stats
        items={[
          { label: 'Idling for', value: durationLabel(event.durationMin) },
          { label: 'Burned so far', value: inr(event.rupees), tone: excess ? 'crit' : null },
          { label: 'Fuel', value: `${(Number(event.litres) || 0).toFixed(1)} L` },
          { label: 'Verdict', value: excess ? 'Excess' : 'Legit', tone: excess ? 'crit' : 'ok' },
        ]}
      />
      <Where
        lat={center.lat}
        lng={center.lng}
        shape={event.zoneName ? `Inside ${event.zoneName}` : 'Outside every warehouse and zone'}
      />
      <p className="ph-muted">Since {dayjs(event.startAt).format('D MMM, h:mm a')}</p>
      {excess && <AddHere canEdit={canEdit} onAdd={onAdd} center={center} name="" />}
    </Frame>
  );
}

function IdleSpotDetail({ spot, canEdit, onClose, onAdd }) {
  const tone = idleTone(spot.excessShare);
  const center = { lat: spot.lat, lng: spot.lng };
  return (
    <Frame
      icon={<TypeTile Icon={Truck} color={IDLE_COLOR[tone]} size={40} />}
      eyebrow="Idle spot · last 7 days"
      title={spot.zoneNames[0] || 'Unnamed spot'}
      onClose={onClose}
    >
      <Stats
        items={[
          { label: 'Burned', value: inr(spot.rupees), tone: tone === 'excess' ? 'crit' : null },
          { label: 'Excess share', value: `${Math.round(spot.excessShare * 100)}%` },
          { label: 'Idle time', value: hoursLabel(spot.hours) },
          { label: 'Idles', value: num(spot.events) },
        ]}
      />
      <div className="ph-split" aria-label="Legit versus excess">
        <span style={{ width: `${(1 - spot.excessShare) * 100}%`, background: IDLE_COLOR.legit }} />
        <span style={{ width: `${spot.excessShare * 100}%`, background: IDLE_COLOR.excess }} />
      </div>
      <Where lat={spot.lat} lng={spot.lng} shape="About 250 m around this point" />
      <section className="ph-section">
        <h3>Trucks ({num(spot.trucks.length)})</h3>
        <div className="ph-truck-chips">
          {spot.trucks.slice(0, 30).map((r) => (
            <span key={r} className="ph-truck-chip">
              <Truck size={11} /> {r}
            </span>
          ))}
        </div>
      </section>
      {spot.excessShare > 0 && <AddHere canEdit={canEdit} onAdd={onAdd} center={center} name="" />}
    </Frame>
  );
}

/* ─── Fuel risk ──────────────────────────────────────────────────────────── */

function HotspotDetail({ hotspot, canEdit, onClose, onEdit, onToggle }) {
  const own = hotspot.provenance !== 'network';
  return (
    <Frame
      icon={<TypeTile Icon={Flame} color={PROVENANCE_COLOR[hotspot.provenance]} size={40} />}
      eyebrow={PROVENANCE_LABEL[hotspot.provenance]}
      title={hotspot.name}
      onClose={onClose}
      footer={
        own && canEdit ? (
          <>
            <span className="ph-spacer" />
            <button
              type="button"
              className="ph-btn ph-btn--ghost"
              onClick={() => onToggle(hotspot)}
            >
              {hotspot.active ? <EyeOff size={14} /> : <Eye size={14} />}
              {hotspot.active ? 'Dismiss' : 'Reactivate'}
            </button>
            <button
              type="button"
              className="ph-btn ph-btn--primary"
              onClick={() => onEdit(hotspot)}
            >
              <Pencil size={14} /> Edit
            </button>
          </>
        ) : null
      }
    >
      {!hotspot.active && <Note tone="warn">Dismissed — refuels here are no longer flagged.</Note>}
      <Stats
        items={[
          {
            label: 'Incidents',
            value: num(hotspot.incidentCount),
            tone: hotspot.incidentCount ? 'crit' : null,
          },
          {
            label: 'Last incident',
            value: hotspot.lastIncidentAt ? dayjs(hotspot.lastIncidentAt).fromNow() : '—',
          },
          {
            label: 'Signal',
            value:
              hotspot.category === 'UNAUTHORISED_REFUEL' ? 'Off-network refuels' : 'Fuel theft',
          },
          { label: 'Radius', value: radiusLabel(hotspot.radiusM) },
        ]}
      />
      <Where lat={hotspot.lat} lng={hotspot.lng} />
      {!own && (
        <Note>
          Seen across fleets on the network. It is shared without naming any fleet, so it cannot be
          edited here.
        </Note>
      )}
    </Frame>
  );
}

function DrainDetail({ cell, disclaimer, canEdit, onClose, onAdd }) {
  return (
    <Frame
      icon={<TypeTile Icon={Droplets} color={DRAIN_COLOR} size={40} />}
      eyebrow="Fuel drain"
      title={<PlaceLabel lat={cell.lat} lng={cell.lng} showMap={false} />}
      onClose={onClose}
      footer={
        canEdit ? (
          <>
            <span className="ph-spacer" />
            <button
              type="button"
              className="ph-btn ph-btn--primary"
              onClick={() =>
                onAdd('HOTSPOT', { center: { lat: cell.lat, lng: cell.lng }, name: '' })
              }
            >
              <Flame size={14} /> Mark as hotspot
            </button>
          </>
        ) : null
      }
    >
      <Stats
        items={[
          { label: 'Est. loss', value: inr(cell.rupees), tone: 'warn' },
          { label: 'Fuel drops', value: num(cell.events) },
          { label: 'Litres', value: `${num(Math.round(cell.litres))} L` },
          { label: 'Trucks', value: num(cell.vehicles.length) },
        ]}
      />
      <Where lat={cell.lat} lng={cell.lng} shape="A grid cell, not an exact point" />
      {cell.vehicles.length > 0 && (
        <section className="ph-section">
          <h3>Trucks</h3>
          <div className="ph-truck-chips">
            {cell.vehicles.slice(0, 30).map((r) => (
              <span key={r} className="ph-truck-chip">
                <Truck size={11} /> {r}
              </span>
            ))}
          </div>
        </section>
      )}
      {disclaimer && <Note tone="warn">{disclaimer}</Note>}
    </Frame>
  );
}

/* ─── Editor ─────────────────────────────────────────────────────────────── */

const KIND_ICON = { WAREHOUSE: Warehouse, ZONE: Hexagon, HOTSPOT: Flame };

function Field({ label, error, children, hint }) {
  return (
    <label className={`ph-field${error ? ' has-error' : ''}`}>
      <span className="ph-field-label">{label}</span>
      {children}
      {error ? <em className="ph-field-error">{error}</em> : hint && <small>{hint}</small>}
    </label>
  );
}

function RadiusControl({ draft, meta, error, onChange }) {
  const steps = RADIUS_STEPS.filter((s) => s >= meta.minRadius && s <= meta.maxRadius);
  const r = Number(draft.radiusM) || meta.defaultRadius;
  const nearest = steps.reduce(
    (best, s, i) => (Math.abs(s - r) < Math.abs(steps[best] - r) ? i : best),
    0,
  );
  return (
    <Field label="Radius" error={error} hint="Or drag the circle's edge on the map.">
      <div className="ph-radius">
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          value={nearest}
          onChange={(e) => onChange({ radiusM: steps[Number(e.target.value)] })}
          aria-label="Radius"
        />
        <span className="ph-radius-input">
          <input
            type="number"
            value={draft.radiusM}
            min={meta.minRadius}
            max={meta.maxRadius}
            onChange={(e) =>
              onChange({ radiusM: e.target.value === '' ? '' : Number(e.target.value) })
            }
            aria-label="Radius in metres"
          />
          m
        </span>
      </div>
    </Field>
  );
}

function PlaceEditor({
  draft,
  errors,
  saving,
  isLoaded,
  allowHotspot,
  onChange,
  onKind,
  onPick,
  onCancel,
  onSave,
}) {
  const meta = KIND_META[draft.kind];
  const Icon = KIND_ICON[draft.kind];
  const kinds = Object.keys(KIND_META).filter((k) => k !== 'HOTSPOT' || allowHotspot);
  const verb = draft.mode === 'edit' ? 'Edit' : 'Add';

  const pick = (loc) => {
    const patch = draft.shape === 'circle' ? { center: { lat: loc.lat, lng: loc.lng } } : {};
    if (!draft.name.trim()) patch.name = loc.label.split(',')[0];
    if (draft.kind === 'WAREHOUSE' && !draft.address.trim())
      Object.assign(patch, addressParts(loc.result));
    onChange(patch);
    onPick(loc);
  };

  return (
    <Frame
      icon={<TypeTile type={draft.kind} Icon={Icon} size={40} />}
      eyebrow={draft.mode === 'edit' ? 'Editing' : 'New place'}
      title={`${verb} ${meta.label.toLowerCase()}`}
      onClose={onCancel}
      footer={
        <>
          <button
            type="button"
            className="ph-btn ph-btn--ghost"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <span className="ph-spacer" />
          <button
            type="button"
            className="ph-btn ph-btn--primary"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : draft.mode === 'edit' ? 'Save changes' : 'Save place'}
          </button>
        </>
      }
    >
      {draft.mode === 'create' && (
        <div className="ph-kinds" role="radiogroup" aria-label="What is this place?">
          {kinds.map((k) => {
            const KIcon = KIND_ICON[k];
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={draft.kind === k}
                className={`ph-kind${draft.kind === k ? ' is-on' : ''}`}
                onClick={() => onKind(k)}
              >
                <KIcon size={16} />
                <span>{KIND_META[k].label}</span>
              </button>
            );
          })}
        </div>
      )}
      <p className="ph-muted">{meta.hint}</p>

      <Field label="Find on map" hint="Search, or click straight on the map.">
        <LocationSearch
          isLoaded={isLoaded}
          onPick={pick}
          placeholder="Search an address or landmark"
        />
      </Field>

      <Field label="Name" error={errors.name}>
        <input
          className="ph-text"
          aria-label="Name"
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={draft.kind === 'WAREHOUSE' ? 'e.g. Dankuni yard' : 'e.g. Tata Steel gate 3'}
          maxLength={200}
        />
      </Field>

      {draft.kind === 'WAREHOUSE' && (
        <Field label="Code" error={errors.code} hint="Optional short code, like DKN.">
          <input
            className="ph-text ph-mono"
            aria-label="Code"
            value={draft.code}
            onChange={(e) => onChange({ code: e.target.value.toUpperCase() })}
            maxLength={20}
          />
        </Field>
      )}

      {meta.polygon && (
        <div className="ph-field">
          <span className="ph-field-label">Shape</span>
          <div className="ph-seg ph-seg--full" role="tablist" aria-label="Shape">
            {[
              { id: 'circle', label: 'Circle' },
              { id: 'polygon', label: 'Draw outline' },
            ].map((o) => (
              <button
                key={o.id}
                type="button"
                role="tab"
                aria-selected={draft.shape === o.id}
                className={`ph-seg-btn${draft.shape === o.id ? ' is-on' : ''}`}
                onClick={() => onChange({ shape: o.id })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {draft.shape === 'polygon' ? (
        <div className={`ph-field${errors.shape ? ' has-error' : ''}`}>
          <span className="ph-field-label">Outline</span>
          <div className="ph-outline">
            <span>
              {draft.polygonDone
                ? `Closed · ${draft.polygon.length} points`
                : draft.polygon.length
                  ? `${draft.polygon.length} point${draft.polygon.length > 1 ? 's' : ''} — keep clicking the map`
                  : 'Click the map to place the first corner'}
            </span>
            <div className="ph-btn-row">
              {!draft.polygonDone && draft.polygon.length > 0 && (
                <button
                  type="button"
                  className="ph-btn ph-btn--sm"
                  onClick={() => onChange({ polygon: draft.polygon.slice(0, -1) })}
                >
                  <Undo2 size={13} /> Undo
                </button>
              )}
              {draft.polygon.length > 0 && (
                <button
                  type="button"
                  className="ph-btn ph-btn--sm"
                  onClick={() => onChange({ polygon: [], polygonDone: false })}
                >
                  <Eraser size={13} /> Clear
                </button>
              )}
              {!draft.polygonDone && draft.polygon.length >= 3 && (
                <button
                  type="button"
                  className="ph-btn ph-btn--sm ph-btn--primary"
                  onClick={() => onChange({ polygonDone: true })}
                >
                  <Check size={13} /> Finish
                </button>
              )}
            </div>
          </div>
          {errors.shape && <em className="ph-field-error">{errors.shape}</em>}
        </div>
      ) : (
        <>
          <div className={`ph-field${errors.shape ? ' has-error' : ''}`}>
            <span className="ph-field-label">Pin</span>
            <p className="ph-pin">
              {draft.center ? (
                <span className="ph-mono">{coordsLabel(draft.center.lat, draft.center.lng)}</span>
              ) : (
                'Click the map to drop the pin'
              )}
            </p>
            {errors.shape && <em className="ph-field-error">{errors.shape}</em>}
          </div>
          <RadiusControl draft={draft} meta={meta} error={errors.radiusM} onChange={onChange} />
        </>
      )}

      {draft.kind === 'ZONE' && (
        <div className="ph-field">
          <span className="ph-field-label">
            <BellRing size={13} /> Alerts
          </span>
          <label className="ph-toggle">
            <input
              type="checkbox"
              aria-label="Alert when a truck enters"
              checked={draft.alertOnEntry}
              onChange={(e) => onChange({ alertOnEntry: e.target.checked })}
            />
            <span>When a truck enters</span>
          </label>
          <label className="ph-toggle">
            <input
              type="checkbox"
              aria-label="Alert when a truck leaves"
              checked={draft.alertOnExit}
              onChange={(e) => onChange({ alertOnExit: e.target.checked })}
            />
            <span>When a truck leaves</span>
          </label>
        </div>
      )}

      {draft.kind === 'WAREHOUSE' && (
        <details className="ph-details" open={Boolean(draft.address)}>
          <summary>Address (optional)</summary>
          <Field label="Address">
            <input
              className="ph-text"
              aria-label="Address"
              value={draft.address}
              onChange={(e) => onChange({ address: e.target.value })}
            />
          </Field>
          <div className="ph-grid-3">
            <Field label="City">
              <input
                className="ph-text"
                aria-label="City"
                value={draft.city}
                onChange={(e) => onChange({ city: e.target.value })}
              />
            </Field>
            <Field label="State">
              <input
                className="ph-text"
                aria-label="State"
                value={draft.state}
                onChange={(e) => onChange({ state: e.target.value })}
              />
            </Field>
            <Field label="Pincode">
              <input
                className="ph-text"
                aria-label="Pincode"
                value={draft.pincode}
                onChange={(e) => onChange({ pincode: e.target.value })}
                inputMode="numeric"
              />
            </Field>
          </div>
        </details>
      )}
    </Frame>
  );
}

/* ─── Switch ─────────────────────────────────────────────────────────────── */

export default function PlaceHubDrawer({ selection, draft, ...props }) {
  if (draft) return <PlaceEditor draft={draft} {...props.editor} />;
  if (!selection?.item) return null;
  const { item, kind } = selection;
  const common = { canEdit: props.canEdit, onClose: props.onClose };
  if (kind === 'place')
    return (
      <PlaceDetail
        place={item}
        {...common}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
        onReviewed={props.onReviewed}
      />
    );
  if (kind === 'live') return <LiveIdleDetail event={item} {...common} onAdd={props.onAdd} />;
  if (kind === 'idleSpot') return <IdleSpotDetail spot={item} {...common} onAdd={props.onAdd} />;
  if (kind === 'hotspot')
    return (
      <HotspotDetail
        hotspot={item}
        {...common}
        onEdit={props.onEdit}
        onToggle={props.onToggleHotspot}
      />
    );
  if (kind === 'drain')
    return (
      <DrainDetail cell={item} disclaimer={props.disclaimer} {...common} onAdd={props.onAdd} />
    );
  if (kind === 'stops')
    return (
      <StopsDetail
        group={item}
        site={props.siteOf(item.siteId)}
        {...common}
        busy={props.stopsBusy}
        onAnswer={props.onAnswerStops}
        onOpenSite={props.onOpenSite}
      />
    );
  return null;
}
