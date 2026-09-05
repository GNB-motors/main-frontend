/**
 * Async schema validation that keeps zod (and the schemas) out of the entry
 * chunk. Services import this statically, but the zod-backed schema modules
 * are pulled in via dynamic import so they land in an async chunk instead of
 * the eagerly-loaded main bundle.
 *
 * The importer promise is cached per export name, so after the first call the
 * module is already loaded and validation is effectively synchronous-cost.
 *
 *   const list = await parseWith('branchListSchema', () => import('./branch.schema.js'), data);
 */
const moduleCache = new Map();

export async function parseWith(exportName, importer, data) {
    if (!moduleCache.has(exportName)) moduleCache.set(exportName, importer());
    const mod = await moduleCache.get(exportName);
    return mod[exportName].parse(data);
}

export default parseWith;
