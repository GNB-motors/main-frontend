import { describe, it, expect, vi } from 'vitest';
import { createBillQueue } from './billUploadQueue';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
describe('bill upload queue', () => {
  it('sends nothing until started, then one photo at a time, flags duplicates and retries failures', async () => {
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
    await queue.add(['a', 'b', 'c', 'a'].map((name) => new File([name], name)));
    await tick();
    expect(rows.map((row) => row.status)).toEqual(['ready', 'ready', 'ready', 'duplicate']);
    expect(upload).not.toHaveBeenCalled();

    queue.start();
    await tick();
    expect(upload).toHaveBeenCalledTimes(1);
    expect(rows.map((row) => row.status)).toEqual(['sending', 'queued', 'queued', 'duplicate']);
    expect(rows.slice(0, 3).map((row) => row.run)).toEqual([1, 1, 1]);
    expect(rows[3].run).toBeUndefined();

    pending[0].reject(new Error('offline'));
    await tick();
    expect(rows[0].status).toBe('failed');
    expect(upload).toHaveBeenCalledTimes(2);
    queue.retry(rows[0].id);
    await tick();
    expect(upload).toHaveBeenCalledTimes(2);
    pending[1].resolve({ id: 'b' });
    await tick();
    expect(rows[1]).toMatchObject({ status: 'sent', capture: { id: 'b' } });
    expect(upload).toHaveBeenCalledTimes(3);
    pending[2].resolve({ id: 'c' });
    await tick();
    pending[3].resolve({ id: 'a' });
    await tick();
    expect(rows.map((row) => row.status)).toEqual(['sent', 'sent', 'sent', 'duplicate']);
  });

  it('removes a photo before it is sent and starts a new run after the last one ends', async () => {
    let rows = [];
    const upload = vi.fn(async ({ clientId }) => ({ id: clientId }));
    const queue = createBillQueue({
      upload,
      onChange: (next) => {
        rows = next;
      },
      hash: async (file) => file.name,
    });
    await queue.add([new File(['x'], 'x'), new File(['y'], 'y')]);
    queue.remove(rows[0].id);
    expect(rows.map((row) => row.name)).toEqual(['y']);
    queue.start();
    await tick();
    await tick();
    expect(rows[0]).toMatchObject({ status: 'sent', run: 1 });
    // A sent photo stays: it still has to be confirmed.
    queue.remove(rows[0].id);
    expect(rows).toHaveLength(1);
    await queue.add([new File(['z'], 'z')]);
    queue.start();
    await tick();
    await tick();
    expect(rows[1]).toMatchObject({ status: 'sent', run: 2 });
    expect(upload.mock.calls[0][0].body.has('kind')).toBe(false);
  });
});
