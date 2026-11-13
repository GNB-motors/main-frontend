import { getOrgId, getToken } from '../../utils/session';

/**
 * The live line of one chat export.
 *
 * The server publishes one event per photo as soon as the photo is read, and a
 * last event that says how the import ended. The browser watches that line
 * here: the same token and the same organisation as on every other call, so
 * the server knows who is asking.
 *
 * When the line is not there (no stream, a dropped connection), the caller
 * keeps asking the job how far it has come: this is a nicer way of following
 * the import, never the only way.
 */

export const CHAT_EXPORT_EVENTS_PATH = '/api/photo-imports/chat-export/jobs';

/** How many rows of photos are shown at once. */
export const MAX_PHOTO_ROWS = 200;

/** The address of the live line of one import. */
export function chatExportEventsUrl(jobId) {
  const base = import.meta.env?.VITE_API_BASE_URL || '';
  return `${base}${CHAT_EXPORT_EVENTS_PATH}/${encodeURIComponent(jobId)}/events`;
}

/**
 * One frame of the stream: its type, its id and its words.
 *
 * @param {string} frame the text between two empty lines
 * @returns {{type: string, id: string|null, data: object}|null}
 */
export function parseChatExportFrame(frame) {
  const lines = String(frame || '').split('\n');
  let type = 'message';
  let id = null;
  const data = [];
  for (const line of lines) {
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event:')) type = line.slice(6).trim();
    else if (line.startsWith('id:')) id = line.slice(3).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
  }
  if (!data.length) return null;
  let payload = null;
  try {
    payload = JSON.parse(data.join('\n'));
  } catch {
    // A frame that cannot be read is skipped: it must not stop the line.
    return null;
  }
  return { type, id, data: payload };
}

/**
 * Open the live line of one import.
 *
 * @param {string} jobId
 * @param {{lastEventId?: number|string, onEvent?: Function, onError?: Function, onOpen?: Function, fetchImpl?: Function}} options
 * @returns {{close: Function}} the handle that closes the line
 */
export function openChatExportStream(
  jobId,
  { lastEventId, onEvent, onError, onOpen, fetchImpl } = {},
) {
  const controller = new AbortController();
  const doFetch = fetchImpl || ((...args) => globalThis.fetch(...args));
  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    try {
      controller.abort();
    } catch {
      /* the line is gone already */
    }
  };

  const run = async () => {
    if (!jobId) return;
    const headers = { Accept: 'text/event-stream' };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const orgId = getOrgId();
    if (orgId) headers['X-Org-Id'] = orgId;
    // The events the browser has not seen yet.
    if (lastEventId) headers['Last-Event-ID'] = String(lastEventId);

    let response = null;
    try {
      response = await doFetch(chatExportEventsUrl(jobId), {
        headers,
        signal: controller.signal,
      });
    } catch (err) {
      if (!closed && onError) onError(err);
      return;
    }
    if (!response || !response.ok || !response.body || !response.body.getReader) {
      if (!closed && onError) onError(new Error('The live line is not available.'));
      return;
    }
    if (!closed && onOpen) onOpen();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let index = buffer.indexOf('\n\n');
        while (index !== -1) {
          const frame = buffer.slice(0, index);
          buffer = buffer.slice(index + 2);
          const parsed = parseChatExportFrame(frame);
          if (parsed && !closed && onEvent) onEvent(parsed);
          index = buffer.indexOf('\n\n');
        }
      }
    } catch (err) {
      if (!closed && onError) onError(err);
    }
  };

  run();

  return { close };
}

export default openChatExportStream;
