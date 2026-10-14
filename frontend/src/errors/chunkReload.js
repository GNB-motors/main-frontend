/**
 * Recovery for code chunks that fail to load.
 *
 * A lazy import fails when the file it points at is gone from the server: after
 * a deploy (the old hashed chunks are replaced) or, in dev, when a file was
 * renamed under a tab that stayed open. The code itself is fine — one reload
 * fetches the current module graph. The time stamp stops a chunk that is
 * missing even after a fresh load from reloading in a loop.
 */

const STAMP_KEY = 'chunkReloadAt';
const LOOP_GUARD_MS = 10_000;

// Chrome / Firefox / Safari wordings, plus Vite's CSS preload failure.
const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i;

export const isChunkLoadError = (error) => CHUNK_ERROR.test(String(error?.message ?? error ?? ''));

/** Reloads the page unless it already did so in the last few seconds. Returns whether it reloaded. */
export function reloadForFreshChunks({
  storage,
  reload = () => window.location.reload(),
  now = Date.now(),
} = {}) {
  try {
    const store = storage ?? window.sessionStorage;
    if (now - (Number(store.getItem(STAMP_KEY)) || 0) < LOOP_GUARD_MS) return false;
    store.setItem(STAMP_KEY, String(now));
  } catch {
    // Without storage there is no loop guard; leave the reload to the button.
    return false;
  }
  reload();
  return true;
}
