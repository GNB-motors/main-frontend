import { buildBillFormData } from './billPhotoModel';

export async function fileHash(file) {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * The bill photos of one page, from the moment they are picked until the
 * server has them.
 *
 * A picked photo waits as `ready` until the owner presses Upload (`start`);
 * nothing is sent before that. The photos are then sent one at a time, the
 * same way a chat import reads its photos, and each one carries the `run` it
 * was started in so the dialog can say "2 of 5".
 */
export function createBillQueue({ upload, onChange, onUnavailable, hash = fileHash }) {
  let rows = [];
  let sending = false;
  let run = 0;
  let adding = Promise.resolve();
  const emit = () => onChange([...rows]);
  const patch = (id, changes) => {
    rows = rows.map((row) => (row.id === id ? { ...row, ...changes } : row));
    emit();
  };
  const pump = () => {
    if (sending) return;
    const row = rows.find((item) => item.status === 'queued');
    if (!row) return;
    sending = true;
    patch(row.id, { status: 'sending', error: null });
    Promise.resolve()
      .then(() =>
        upload({ body: buildBillFormData(row.file, row.id, row.truck), clientId: row.id }),
      )
      .then((capture) => {
        if (!capture?.id && !capture?._id)
          throw new Error('The server did not return a capture ID.');
        patch(row.id, { status: 'sent', capture: { ...capture, id: capture.id || capture._id } });
      })
      .catch((error) => {
        if ((error?.status ?? error?.response?.status) === 404) onUnavailable?.();
        patch(row.id, { status: 'failed', error: error?.message || 'Upload failed' });
      })
      .finally(() => {
        sending = false;
        pump();
      });
  };
  return {
    add(files) {
      adding = adding.then(async () => {
        for (const file of files) {
          const id = crypto.randomUUID();
          const row = { id, file, name: file.name, status: 'hashing', truck: '' };
          rows = [...rows, row];
          emit();
          try {
            const digest = await hash(file);
            const duplicate = rows.some((other) => other.id !== id && other.hash === digest);
            patch(id, { hash: digest, status: duplicate ? 'duplicate' : 'ready' });
          } catch (error) {
            patch(id, { status: 'failed', error: error?.message || 'Could not check this file' });
          }
        }
      });
      return adding;
    },
    start() {
      // Photos started while others are still going join the same run.
      if (!rows.some((row) => row.status === 'queued' || row.status === 'sending')) run += 1;
      rows = rows.map((row) => (row.status === 'ready' ? { ...row, status: 'queued', run } : row));
      emit();
      pump();
    },
    retry(id) {
      patch(id, { status: 'queued' });
      pump();
    },
    setTruck(id, truck) {
      if (rows.some((row) => row.id === id && row.status === 'ready')) patch(id, { truck });
    },
    removeSaved(ids) {
      rows = rows.map((row) =>
        ids.includes(row.capture?.id) ? { ...row, status: 'confirmed' } : row,
      );
      emit();
    },
    remove(id) {
      rows = rows.filter(
        (row) => row.id !== id || ['sending', 'sent', 'confirmed'].includes(row.status),
      );
      emit();
    },
  };
}
