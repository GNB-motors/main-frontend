import { describe, it, expect, vi, beforeEach } from 'vitest';
import PhotoImportService from '../../services/PhotoImportService';
import * as store from './chatUploadStore';

vi.mock('../../services/PhotoImportService', () => ({
  default: {
    uploadWhatsappExport: vi.fn(),
    getChatExportJob: vi.fn(),
    getActiveChatExportJob: vi.fn(),
  },
}));

// The live line of the import is watched here, so the test can play the part
// of the server.
const { streamMock } = vi.hoisted(() => {
  const calls = [];
  const open = vi.fn((jobId, options) => {
    const handle = { jobId, options, closed: false };
    handle.close = vi.fn(() => {
      handle.closed = true;
    });
    calls.push(handle);
    return handle;
  });
  return { streamMock: { calls, open } };
});

vi.mock('./chatExportStream', () => ({
  MAX_PHOTO_ROWS: 200,
  openChatExportStream: (...args) => streamMock.open(...args),
}));

const zipFile = () => new File(['zip'], 'mehfuz-chat.zip', { type: 'application/zip' });

const flush = async (times = 4) => {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
  }
};

describe('the chat upload of the session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    streamMock.calls.length = 0;
    store.reset();
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'running',
      progress: { read: 1, total: 10 },
    });
    PhotoImportService.getActiveChatExportJob.mockResolvedValue({ jobId: null });
  });

  it('keeps the bytes on their way: only an explicit cancel stops them', async () => {
    let signal = null;
    PhotoImportService.uploadWhatsappExport.mockImplementation((_file, options) => {
      signal = options.signal;
      return new Promise(() => {});
    });

    store.startUpload(zipFile());
    await flush();

    expect(store.getState().stage).toBe('uploading');
    expect(signal.aborted).toBe(false);

    // Only the owner asking for it stops the upload.
    expect(store.cancelUpload()).toBe(true);
    expect(signal.aborted).toBe(true);
    expect(store.getState().stage).toBe('idle');
  });

  it('keeps the job of the import when the dialog goes away', async () => {
    PhotoImportService.uploadWhatsappExport.mockResolvedValue({ jobId: 'job-1' });

    store.startUpload(zipFile());
    await flush();

    // The import is followed by the session, not by the dialog.
    expect(store.getState().jobId).toBe('job-1');
    expect(store.getState().stage).toBe('reading');
    expect(streamMock.calls.length).toBe(1);
    expect(streamMock.calls[0].jobId).toBe('job-1');
    expect(streamMock.calls[0].closed).toBe(false);
  });

  it('picks the running import up again after a reload', async () => {
    PhotoImportService.getActiveChatExportJob.mockResolvedValue({
      jobId: 'job-9',
      state: 'running',
      progress: { read: 120, total: 589 },
    });
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'running',
      progress: { read: 120, total: 589 },
    });

    const jobId = await store.attachActiveJob();

    expect(jobId).toBe('job-9');
    expect(store.getState().jobId).toBe('job-9');
    expect(store.getState().stage).toBe('reading');
    expect(store.getState().progress).toEqual({ read: 120, total: 589 });
    expect(streamMock.calls[0].jobId).toBe('job-9');
  });

  it('has nothing to pick up when no import is running', async () => {
    PhotoImportService.getActiveChatExportJob.mockResolvedValue({ jobId: null });

    expect(await store.attachActiveJob()).toBeNull();
    expect(store.getState().stage).toBe('idle');
    expect(store.getState().jobId).toBeNull();
  });

  it('says what the import made when it is over', async () => {
    PhotoImportService.uploadWhatsappExport.mockResolvedValue({ jobId: 'job-1' });
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'done',
      progress: { read: 5, total: 5 },
      result: { photos: 5, fills: { saved: 2, waiting: 1 }, failed: [] },
    });
    const imported = vi.fn();
    store.onImported(imported);

    store.startUpload(zipFile());
    await flush();

    expect(store.getState().stage).toBe('done');
    expect(store.getState().result.fills.saved).toBe(2);
    expect(imported).toHaveBeenCalledTimes(1);
  });

  it('says the import may still be running when the server is not answering', async () => {
    PhotoImportService.uploadWhatsappExport.mockRejectedValue(
      Object.assign(new Error('timeout of 1800000ms exceeded'), { code: 'ECONNABORTED' }),
    );

    store.startUpload(zipFile());
    await flush();

    expect(store.getState().stage).toBe('unreachable');
    expect(store.getState().error).toContain('lost contact with the server');
  });
});
