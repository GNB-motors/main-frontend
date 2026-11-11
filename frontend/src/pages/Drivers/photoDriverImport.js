/**
 * Reading what the photo reader found — without showing its working.
 *
 * The reader is good at recognising a document and bad at guessing a person.
 * So it says three things and no more: this driver is already in the list, this
 * driver is probably one of these people, or this driver is new. It never shows
 * a confidence, a checksum or the digits it read off an identity document.
 */

const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

/** Is this file a photo (as opposed to a spreadsheet)? */
export function isPhotoFile(file) {
  if (!file) return false;
  const name = String(file.name || '').toLowerCase();
  if (PHOTO_EXTENSIONS.some((ext) => name.endsWith(`.${ext}`))) return true;
  return String(file.type || '').startsWith('image/');
}

/**
 * Split a mixed pick into the photos and the spreadsheets.
 *
 * @param {Array<File>} files
 * @returns {{ photos: Array<File>, sheets: Array<File> }}
 */
export function splitFiles(files = []) {
  const photos = [];
  const sheets = [];
  Array.from(files || []).forEach((file) => {
    (isPhotoFile(file) ? photos : sheets).push(file);
  });
  return { photos, sheets };
}

/**
 * The fields an owner needs to recognise a driver. Everything the reader
 * measured (scores, checksums) and everything it read off an identity document
 * is left out on purpose.
 *
 * @param {object} row
 */
export function driverRowView(row = {}) {
  const match = row.match || {};
  const status = ['existing', 'likely', 'new'].includes(match.status) ? match.status : 'new';
  const candidates = (Array.isArray(match.candidates) ? match.candidates : []).map((candidate) => ({
    userId: candidate.userId || candidate._id || '',
    name: candidate.name || '',
    phone: candidate.phone || '',
    matched: Array.isArray(candidate.matched || candidate.matchedFields || candidate.matchedOn)
      ? candidate.matched || candidate.matchedFields || candidate.matchedOn
      : [],
  }));
  return {
    key: row.key || '',
    name: row.nameRead || row.name || '',
    phone: row.phone || '',
    licenceNumber: row.licenceNumber || '',
    photoCount: Number(row.photoCount || 0),
    status,
    userId: match.userId || '',
    candidates,
  };
}

/**
 * What we suggest the owner does with a row. An existing driver is used as it
 * is; a likely one is used only if the owner says so; a new one is created.
 */
export function defaultDecision(view) {
  if (view.status === 'existing') {
    return { action: 'use', userId: view.userId || '', name: view.name || '' };
  }
  if (view.status === 'likely') {
    const first = view.candidates[0];
    if (first) return { action: 'use', userId: first.userId, name: first.name };
  }
  return { action: 'create', userId: '', name: view.name || '' };
}

/**
 * The body the server wants: one item per row, nothing else.
 *
 * @param {Array<object>} views
 * @param {Record<string, {action: string, userId?: string, name?: string}>} decisions
 */
export function resolveItems(views = [], decisions = {}) {
  return views.map((view) => {
    const decision = decisions[view.key] || defaultDecision(view);
    if (decision.action === 'skip') return { key: view.key, action: 'skip' };
    if (decision.action === 'use') {
      return { key: view.key, action: 'use', userId: decision.userId || '' };
    }
    const name = String(decision.name || '').trim();
    return { key: view.key, action: 'create', name };
  });
}
