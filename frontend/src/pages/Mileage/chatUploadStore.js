import { useSyncExternalStore } from 'react';
import PhotoImportService from '../../services/PhotoImportService';
import { openChatExportStream, MAX_PHOTO_ROWS } from './chatExportStream';

/**
 * The upload of a WhatsApp chat, kept in one place for the whole session.
 *
 * The upload belongs to the browser session, not to the dialog: the dialog is
 * only a window on it. Leaving the Mileage page, closing the dialog or
 * unmounting it never stops the upload and never forgets the import — the
 * owner can go on working and comes back to the import when it is over.
 *
 * The store is a plain module with a subscribe/getSnapshot pair, so it is read
 * with useSyncExternalStore and it needs no provider of its own.
 */

/** How often the import is asked how far it has come. */
const POLL_MS = 3000;

/** The server may still be working when we never heard back. */
export const LOST_CONTACT_MESSAGE =
  'We lost contact with the server before the import finished. It may still be running. Wait a few minutes and check Mileage before uploading again.';

/** The photo reader is not running: nothing was imported. */
export const READER_DOWN_MESSAGE =
  'The photo reader is not running, so nothing was imported. Start it and upload the chat again.';

/** The import stopped partway: some photos may already be saved. */
export const PARTWAY_MESSAGE =
  'The import stopped partway. Some photos may already be saved. Uploading the same chat again is safe: photos already saved are skipped.';

/** The import is not on the server any more. */
export const JOB_GONE_MESSAGE =
  "We can't find that import any more. Upload the chat again if it didn't finish.";

/**
 * The plain words of a failure reason.
 *
 * A sentence a person wrote is kept as it is. A raw reason from the machine is
 * translated. A reason nobody understands says so plainly.
 */
const PLAIN_REASONS = [
  {
    match: /could not be read|unreadable|decode|corrupt|damaged/i,
    text: 'The photo could not be read.',
  },
  {
    match: /ocr|unclear|blurry|low.?resolution|not enough|illegible|printed/i,
    text: 'The details on the photo could not be read.',
  },
  { match: /no file|not found|missing/i, text: 'The photo file was missing.' },
  {
    match: /unsupported|invalid|not an image|bad image/i,
    text: 'The photo file was not an image we could read.',
  },
  { match: /too large|file size|exceed/i, text: 'The photo was too large to read.' },
  { match: /network|timeout|timed out|offline/i, text: 'The photo could not be fetched.' },
];

/** A count the server did not send is not known: it shows as a dash. */
const countText = (value) =>
  value === null || value === undefined || value === '' ? '—' : String(value);

/**
 * A failure reason in plain words.
 *
 * A sentence a person wrote stays as it is. A raw reason from the machine is
 * translated. A reason nobody understands says so plainly.
 */
export function plainReason(reason) {
  const text = typeof reason === 'string' ? reason.trim() : '';
  if (!text) return 'Some details could not be read.';
  const hasBrackets = /[{}<>|]/.test(text) || text.includes('[') || text.includes(']');
  const human =
    /[a-z]/i.test(text) &&
    /\s/.test(text) &&
    !hasBrackets &&
    !/\bHTTP\b|\bstatus\b|\b\d{3}\b|[A-Za-z]:\\|\\\\|\/(?:tmp|var|home|users)\//i.test(text) &&
    !/\b[A-Z0-9]+_[A-Z0-9_]+\b/.test(text);
  if (human) return text;
  for (const rule of PLAIN_REASONS) {
    if (rule.match.test(text)) return rule.text;
  }
  return 'Some details could not be read.';
}

const initialState = {
  // idle | uploading | reading | done | failed | unreachable
  stage: 'idle',
  // How much of the file is on its way to the server.
  percent: 0,
  // The import on the server, once the file has been sent.
  jobId: null,
  // How many photos have been read out of how many.
  progress: { read: 0, total: 0 },
  // The photos as they are read, newest first.
  photoRows: { rows: [], more: 0 },
  // What the import made, once it is over.
  result: null,
  // The words of a failure.
  error: null,
  failureHeading: 'Nothing was imported',
  failureDetail: '',
  // The chat that is being sent, kept so it can be sent again.
  file: null,
  // How many chats have been sent in this session: every one of them is told
  // about once, when it is over.
  runId: 0,
  // The dialog asks to be shown (the little pill at the bottom of the page).
  dialogOpen: false,
  // The pill is put away, but the import is still there.
  dismissed: false,
};

let state = { ...initialState };
const listeners = new Set();
// The upload that is being sent. Only an explicit cancel touches it.
let request = null;
// The live line of the import.
let stream = null;
// The timer that asks the server how far the import has come.
let pollTimer = null;
// The last event of the live line: a browser that comes back asks for the rest.
let lastEventId = 0;
// The listeners that want to know when a chat has come in.
const importedListeners = new Set();

/** Put the new state in place and tell everyone who is watching. */
function setState(patch) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

/** Watch the store. Returns the way to stop watching. */
export function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The state as it is right now. */
export function getState() {
  return state;
}

/** The state of the upload, as React wants it. */
export function useChatUpload() {
  return useSyncExternalStore(subscribe, getState);
}

/** The live line is closed: the import itself keeps running. */
function closeStream() {
  if (stream) {
    stream.close();
    stream = null;
  }
}

/** The asking stops: the import is over. */
function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/**
 * The words of a failed import.
 *
 * A reader that is not running keeps its own sentence: nothing was imported,
 * and the chat can be sent again. Any other failure may have saved some
 * photos already, so it says so instead of promising that nothing happened.
 */
export function failureText(view) {
  const serverMessage = typeof view?.error === 'string' ? view.error.trim() : '';
  const readerDown =
    view?.errorCode === 'READER_DOWN' || /photo reader is not running/i.test(serverMessage);
  if (readerDown) {
    return {
      heading: 'Nothing was imported',
      message: serverMessage || READER_DOWN_MESSAGE,
      detail: '',
    };
  }
  return {
    heading: 'The import stopped partway',
    message: PARTWAY_MESSAGE,
    detail: serverMessage && serverMessage !== PARTWAY_MESSAGE ? plainReason(serverMessage) : '',
  };
}

/** The server's own words when it has them. */
function serverErrorMessage(err) {
  const message =
    err?.response?.data?.message || err?.response?.data?.data?.message || err?.response?.data?.error;
  return message ? String(message) : null;
}

/** True when we never heard back: the import may still be running. */
function isLostContact(err) {
  const code = err?.code || '';
  if (code === 'ECONNABORTED' || code === 'ETIMEDOUT' || code === 'ERR_NETWORK') return true;
  return /timeout|timed out|network error/i.test(String(err?.message || ''));
}

/**
 * The buckets of the photos: every photo is in exactly one of them, and they
 * add up to the number of photos.
 */
export function bucketsOf(result) {
  const names = [
    'saved',
    'waiting',
    'market',
    'alreadyReceived',
    'unreadable',
    'failed',
    'other',
  ];
  const sent = result?.photoBuckets;
  const out = {};
  for (const name of names) {
    const value = sent && typeof sent === 'object' ? sent[name] : undefined;
    // A count the server did not send is not zero: it is not known.
    out[name] = value === null || value === undefined || value === '' ? null : Number(value);
  }
  return out;
}

/** The fills of the chat: the groups of photos that make one fill. */
export function fillsOf(result) {
  const names = ['saved', 'waiting', 'market', 'alreadyReceived', 'failed'];
  const sent = result?.fills;
  const out = {};
  for (const name of names) {
    const value = sent && typeof sent === 'object' ? sent[name] : undefined;
    out[name] = value === null || value === undefined || value === '' ? null : Number(value);
  }
  return out;
}

/** How many photos there are: the buckets add up to them. */
export function photosTotalOf(result, buckets) {
  const photos = result?.photos;
  if (photos !== null && photos !== undefined && photos !== '' && Number.isFinite(Number(photos))) {
    return Number(photos);
  }
  if (!buckets) return null;
  const values = Object.values(buckets);
  // Only a sum that is complete counts; a half-known sum is not a number.
  if (!values.length || values.some((value) => value === null || value === undefined)) return null;
  return values.reduce((sum, value) => sum + Number(value), 0);
}

/**
 * The failures of one import, grouped the way the owner reads them:
 * "12 photos: the photo could not be read".
 */
export function failureGroups(result) {
  const sent = Array.isArray(result?.failedGroups) ? result.failedGroups : null;
  if (sent && sent.length) {
    return sent.map((group) => ({
      reason: plainReason(group?.reason),
      // A count the server did not send is unknown, not zero.
      count:
        group?.count === null || group?.count === undefined || group?.count === ''
          ? null
          : Number(group.count),
    }));
  }
  const failed = Array.isArray(result?.failed) ? result.failed : [];
  const groups = new Map();
  for (const item of failed) {
    const reason = plainReason(typeof item === 'string' ? item : item?.reason);
    const key = reason.toLowerCase();
    const group = groups.get(key);
    if (group) group.count += 1;
    else groups.set(key, { reason, count: 1 });
  }
  return Array.from(groups.values());
}

/**
 * The end of one import, in the words the owner reads.
 *
 * Nothing new means nothing to be happy about: the end state is neutral.
 */
export function summarise(result) {
  const buckets = bucketsOf(result);
  const fills = fillsOf(result);
  const groups = failureGroups(result);
  const photosTotal = photosTotalOf(result, buckets);
  const failedList = Array.isArray(result?.failed) ? result.failed : null;
  const failedGroupsSent = Array.isArray(result?.failedGroups);
  const failedGroupsKnown =
    failedGroupsSent && groups.every((group) => group.count !== null && Number.isFinite(group.count));
  const failedNumber =
    result?.failed != null && !Array.isArray(result.failed) && result.failed !== ''
      ? Number(result.failed)
      : null;
  const failedTotal = failedList
    ? failedList.length
    : failedGroupsKnown
      ? groups.reduce((sum, group) => sum + group.count, 0)
      : Number.isFinite(failedNumber)
        ? failedNumber
        : null;
  // Counts the server never sent are not zero: they are not known.
  const unknown = fills.saved === null || fills.waiting === null || failedTotal === null;
  const hasProblems = failedTotal !== null && failedTotal > 0;
  const nothingNew = !unknown && fills.saved === 0 && fills.waiting === 0;
  const tone = unknown || nothingNew ? 'bp-neutral' : hasProblems ? 'bp-warning' : 'bp-success';
  const title = unknown
    ? 'Import finished — some counts not reported.'
    : nothingNew
      ? 'Nothing new in this chat'
      : hasProblems
        ? `Imported, with ${failedTotal} ${failedTotal === 1 ? 'problem' : 'problems'}`
        : 'Chat imported';
  const summaryParts = [];
  if (fills.saved > 0) {
    summaryParts.push(
      `${fills.saved} ${fills.saved === 1 ? 'fill' : 'fills'} saved to the mileage list`,
    );
  }
  if (fills.waiting > 0) {
    summaryParts.push(
      `${fills.waiting} ${fills.waiting === 1 ? 'fill is' : 'fills are'} waiting for you to check`,
    );
  }
  if (buckets.alreadyReceived > 0) {
    summaryParts.push(
      `${buckets.alreadyReceived} ${
        buckets.alreadyReceived === 1 ? 'photo was' : 'photos were'
      } already imported`,
    );
  }
  const line = unknown
    ? `Saved: ${countText(fills.saved)} · Waiting: ${countText(fills.waiting)} · Failed: ${countText(failedTotal)}`
    : nothingNew
      ? `Nothing new in this chat. All ${countText(photosTotal)} photos were already imported.`
      : summaryParts.length
        ? `${summaryParts.join('. ')}.`
        : 'Nothing was added to the mileage list.';
  return {
    title,
    tone,
    line,
    buckets,
    fills,
    groups,
    photosTotal,
    failedTotal,
    hasProblems,
    nothingNew,
    unknown,
  };
}

/**
 * The title of the little pill: what happened, in a few words.
 *
 * "Chat imported: 12 saved, 40 waiting" or "Nothing new in this chat".
 */
export function pillTitleOf(summary) {
  if (!summary) return '';
  if (summary.nothingNew) return summary.title;
  const parts = [];
  if (summary.fills.saved > 0) parts.push(`${summary.fills.saved} saved`);
  if (summary.fills.waiting > 0) parts.push(`${summary.fills.waiting} waiting`);
  if (!parts.length) return summary.title;
  return `${summary.title}: ${parts.join(', ')}`;
}

/** The chat that is going to be sent. */
export function setFile(file) {
  setState({ file });
}

/** Send a chat. The upload belongs to the session, not to the dialog. */
export async function startUpload(file) {
  if (!file) return null;
  stopPolling();
  closeStream();
  const controller = new AbortController();
  request = controller;
  lastEventId = 0;
  setState({
    stage: 'uploading',
    percent: 0,
    jobId: null,
    progress: { read: 0, total: 0 },
    photoRows: { rows: [], more: 0 },
    result: null,
    error: null,
    failureHeading: 'Nothing was imported',
    failureDetail: '',
    dismissed: false,
    runId: Number(state.runId || 0) + 1,
    file,
  });
  try {
    const answer = await PhotoImportService.uploadWhatsappExport(file, {
      signal: controller.signal,
      onUploadProgress: (event) => {
        const total = Number(event?.total || 0);
        const loaded = Number(event?.loaded || 0);
        if (!total) return;
        setState({ percent: Math.min(100, Math.round((loaded / total) * 100)) });
      },
    });
    if (controller.signal.aborted) return null;
    const jobId = answer?.jobId;
    if (!jobId) throw new Error('The chat could not be uploaded. Please try again.');
    // The import is on the server now: the session follows it from here.
    setState({ jobId, stage: 'reading' });
    followJob(jobId);
    return jobId;
  } catch (err) {
    if (controller.signal.aborted) return null;
    const serverMessage = serverErrorMessage(err);
    if (serverMessage) {
      setState({
        stage: 'failed',
        error: serverMessage,
        failureHeading: 'Nothing was imported',
        failureDetail: '',
      });
    } else if (isLostContact(err)) {
      setState({
        stage: 'unreachable',
        error: LOST_CONTACT_MESSAGE,
        failureHeading: 'The import may still be running',
        failureDetail: '',
      });
    } else {
      setState({
        stage: 'failed',
        error: 'The chat could not be uploaded. Please try again.',
        failureHeading: 'Nothing was imported',
        failureDetail: '',
      });
    }
    return null;
  } finally {
    if (request === controller) request = null;
  }
}

/**
 * Stop the bytes that are on their way. Only this stops an upload: closing
 * the dialog or leaving the page does not.
 */
export function cancelUpload() {
  if (state.stage !== 'uploading') return false;
  if (request) request.abort();
  request = null;
  setState({ stage: 'idle', percent: 0, error: null });
  return true;
}

/** The import is over: the counts are what it made. */
function finishDone(result) {
  stopPolling();
  closeStream();
  setState({ stage: 'done', result, error: null, failureDetail: '' });
  for (const listener of importedListeners) {
    try {
      listener(result);
    } catch {
      /* a listener that breaks does not break the import */
    }
  }
}

/** The import failed: the words say how much was lost. */
function finishFailed(words) {
  stopPolling();
  closeStream();
  setState({
    stage: 'failed',
    error: words.message,
    failureHeading: words.heading,
    failureDetail: words.detail || '',
  });
}

/** One event of the live line of the import. */
function handleEvent(current, event) {
  if (state.jobId !== current) return;
  const payload = event?.data || {};
  if (payload.seq) lastEventId = Number(payload.seq);
  if (event.type === 'photo') {
    const rows = [payload, ...state.photoRows.rows];
    const more = state.photoRows.more + Math.max(0, rows.length - MAX_PHOTO_ROWS);
    setState({
      photoRows: { rows: rows.slice(0, MAX_PHOTO_ROWS), more },
      progress: {
        read: Math.max(Number(state.progress.read || 0), Number(payload.i || 0)),
        total: Number(payload.total || state.progress.total || 0),
      },
    });
    return;
  }
  if (event.type === 'done') {
    finishDone(payload.summary || {});
    return;
  }
  if (event.type === 'failed') {
    finishFailed(failureText({ error: payload.message, errorCode: payload.errorCode }));
  }
}

/** Ask the server how far the import has come. */
async function ask(jobId) {
  let view = null;
  try {
    view = await PhotoImportService.getChatExportJob(jobId);
  } catch (err) {
    if (err?.response?.status === 404) {
      // The import is not on the server any more.
      finishFailed({ heading: 'The import could not be found', message: JOB_GONE_MESSAGE, detail: '' });
    }
    // The connection dropped: the import keeps running, so keep asking.
    return;
  }
  if (!view || state.jobId !== jobId) return;
  setState({
    progress: {
      read: Number(view.progress?.read || 0),
      total: Number(view.progress?.total || 0),
    },
  });
  if (view.state === 'done') {
    finishDone(view.result || {});
    return;
  }
  if (view.state === 'failed') {
    finishFailed(failureText(view));
    return;
  }
  setState({ stage: 'reading' });
}

/**
 * Follow one import: the live line for the photos, and the asking for the
 * state of the import. Both of them live here, in the session, so the import
 * is followed even when no dialog is open.
 */
function followJob(jobId) {
  if (!jobId) return;
  closeStream();
  stopPolling();
  const current = jobId;
  stream = openChatExportStream(current, {
    lastEventId: lastEventId || undefined,
    onEvent: (event) => handleEvent(current, event),
    // The live line is not there: the asking below keeps the import going.
    onError: () => {},
  });
  pollTimer = setInterval(() => {
    ask(current);
  }, POLL_MS);
  ask(current);
}

/**
 * Pick an import up again after a reload: the server says which import is
 * running for this organisation, if there is one.
 *
 * @returns {Promise<string|null>} the job that was picked up
 */
export async function attachActiveJob() {
  if (state.stage === 'uploading' || state.stage === 'reading') return state.jobId;
  let answer = null;
  try {
    answer = await PhotoImportService.getActiveChatExportJob();
  } catch {
    // The server is not answering: there is nothing to pick up.
    return null;
  }
  const jobId = answer?.jobId || null;
  if (!jobId) return null;
  setState({
    jobId,
    stage: 'reading',
    progress: {
      read: Number(answer?.progress?.read || 0),
      total: Number(answer?.progress?.total || 0),
    },
  });
  followJob(jobId);
  return jobId;
}

/** Put the pill away. The import itself is not touched. */
export function dismiss() {
  setState({ dismissed: true });
}

/** Ask for the dialog to be shown. */
export function openDialog() {
  setState({ dialogOpen: true });
}

/** The dialog is hidden. The import keeps running. */
export function closeDialog() {
  setState({ dialogOpen: false });
}

/**
 * Be told when a chat has come in: the list of the mileage is read again.
 *
 * @returns {Function} the way to stop listening
 */
export function onImported(listener) {
  importedListeners.add(listener);
  return () => {
    importedListeners.delete(listener);
  };
}

/** Does the address ask for the dialog to be shown? */
export function urlWantsOpen() {
  if (typeof window === 'undefined' || !window.location) return false;
  try {
    return new URLSearchParams(window.location.search).get('chatUpload') === 'open';
  } catch {
    return false;
  }
}

/** Take the request for the dialog out of the address. */
export function clearUrlFlag() {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('chatUpload')) return;
    url.searchParams.delete('chatUpload');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* the address stays as it is */
  }
}

/** Put the store back to the start: for the tests. */
export function reset() {
  stopPolling();
  closeStream();
  if (request) {
    request.abort();
    request = null;
  }
  lastEventId = 0;
  state = { ...initialState };
  for (const listener of listeners) listener();
}
