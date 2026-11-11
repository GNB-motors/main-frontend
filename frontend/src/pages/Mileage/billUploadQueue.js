import { buildBillFormData } from './billPhotoModel';

export async function fileHash(file) {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function createBillQueue({ upload, onChange, onUnavailable, hash = fileHash }) {
  let rows = [];
  let active = 0;
  let adding = Promise.resolve();
  // The bill type is optional. When it is not chosen, the server decides.
  let kind = '';
  const emit = () => onChange([...rows]);
  const patch = (id, changes) => {
    rows = rows.map((row) => (row.id === id ? { ...row, ...changes } : row));
    emit();
  };
  const pump = () => {
    while (active < 3) {
      const row = rows.find((item) => item.status === 'queued' && item.started);
      if (!row) break;
      active += 1;
      patch(row.id, { status: 'sending', error: null });
      Promise.resolve()
        .then(() =>
          upload({ body: buildBillFormData(row.file, row.id, row.truck, kind), clientId: row.id }),
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
          active -= 1;
          pump();
        });
    }
  };
  return {
    add(files) {
      adding = adding.then(async () => {
        for (const file of files) {
          const id = crypto.randomUUID();
          const row = { id, file, name: file.name, status: 'hashing', started: false, truck: '' };
          rows = [...rows, row];
          emit();
          try {
            const digest = await hash(file);
            const duplicate = rows.some((other) => other.id !== id && other.hash === digest);
            patch(id, {
              hash: digest,
              status: duplicate ? 'duplicate' : 'queued',
              started: !duplicate,
            });
            pump();
          } catch (error) {
            patch(id, { status: 'failed', error: error?.message || 'Could not check this file' });
          }
        }
      });
      return adding;
    },
    start() {
      rows = rows.map((row) => (row.status === 'queued' ? { ...row, started: true } : row));
      emit();
      pump();
    },
    retry(id) {
      patch(id, { status: 'queued', started: true });
      pump();
    },
    setTruck(id, truck) {
      if (rows.some((row) => row.id === id && !row.started)) patch(id, { truck });
    },
    setKind(next) {
      kind = next || '';
    },
    removeSaved(ids) {
      rows = rows.map((row) =>
        ids.includes(row.capture?.id) ? { ...row, status: 'confirmed' } : row,
      );
      emit();
    },
    remove(id) {
      rows = rows.filter(
        (row) => row.id !== id || row.status === 'sending' || row.status === 'sent',
      );
      emit();
    },
  };
}
