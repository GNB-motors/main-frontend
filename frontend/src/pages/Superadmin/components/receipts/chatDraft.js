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
 * The mileage of a row and how it compares with the usual of that truck.
 *
 * Nothing is worked out here: the numbers are the ones the server measured,
 * and the verdict is the one it gave.
 */
export const mileageOf = (row) => {
  const raw = row?.mileage;
  if (!raw || typeof raw !== 'object') return null;
  const vs = raw.vsAverage && typeof raw.vsAverage === 'object' ? raw.vsAverage : null;
  const verdictRaw = vs ? String(vs.verdict || '') : '';
  const verdict = ['low', 'ok', 'too_high', 'better', 'worse', 'in_line', 'outside_range'].includes(verdictRaw) ? verdictRaw : null;
  const average = vs ? toNumber(vs.average) : null;
  const n = vs ? toNumber(vs.n) : null;
  const deltaPct = vs ? toNumber(vs.deltaPct) : null;
  return {
    computed: toNumber(raw.computed),
    average,
    n,
    deltaPct,
    verdict,
    source: vs?.source || null,
    // The lowest and highest km/L of the truck's own past fill-to-fill rounds.
    computedFrom: raw.computedFrom || null,
    previous: row?.kmSinceLastFill?.previous || null,
    rangeLow: vs?.range ? toNumber(vs.range.low) : null,
    rangeHigh: vs?.range ? toNumber(vs.range.high) : null,
    // A comparison needs all of its own parts: without them there is none.
    hasComparison: average != null && deltaPct != null && verdict != null,
  };
};

/** A number as a person reads it: no trailing zeros, at most two decimals. */
const trimNumber = (value) => String(Number(Number(value).toFixed(2)));

/**
 * The mileage of a row, in one line: "3.4 km/L · 12% below this truck's usual
 * 3.9 (8 fills)".
 *
 * When the comparison is not there, the known value stays and the line says
 * "Comparison not available". A verdict is never worked out from missing
 * numbers.
 */
export const mileageLine = (row) => {
  const facts = mileageOf(row);
  if (!facts) return null;
  const basis =
    facts.computedFrom === 'ODOMETER'
      ? ' (km from the odometer photos)'
      : facts.computedFrom === 'CAPTION'
        ? ' (km from the message)'
        : '';
  const current = facts.computed != null ? `${trimNumber(facts.computed)} km/L${basis}` : '';
  if (!facts.hasComparison) {
    if (!current) return null;
    // The source belongs to the comparison, and there is no comparison here.
    return { text: `${current} · Comparison not available`, kind: 'neutral', source: null };
  }
  const usual =
    facts.n != null
      ? `${trimNumber(facts.average)} (${facts.n} fills)`
      : `${trimNumber(facts.average)} (its fuel profile)`;
  const percent = `${trimNumber(Math.abs(facts.deltaPct))}%`;
  // The owner's rule: more than 5% under the truck's usual is low; above it is
  // fine; far above it means the km or the litres are wrong (a top-up).
  if (facts.verdict === 'low') {
    return {
      text: `${current ? `${current} · ` : ''}low: ${percent} below this truck's usual ${usual}`,
      kind: 'warn',
      source: facts.source,
    };
  }
  if (facts.verdict === 'ok') {
    return {
      text: `${current ? `${current} · ` : ''}OK: ${facts.deltaPct < 0 ? 'near' : 'at or above'} this truck's usual ${usual}`,
      kind: 'neutral',
      source: facts.source,
    };
  }
  if (facts.verdict === 'too_high') {
    return {
      text: `${current ? `${current} · ` : ''}far above this truck's usual ${usual} — the km or litres are wrong (a top-up?)`,
      kind: 'warn',
      source: facts.source,
    };
  }
  if (facts.verdict === 'outside_range') {
    // Outside everything this truck has done: the km or litres are suspect
    // (a top-up, a misread odometer), so it is not called better or worse.
    const range =
      facts.rangeLow != null && facts.rangeHigh != null
        ? ` (${trimNumber(facts.rangeLow)}–${trimNumber(facts.rangeHigh)} km/L)`
        : '';
    return {
      text: `${current ? `${current} · ` : ''}doesn't fit this truck's past fills${range} — check the km and litres`,
      kind: 'warn',
      source: facts.source,
    };
  }
  let comparison;
  if (facts.verdict === 'worse') {
    comparison = `${percent} below this truck's usual ${usual}`;
  } else if (facts.verdict === 'better') {
    comparison = `${percent} above this truck's usual ${usual}`;
  } else {
    comparison = `in line with this truck's usual ${usual}`;
  }
  return {
    text: current ? `${current} · ${comparison}` : comparison,
    kind: facts.verdict === 'worse' ? 'warn' : 'neutral',
    source: facts.source,
  };
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
        vehicleIdOf({ vehicleId: c.vehicleId }) ||
        c.vehicleId?._id ||
        vehicle._id ||
        c._id ||
        '';
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
