/**
 * The chat-import row: a fuel photo a driver sent in a WhatsApp chat.
 *
 * It reaches the same inbox as a guided receipt, but the parts a guided
 * receipt already knows (the truck, the litres, the time) may be missing or
 * unsure. These helpers read what the row says and build what a person
 * changed, so the drawer can offer every field for editing.
 */

/** A row that came in through a WhatsApp chat. */
export const isChatRow = (row) => row?.source === 'CHAT_IMPORT';

/**
 * Who sent the photo.
 *
 * A chat row names its sender; a guided receipt carries the user who uploaded
 * it. This is the uploader — never called the driver, because the person who
 * sends a photo is not always the person who drove the truck.
 */
export const uploaderOf = (row) => {
  if (isChatRow(row)) {
    const sender = row?.sender;
    const name =
      typeof sender === 'string'
        ? sender.trim()
        : [sender?.name, sender?.firstName, sender?.lastName].filter(Boolean).join(' ').trim();
    return name || row?.phoneE164 || '—';
  }
  const name = [row?.userId?.firstName, row?.userId?.lastName].filter(Boolean).join(' ').trim();
  return name || row?.phoneE164 || '—';
};

/**
 * The driver, only when the row says who drove. Most rows do not, and then
 * the drawer says so instead of calling the uploader the driver.
 */
export const driverOf = (row) => {
  const driver = row?.driver;
  if (!driver) return null;
  if (typeof driver === 'string') return driver.trim() || null;
  const name = [driver?.name, driver?.firstName, driver?.lastName].filter(Boolean).join(' ').trim();
  return name || null;
};

/**
 * The chip that says how sure we are about the truck of a row.
 * Nothing is claimed that was not measured.
 */
export const truckChip = (row) => {
  const truck = row?.truck;
  if (row?.market === true || truck?.status === 'MARKET') {
    return { text: 'Market truck', note: '', kind: 'market' };
  }
  if (truck?.bucket === 'EXACT') {
    return { text: 'Sure', note: '', kind: 'sure' };
  }
  // The server may say the truck itself is only likely: then it says so.
  const level = String(truck?.level || truck?.overallLevel || '')
    .trim()
    .toLowerCase();
  if (level === 'likely') {
    return { text: 'Likely', note: '', kind: 'likely' };
  }
  const candidates = Array.isArray(truck?.candidates) ? truck.candidates.length : 0;
  if (!candidates) {
    return { text: '—', note: 'Truck not identified', kind: 'none' };
  }
  return { text: 'Guess', note: '', kind: 'guess' };
};

/**
 * The driver assigned to the truck of a row, when the server sent one.
 *
 * An assignment says who is supposed to drive the truck. It is never proof
 * that the person who sent the photo drove it, so it is shown as an
 * assignment and nothing more.
 */
export const driverAssignedOf = (row) => {
  const assigned = row?.driverAssigned;
  if (!assigned || typeof assigned !== 'object') return null;
  const name = String(assigned.name || '').trim();
  if (!name) return null;
  return {
    name,
    since: assigned.since || null,
    source: assigned.source || 'ASSIGNMENT',
  };
};

/**
 * The pump of a row: its name, where it is, and where that came from.
 * A row without a pump has no pump facts at all.
 */
export const pumpOf = (row) => {
  const pump = row?.pump;
  if (!pump || typeof pump !== 'object') return null;
  return {
    name: String(pump.name || '').trim() || String(pump.label || '').trim(),
    lat: pump.lat ?? pump.latitude ?? null,
    lng: pump.lng ?? pump.longitude ?? null,
    source: pump.source || null,
  };
};

/**
 * The mileage trend of a row: how the truck has been doing over its last
 * fills, and how that stretch compares with its usual.
 *
 * Nothing is worked out here: the numbers are the ones the server measured,
 * and the verdict is the one it gave.
 */
export const mileageTrendOf = (row) => {
  const raw = row?.mileage?.trend;
  if (!raw || typeof raw !== 'object') return null;
  const verdictRaw = String(raw.verdict || '');
  const verdict = ['low', 'ok', 'too_high'].includes(verdictRaw) ? verdictRaw : null;
  const driverRaw = raw.driver && typeof raw.driver === 'object' ? raw.driver : null;
  const driverName = driverRaw ? String(driverRaw.name || '').trim() : '';
  return {
    from: raw.from ?? null,
    to: raw.to ?? null,
    fills: toNumber(raw.fills),
    km: toNumber(raw.km),
    litres: toNumber(raw.litres),
    kmpl: toNumber(raw.kmpl),
    usual: toNumber(raw.usual),
    usualSource: raw.usualSource || null,
    deltaPct: toNumber(raw.deltaPct),
    verdict,
    // The server's reason when it could not measure, e.g. a misread odometer.
    note: raw.note ? String(raw.note) : null,
    driver: driverName ? { driverId: driverRaw.driverId ?? null, name: driverName } : null,
  };
};

/**
 * The check the server ran on the refill itself: is this refill unusual, and
 * why? Nothing is shown when the server ran no such check.
 */
export const refillCheckOf = (row) => {
  const raw = row?.refillCheck;
  if (!raw || typeof raw !== 'object') return null;
  const reasons = Array.isArray(raw.reasons)
    ? raw.reasons.map((reason) => String(reason || '').trim()).filter(Boolean)
    : [];
  return { unusual: raw.unusual === true, reasons };
};

/**
 * This fill's own mileage, as plain numbers: the km since the last fill and
 * the km/L of this fill. One fill is never judged here.
 */
export const thisFillOf = (row) => {
  const raw = row?.mileage;
  if (!raw || typeof raw !== 'object') return null;
  const computed = toNumber(raw.computed);
  const km = toNumber(
    raw.km ??
      raw.kmSinceLastFill ??
      raw.distanceKm ??
      (typeof row?.kmSinceLastFill === 'number' ? row.kmSinceLastFill : null) ??
      row?.kmSinceLastFill?.km ??
      null,
  );
  if (computed == null && km == null) return null;
  return {
    computed,
    km,
    text:
      km != null
        ? `This fill: ${trimNumber(km)} km since last fill`
        : `This fill: ${trimNumber(computed)} km/L`,
    kmplText: km != null && computed != null ? `${trimNumber(computed)} km/L` : null,
  };
};

/** A number as a person reads it: no trailing zeros, at most two decimals. */
const trimNumber = (value) => String(Number(Number(value).toFixed(2)));

/**
 * A day of the trend in plain words: "1 Nov". A day we cannot read stays the
 * way the server wrote it.
 */
const trendDay = (value) => {
  if (value == null || value === '') return null;
  const text = String(value).trim();
  if (!text) return null;
  const day = new Date(text);
  if (Number.isNaN(day.getTime())) return text;
  // A plain day (no time of day) is read in UTC, so the day never moves with
  // the clock of the person looking at it.
  const onlyDay = /^\d{4}-\d{2}-\d{2}$/.test(text);
  return day.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(onlyDay ? { timeZone: 'UTC' } : {}),
  });
};

/**
 * The mileage of a row, in one line: "Mileage, last 5 fills (1 Nov–10 Nov):
 * 2.9 km/L · usual 3.1 · low: 6.5% below usual — watch this truck".
 *
 * The numbers are the ones the server measured over the last fills of the
 * truck, and the verdict is the one it gave for that stretch. One fill on its
 * own is never judged here.
 */
export const mileageLine = (row) => {
  const trend = mileageTrendOf(row);
  if (!trend) return null;
  const from = trendDay(trend.from);
  const to = trendDay(trend.to);
  const range = from && to ? ` (${from}–${to})` : from || to ? ` (${from || to})` : '';
  const fills =
    trend.fills != null ? `${trend.fills} fill${trend.fills === 1 ? '' : 's'}` : 'few fills';
  const head = `Mileage, last ${fills}${range}`;
  const parts = [trend.kmpl != null ? `${head}: ${trimNumber(trend.kmpl)} km/L` : head];
  if (trend.usual != null) parts.push(`usual ${trimNumber(trend.usual)}`);

  // The owner's rule: more than 5% under the truck's usual is low; at or
  // above it is fine; far above it means the km or the litres are wrong.
  let kind = 'neutral';
  if (trend.verdict === 'low') {
    const below =
      trend.deltaPct != null
        ? `${trimNumber(Math.abs(trend.deltaPct))}% below usual — watch this truck`
        : 'below usual — watch this truck';
    parts.push(`low: ${below}`);
    kind = 'warn';
  } else if (trend.verdict === 'ok') {
    parts.push('OK');
  } else if (trend.verdict === 'too_high') {
    parts.push('far above usual — some km or litres are wrong');
    kind = 'warn';
  } else if (trend.note) {
    parts.push(trend.note);
    kind = 'warn';
  } else {
    parts.push('Not enough fills yet');
  }
  if (trend.driver) parts.push(`driver ${trend.driver.name}`);

  return { text: parts.join(' · '), kind, source: trend.usualSource };
};

/** The id of the vehicle of a row, whichever way the row carries it. */
export const vehicleIdOf = (row) => {
  const raw = row?.vehicleId;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') return raw._id || raw.id || '';
  const truck = row?.truck?.vehicleId;
  if (typeof truck === 'string') return truck;
  if (truck && typeof truck === 'object') return truck._id || truck.id || '';
  return '';
};

/**
 * The trucks this photo could be, in plain words. The server sends them in
 * several shapes, so every one of them is read.
 */
export const truckCandidates = (row) => {
  const list = Array.isArray(row?.truck?.candidates) ? row.truck.candidates : [];
  return list
    .map((candidate, index) => {
      const c = candidate || {};
      const vehicle = c.vehicle && typeof c.vehicle === 'object' ? c.vehicle : {};
      const id =
        vehicleIdOf({ vehicleId: c.vehicleId }) || c.vehicleId?._id || vehicle._id || c._id || '';
      const reg =
        c.registrationNumber ||
        c.plate ||
        c.reg ||
        c.vehicleReg ||
        vehicle.registrationNumber ||
        vehicle.plate ||
        '';
      const score = c.score ?? c.confidence ?? null;
      return { id: id || reg || `candidate-${index}`, vehicleId: id, reg, score };
    })
    .filter((c) => c.reg || c.vehicleId);
};

/** A number the server can read, or null when there is none. */
export const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** What the drawer starts with: the row's own values, ready to be changed. */
export const initialChatEdits = (draft) => ({
  vehicleId: vehicleIdOf(draft),
  truckPlate: draft?.truck?.plate || draft?.plateText || '',
  truckPicked: false,
  litres: draft?.litres ?? '',
  amount: draft?.amount ?? '',
  fillingType: draft?.fillingType || '',
  timeAt: '',
  time: null,
});

/**
 * The body of an approve (or mark-as-market) call: only the fields a person
 * filled in. A field left empty is left out, so the server can ask for it in
 * plain words instead of saving a blank.
 */
export const publishPayload = (edits) => {
  const payload = {};
  if (!edits) return payload;
  if (edits.vehicleId) payload.vehicleId = edits.vehicleId;
  if (edits.truckPlate) payload.truckPlate = String(edits.truckPlate).trim();
  const litres = toNumber(edits.litres);
  if (litres != null) payload.litres = litres;
  const amount = toNumber(edits.amount);
  if (amount != null) payload.amount = amount;
  if (edits.fillingType) payload.fillingType = edits.fillingType;
  if (edits.time?.action === 'accept') payload.time = { action: 'accept' };
  else if (edits.time?.action === 'set' && edits.time.at) {
    payload.time = { action: 'set', at: edits.time.at };
  }
  return payload;
};
