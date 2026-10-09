/**
 * Add-missed-trip and schedule-trip forms — pure helpers. No React, no I/O.
 * Times come from <input type="datetime-local"> (browser local time, no zone) and
 * go to the API as ISO instants.
 */

import { typeLabel } from '../PlaceHub/intelligence/placeIntelligenceModel.js';

const MAX_TRIP_DAYS = 15; // the server refuses a manual trip longer than this

export const EMPTY_MANUAL_TRIP = {
  vehicleId: '',
  startAt: '',
  endAt: '',
  pickupSiteId: '',
  dropSiteId: '',
  dropName: '',
  km: '',
  note: '',
};

export const EMPTY_PLAN = {
  vehicleId: '',
  driverId: '',
  pickupSiteId: '',
  pickupName: '',
  dropSiteId: '',
  dropName: '',
  plannedStartAt: '',
  plannedEndAt: '',
  note: '',
};

/** One reducer for both forms: `set` one field, or `reset` to the given initial state. */
export function formReducer(state, action) {
  switch (action.type) {
    case 'set':
      return { ...state, [action.field]: action.value };
    case 'reset':
      return action.initial;
    default:
      return state;
  }
}

const toMs = (local) => (local ? new Date(local).getTime() : NaN);
const iso = (local) => new Date(local).toISOString();

/** A place picked from the list, else the typed name; null when neither. */
function endOf(siteId, name) {
  if (siteId) return { orgSiteId: siteId };
  const typed = (name || '').trim();
  return typed ? { name: typed } : null;
}

export function validateManualTrip(form, now = new Date()) {
  if (!form.vehicleId) return 'Pick the truck.';
  const start = toMs(form.startAt);
  const end = toMs(form.endAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return 'Set when the trip started and ended.';
  if (end <= start) return 'The end must be after the start.';
  if (end > now.getTime()) return 'A missed trip must already have happened — schedule it instead.';
  if (end - start > MAX_TRIP_DAYS * 86400000)
    return `A trip can span at most ${MAX_TRIP_DAYS} days.`;
  if (form.km !== '' && !(Number(form.km) >= 0)) return 'Distance must be a number.';
  return null;
}

/** Ends left blank are the truck's first and last GPS stop in the window (server side). */
export function manualTripBody(form) {
  const body = { vehicleId: form.vehicleId, startAt: iso(form.startAt), endAt: iso(form.endAt) };
  const pickup = endOf(form.pickupSiteId, '');
  const drop = endOf(form.dropSiteId, form.dropName);
  if (pickup) body.pickup = pickup;
  if (drop) body.drop = drop;
  if (form.km !== '') body.km = Number(form.km);
  if (form.note.trim()) body.note = form.note.trim();
  return body;
}

export function validatePlan(form) {
  if (!form.vehicleId) return 'Pick the truck.';
  if (!endOf(form.pickupSiteId, form.pickupName)) return 'Say where it loads.';
  if (!endOf(form.dropSiteId, form.dropName)) return 'Say where it drops.';
  const start = toMs(form.plannedStartAt);
  if (Number.isNaN(start)) return 'Set the planned start.';
  if (form.plannedEndAt && !(toMs(form.plannedEndAt) > start)) {
    return 'The planned end must be after the start.';
  }
  return null;
}

export function planBody(form) {
  const body = {
    vehicleId: form.vehicleId,
    pickup: endOf(form.pickupSiteId, form.pickupName),
    drop: endOf(form.dropSiteId, form.dropName),
    plannedStartAt: iso(form.plannedStartAt),
  };
  if (form.driverId) body.driverId = form.driverId;
  if (form.plannedEndAt) body.plannedEndAt = iso(form.plannedEndAt);
  if (form.note.trim()) body.note = form.note.trim();
  return body;
}

// ─── Pick lists ──────────────────────────────────────────────────────────────

const idOf = (row) => String(row?._id || row?.id || '');
const byLabel = (a, b) => a.label.localeCompare(b.label);

export function vehicleOptions(vehicles = []) {
  return vehicles
    .map((v) => ({ id: idOf(v), label: v.registrationNumber || v.vehicleNumber || '—' }))
    .filter((v) => v.id)
    .sort(byLabel);
}

export function driverOptions(employees = []) {
  return employees
    .filter((e) => e.role === 'DRIVER')
    .map((e) => ({
      id: idOf(e),
      label: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.mobileNumber || 'Driver',
    }))
    .filter((d) => d.id)
    .sort(byLabel);
}

export function placeOptions(sites = []) {
  return sites
    .map((s) => ({
      id: idOf(s),
      label: s.siteType
        ? `${s.name || s.key || 'Place'} · ${typeLabel(s.siteType)}`
        : s.name || s.key || 'Place',
    }))
    .filter((p) => p.id)
    .sort(byLabel);
}

// ─── Plans list ──────────────────────────────────────────────────────────────

export const PLAN_STATUS_LABEL = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'On the road',
  COMPLETED: 'Done',
  CANCELLED: 'Cancelled',
};

export const PLAN_STATUS_CLASS = {
  PLANNED: 'atx-status--open',
  IN_PROGRESS: 'atx-status--review',
  COMPLETED: 'atx-status--delivered',
  CANCELLED: 'atx-status--rejected',
};

export const PLAN_FLAG_LABEL = {
  LATE_START: 'Started late',
  PICKUP_MISMATCH: 'Loaded elsewhere',
  DROP_MISMATCH: 'Dropped elsewhere',
};

/** The warnings a plan row shows: not started on time, then the run's deviations. */
export function planWarnings(plan) {
  const out = plan?.late ? ['Not started'] : [];
  return [...out, ...(plan?.flags || []).map((f) => PLAN_FLAG_LABEL[f] || f)];
}

export const planEndName = (end) => end?.name || '—';
