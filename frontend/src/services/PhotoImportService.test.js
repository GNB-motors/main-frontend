import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../utils/axiosConfig';
import PhotoImportService from './PhotoImportService';

vi.mock('../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

describe('WhatsApp chat export upload', () => {
  beforeEach(() => vi.clearAllMocks());

  it('posts the zip as the file field to the whatsapp-export route and takes the job id', async () => {
    const file = new File(['zip'], 'mehfuz-chat.zip', { type: 'application/zip' });
    apiClient.post.mockResolvedValue({ data: { status: 'success', jobId: 'job-1', data: { jobId: 'job-1' } } });
    const onUploadProgress = vi.fn();

    await expect(
      PhotoImportService.uploadWhatsappExport(file, { onUploadProgress }),
    ).resolves.toEqual({ jobId: 'job-1' });

    const [url, body, options] = apiClient.post.mock.calls[0];
    expect(url).toBe('/api/photo-imports/whatsapp-export');
    expect(body.get('file').name).toBe('mehfuz-chat.zip');
    expect(options.onUploadProgress).toBe(onUploadProgress);
    // The server only queues the chat here: the reading takes a long time.
    expect(options.timeout).toBe(30 * 60 * 1000);
  });

  it('asks the job route how the import is going', async () => {
    const view = { state: 'reading', progress: { read: 12, total: 96 } };
    apiClient.get.mockResolvedValue({ data: { status: 'success', data: view } });

    await expect(PhotoImportService.getChatExportJob('job-1')).resolves.toEqual(view);

    const [url] = apiClient.get.mock.calls[0];
    expect(url).toBe('/api/photo-imports/chat-export/jobs/job-1');
  });

  it('reads only the pending driver-sheet suggestions', async () => {
    const rows = [{ _id: 's1', plate: 'WB25V8040', kind: 'MISSING' }];
    apiClient.get.mockResolvedValue({ data: rows });

    await expect(PhotoImportService.getDriverSheetSuggestions()).resolves.toEqual(rows);

    const [url, options] = apiClient.get.mock.calls[0];
    expect(url).toBe('/api/photo-imports/driver-suggestions');
    expect(options.params).toEqual({ status: 'PENDING' });
  });

  it('confirms and dismisses driver-sheet suggestions by id', async () => {
    // The reply main-backend driverSheet.service sends: one result per id.
    apiClient.post.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          results: [
            { id: 's1', status: 'confirmed', assignmentId: 'a1' },
            { id: 's3', status: 'failed', reason: 'The truck already has a driver then.' },
            { id: 's4', status: 'skipped', reason: 'not found or not pending' },
          ],
          confirmed: 1,
          failed: 1,
        },
      },
    });

    await expect(PhotoImportService.confirmDriverSheetSuggestions(['s1'])).resolves.toEqual({
      confirmed: ['s1'],
      failed: [
        { id: 's3', message: 'The truck already has a driver then.' },
        { id: 's4', message: 'not found or not pending' },
      ],
    });
    expect(apiClient.post.mock.calls[0]).toEqual([
      '/api/photo-imports/driver-suggestions/confirm',
      { ids: ['s1'] },
      { signal: undefined },
    ]);

    await PhotoImportService.dismissDriverSheetSuggestions(['s2']);
    expect(apiClient.post.mock.calls[1]).toEqual([
      '/api/photo-imports/driver-suggestions/dismiss',
      { ids: ['s2'] },
      { signal: undefined },
    ]);
  });
});
