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
    const view = { state: 'running', progress: { read: 12, total: 96 } };
    apiClient.get.mockResolvedValue({ data: { status: 'success', data: view } });

    await expect(PhotoImportService.getChatExportJob('job-1')).resolves.toEqual(view);

    const [url] = apiClient.get.mock.calls[0];
    expect(url).toBe('/api/photo-imports/chat-export/jobs/job-1');
  });
});
