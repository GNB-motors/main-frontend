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
  const candidates = Array.isArray(truck?.candidates) ? truck.candidates.length : 0;
  if (!candidates) {
    return { text: '—', note: 'Truck not identified', kind: 'none' };
  }
  return { text: 'Guess', note: '', kind: 'guess' };
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
