import { describe, it, expect, vi } from 'vitest';
import {
  chatExportEventsUrl,
  parseChatExportFrame,
  openChatExportStream,
  MAX_PHOTO_ROWS,
} from './chatExportStream';

vi.mock('../../utils/session', () => ({
  getToken: vi.fn(() => 'token-1'),
  getOrgId: vi.fn(() => 'org-1'),
}));

// The body of the line: the frames arrive one piece at a time.
const bodyOf = (pieces) => {
  let at = 0;
  return {
    getReader: () => ({
      read: async () =>
        at < pieces.length
          ? { value: new TextEncoder().encode(pieces[at++]), done: false }
          : { value: undefined, done: true },
    }),
  };
};

// Let the promises of the line land.
const flush = async (times = 30) => {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
  }
};

const base = import.meta.env?.VITE_API_BASE_URL || '';

describe('the live line of a chat export', () => {
  it('knows the address of the line of one import', () => {
    expect(chatExportEventsUrl('job 1')).toBe(
      `${base}/api/photo-imports/chat-export/jobs/job%201/events`,
    );
  });

  it('reads one frame of the line', () => {
    const frame = parseChatExportFrame('id: 7\nevent: photo\ndata: {"i":3,"file":"a.jpg"}');
    expect(frame).toEqual({ type: 'photo', id: '7', data: { i: 3, file: 'a.jpg' } });
  });

  it('skips the heartbeats and the frames it cannot read', () => {
    expect(parseChatExportFrame(': ping')).toBeNull();
    expect(parseChatExportFrame('data: {oops')).toBeNull();
  });

  it('joins the words of a frame that is written in more than one line', () => {
    const frame = parseChatExportFrame('event: done\ndata: {"summary":\ndata: {}}');
    expect(frame.type).toBe('done');
    expect(frame.data).toEqual({ summary: {} });
  });

  it('asks the server with the same token and organisation as on every other call', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, body: bodyOf([]) }));
    openChatExportStream('job-1', { fetchImpl });
    await flush();

    const [, options] = fetchImpl.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer token-1');
    expect(options.headers['X-Org-Id']).toBe('org-1');
    expect(options.headers.Accept).toBe('text/event-stream');
    expect(options.headers['Last-Event-ID']).toBeUndefined();
  });

  it('asks only for the events the browser has not seen', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, body: bodyOf([]) }));
    openChatExportStream('job-1', { fetchImpl, lastEventId: 12 });
    await flush();

    expect(fetchImpl.mock.calls[0][1].headers['Last-Event-ID']).toBe('12');
  });

  it('gives every photo to the caller as it comes', async () => {
    const onEvent = vi.fn();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      body: bodyOf([
        'id: 1\nevent: photo\ndata: {"i":1}\n\n',
        'id: 2\nevent: photo\ndata: {"i":2}\n\n',
        'id: 3\nevent: done\ndata: {"summary":{"photos":2}}\n\n',
      ]),
    }));

    openChatExportStream('job-1', { fetchImpl, onEvent });
    await flush(60);

    expect(onEvent.mock.calls.map((call) => call[0].type)).toEqual(['photo', 'photo', 'done']);
    expect(onEvent.mock.calls[2][0].data.summary.photos).toBe(2);
  });

  it('says so when the line is not there', async () => {
    const onError = vi.fn();
    const fetchImpl = vi.fn(async () => {
      throw new Error('no line');
    });

    openChatExportStream('job-1', { fetchImpl, onError });
    await flush();

    expect(onError).toHaveBeenCalled();
  });

  it('says so when the server answers with something else', async () => {
    const onError = vi.fn();
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 404 }));

    openChatExportStream('job-1', { fetchImpl, onError });
    await flush();

    expect(onError).toHaveBeenCalled();
  });

  it('stops the line when it is closed', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, body: bodyOf([]) }));
    const line = openChatExportStream('job-1', { fetchImpl });
    await flush();

    line.close();

    expect(fetchImpl.mock.calls[0][1].signal.aborted).toBe(true);
  });

  it('keeps at most two hundred rows of photos', () => {
    expect(MAX_PHOTO_ROWS).toBe(200);
  });
});
