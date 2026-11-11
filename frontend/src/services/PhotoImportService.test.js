import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../utils/axiosConfig';
import PhotoImportService from './PhotoImportService';

vi.mock('../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

describe('WhatsApp chat export upload', () => {
  beforeEach(() => vi.clearAllMocks());

  it('posts the zip as the file field to the whatsapp-export route and unwraps the answer', async () => {
    const file = new File(['zip'], 'mehfuz-chat.zip', { type: 'application/zip' });
    const answer = { filename: 'mehfuz-chat.zip', messages: 12, photos: 10, failed: [] };
    apiClient.post.mockResolvedValue({ data: { data: answer } });
    const onUploadProgress = vi.fn();

    await expect(
      PhotoImportService.uploadWhatsappExport(file, { onUploadProgress }),
    ).resolves.toEqual(answer);

    const [url, body, options] = apiClient.post.mock.calls[0];
    expect(url).toBe('/api/photo-imports/whatsapp-export');
    expect(body.get('file').name).toBe('mehfuz-chat.zip');
    expect(options.onUploadProgress).toBe(onUploadProgress);
    // The server reads every photo before it answers: the wait is long.
    expect(options.timeout).toBe(30 * 60 * 1000);
  });
});
