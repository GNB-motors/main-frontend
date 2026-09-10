/**
 * Async schema validation that keeps zod (and the schemas) out of the entry
 * chunk. Services import this statically, but the zod-backed schema modules
 * are pulled in via dynamic import so they land in an async chunk instead of
 * the eagerly-loaded main bundle.
 *
 * The importer promise is cached per export name, so after the first call the
 * module is already loaded and validation is effectively synchronous-cost.
 *
 * ── WHICH ONE TO CALL ─────────────────────────────────────────────────────
 * `parseSafe` is the one services want, and the default for any response that
 * a page is about to render. Response schemas are hand-maintained and always
 * lag the API a little; when they drift, a strict parse THROWS, the throw
 * travels the same path as a failed request, and the page tells the user the
 * network is down over data that arrived perfectly intact. parseSafe logs the
 * drift (and reports it to Sentry so it gets fixed) and hands back the raw
 * response, so a schema bug degrades to "unvalidated" instead of "outage".
 *
 * `parseWith` is the strict primitive — it throws. Use it only where a bad
 * shape genuinely must abort the operation, and in the schema unit tests.
 *
 *   const list = await parseSafe('branchListSchema', () => import('./branch.schema.js'), data);
 */
import { captureException } from '../utils/sentry.js';

const moduleCache = new Map();
/** One Sentry report per schema per session — drift is constant, not per-row. */
const reported = new Set();

export async function parseWith(exportName, importer, data) {
  if (!moduleCache.has(exportName)) moduleCache.set(exportName, importer());
  const mod = await moduleCache.get(exportName);
  return mod[exportName].parse(data);
}

/**
 * Validate, but never fail the request over it. Returns the parsed value on
 * success and the original `data` unchanged when validation (or even loading
 * the schema module) fails.
 */
export async function parseSafe(exportName, importer, data) {
  try {
    return await parseWith(exportName, importer, data);
  } catch (error) {
    if (!reported.has(exportName)) {
      reported.add(exportName);
      console.warn(
        `[schema] ${exportName} did not match the API response — passing it through unvalidated.`,
        error?.issues ?? error,
      );
      captureException(error, { tags: { 'schema.drift': exportName } });
    }
    return data;
  }
}

export default parseWith;
