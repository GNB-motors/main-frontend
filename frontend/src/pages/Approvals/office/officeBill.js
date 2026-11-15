/**
 * officeBill — the owner & manager bill captures, in the plain words of the
 * shared receipt table and drawer.
 *
 * The API answers with captures: the photo, what was read off the bill, who
 * put it in, and — once a person confirms it — the truck it belongs to. This
 * file turns one capture into the words the table and the drawer show, so
 * both read the same way as the WhatsApp queue.
 */
import safeText from '../../../utils/redactSensitive';
import { useCallback, useRef, useState } from 'react';
import { billDateInfo } from '../../Mileage/billDates';
import { candidateRows } from '../../Mileage/billPhotoModel';

export const DASH = '\u2014';

/** A plate compared without spaces or punctuation. */
export const normalizePlate = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

/** Draw attention to the truck field when confirmation is blocked. */
export const focusTruckInput = (captureId) => {
  try {
    navigator.vibrate?.(200);
  } catch {
    // Vibration is optional.
  }
  const input = document.getElementById(`office-truck-input-${captureId}`);
  input?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  input?.focus?.();
};

/** Explicit truck choice and blocked-confirmation feedback. */
export const useTruckConfirmation = (captureId) => {
  const [chosen, setChosen] = useState('');
  const [touched, setTouched] = useState(false);
  const [confirmBlocked, setConfirmBlocked] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const confirmButtonRef = useRef(null);
  const choose = useCallback((value) => {
    setTouched(true);
    setChosen(value);
  }, []);
  const resetChoice = useCallback(() => {
    setTouched(false);
    setChosen('');
    setConfirmBlocked(false);
  }, []);
  const blockConfirm = useCallback(() => {
    setConfirmBlocked(true);
    setShakeCount((count) => count + 1);
    focusTruckInput(captureId);
  }, [captureId]);
  const clearBlocked = useCallback(() => setConfirmBlocked(false), []);
  return {
    chosen,
    touched,
    confirmBlocked,
    shakeCount,
    confirmButtonRef,
    choose,
    resetChoice,
    blockConfirm,
    clearBlocked,
  };
};

/** A dash for what is not known. */
export const show = (value) => (value == null || value === '' ? DASH : String(value));

/** The money, the way it is read here. */
export const money = (value) => {
  if (value == null || value === '') return DASH;
  const amount = Number(value);
  return Number.isFinite(amount) ? `\u20b9${amount.toLocaleString('en-IN')}` : DASH;
};

const ROLE_WORDS = { OWNER: 'Owner', MANAGER: 'Manager' };

/** The role of a person, in words. */
export const role = (value) => ROLE_WORDS[String(value || '').toUpperCase()] || 'Unknown';

/** Only explicit names are shown, never ids or contact details. */
export const name = (value, fallback) =>
  typeof value === 'object' && value
    ? safeText(value.name || value.fullName || fallback) || 'Unknown'
    : safeText(fallback) || 'Unknown';

/** Who did it: the name and the role. */
export const identity = (person, named, personRole) =>
  `${name(person, named)} \u00b7 ${role(person?.role || personRole)}`;

/** The plates the server offers for a photo, best first, each with its certainty. */
export const officeCandidates = (suggestion) =>
  candidateRows(suggestion).map((candidate) => ({
    ...candidate,
    certainty: certaintyOf(candidate.score),
  }));

/** How sure the server is about a candidate, in words. */
export const certaintyOf = (score) => {
  // A missing score is unknown, not a zero that would read as a weak match.
  if (score === null || score === undefined || score === '') {
    return { kind: 'guess', text: 'Possible match' };
  }
  const raw = Number(score);
  if (!Number.isFinite(raw)) return { kind: 'guess', text: 'Possible match' };
  const value = raw > 1 ? raw / 100 : raw;
  if (value >= 0.8) return { kind: 'sure', text: 'Strong match' };
  if (value >= 0.5) return { kind: 'guess', text: 'Possible match' };
  return { kind: 'none', text: 'Weak match' };
};

/** The candidate the server would pick first. */
export const topCandidate = (suggestion) => officeCandidates(suggestion)[0] || null;

/** The truck the capture is linked to, once a person confirmed it. */
export const linkedPlate = (capture) => capture?.link?.registrationNumber || '';

/** The plate the person sees as chosen. */
export const chosenPlate = (capture) =>
  linkedPlate(capture) ||
  capture?.vehicleHint ||
  topCandidate(capture?.suggestion)?.registrationNumber ||
  '';

/** A bill that is not from one of our trucks: the market truck case. */
export const isMarketTruck = (suggestion) =>
  ['MARKET_TRUCK', 'NO_TRUCK_WITH_THESE_DIGITS'].includes(String(suggestion?.askReason || ''));

/** The date and the time the bill itself shows. */
export const billDateTime = (capture) => {
  const ocr = capture?.ocr || {};
  const photo = capture?.suggestion?.photo || {};
  const info = billDateInfo(photo.date ?? ocr.printedDate ?? ocr.date ?? null);
  return {
    date: info.text,
    yearWarning: info.yearWarning,
    time: photo.time ?? ocr.printedTime ?? '',
  };
};

/** The state of the match, in words: needs review, confirmed, or nothing yet. */
export const matchStatus = (capture) => {
  if (linkedPlate(capture)) return 'Confirmed';
  if (capture?.status === 'pending' || capture?.suggestion?.decision) return 'Needs review';
  return '-';
};

/** The page of the photo the server holds for this capture. */
export const photoIndex = (capture) => {
  const last = String(capture?.thumbnailUrl || '')
    .split('/')
    .pop();
  const index = Number(last);
  return Number.isInteger(index) && index >= 0 ? index : 0;
};

/** One capture, in the words the table shows. */
export const officeRow = (capture) => {
  const ocr = capture?.ocr || {};
  const suggestion = capture?.suggestion || null;
  const { date, yearWarning, time } = billDateTime(capture);
  const candidates = officeCandidates(suggestion);
  return {
    id: capture?.id,
    capture,
    plate: chosenPlate(capture),
    confirmed: Boolean(linkedPlate(capture)),
    uploader: identity(
      capture?.uploadedBy,
      capture?.uploaderName || capture?.uploadedByName,
      capture?.uploaderRole || capture?.uploadedByRole,
    ),
    confirmedBy: identity(
      capture?.link?.by || capture?.link?.confirmedBy,
      capture?.link?.byName || capture?.link?.confirmedByName,
      capture?.link?.byRole || capture?.link?.confirmedByRole,
    ),
    confirmedVia: capture?.link?.via === 'UPLOAD' ? 'at upload' : 'in Approvals',
    confirmedByName: name(
      capture?.link?.by || capture?.link?.confirmedBy,
      capture?.link?.byName || capture?.link?.confirmedByName,
    ),
    pump: ocr.pump ?? ocr.station ?? '',
    fuelType: ocr.fuelType || '',
    litres: ocr.litres == null || ocr.litres === '' ? '' : `${ocr.litres} L`,
    amount: money(ocr.amount),
    rate: ocr.rate == null || ocr.rate === '' ? '' : `\u20b9${ocr.rate}/L`,
    date,
    time,
    yearWarning,
    status: matchStatus(capture),
    market: isMarketTruck(suggestion),
    certainty: candidates[0]?.certainty || null,
  };
};

/**
 * The truck of a confirmed bill, in one line. A confirmed bill has one truck —
 * there is nothing left to suggest, and the person who linked it is known.
 */
export const confirmedTruckText = (row) =>
  `Truck: ${row?.plate || DASH} \u00b7 confirmed by ${row?.confirmedByName || 'Unknown'}`;

/**
 * Whether the drawer holds work that closing it would throw away: a truck the
 * person picked but has not confirmed, or a change that has not been saved.
 */
export const hasUnsavedOfficeChanges = ({ editing, plate, savedPlate, reason, truckChosen }) => {
  if (editing) {
    if (String(reason || '').trim()) return true;
    return normalizePlate(plate) !== normalizePlate(savedPlate);
  }
  return Boolean(truckChosen);
};

export default officeRow;
