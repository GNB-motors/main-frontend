import { describe, it, expect, vi } from 'vitest';
import { createBillQueue } from './billUploadQueue';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
describe('bill upload queue', () => {
  it('limits uploads to three, flags duplicates and retries failures', async () => {
    let rows = [];
    const pending = [];
    const upload = vi.fn(() => new Promise((resolve, reject) => pending.push({ resolve, reject })));
    const queue = createBillQueue({
      upload,
      onChange: (next) => {
        rows = next;
      },
      hash: async (file) => file.name,
    });
    await queue.add(['a', 'b', 'c', 'd', 'a'].map((name) => new File([name], name)));
    expect(rows[4].status).toBe('duplicate');
    await tick();
    expect(upload).toHaveBeenCalledTimes(3);
    pending[0].reject(new Error('offline'));
    await tick();
    expect(upload).toHaveBeenCalledTimes(4);
    expect(rows[0].status).toBe('failed');
    queue.retry(rows[0].id);
    await tick();
    expect(upload).toHaveBeenCalledTimes(4);
    pending[1].resolve({ id: 'b' });
    await tick();
    expect(upload).toHaveBeenCalledTimes(5);
    pending[4].resolve({ id: 'a' });
    await tick();
    expect(rows[0].status).toBe('sent');
  });
});
