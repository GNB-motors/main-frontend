import React, { useMemo } from 'react';

/* Deterministic sentence generator for a manifest version diff.
   No LLM; picks the largest non-zero change bucket, then fills a template. */
const VERB_BY_BUCKET = {
  'routes.added': 'grew',
  'routes.removed': 'shed surface',
  'routes.middlewareChanged': 'tightened',
  'models.added': 'grew',
  'models.removed': 'shed data surface',
  'models.indexChanged': 're-indexed',
  'jobs.added': 'grew schedule',
  'jobs.removed': 'shed jobs',
  'jobs.uninstrumented': 'gained unmonitored jobs',
  'functions.added': 'grew functions',
  'functions.removed': 'shed functions',
  'modules.added': 'grew modules',
  'modules.removed': 'shed modules',
};

const BUCKET_ORDER = [
  'routes.added', 'routes.removed', 'routes.middlewareChanged',
  'models.added', 'models.removed', 'models.indexChanged',
  'jobs.added', 'jobs.removed', 'jobs.uninstrumented',
  'functions.added', 'functions.removed',
  'modules.added', 'modules.removed',
];

const countBucket = (diff, key) => {
  const [group, field] = key.split('.');
  const arr = diff?.[group]?.[field];
  return Array.isArray(arr) ? arr.length : 0;
};

const LemuChangeSentence = ({ diff, isGenesis, meta }) => {
  const sentence = useMemo(() => {
    if (isGenesis || !diff) {
      const r = meta?.routes ?? 0;
      const m = meta?.models ?? 0;
      const j = meta?.jobs ?? 0;
      const f = meta?.functions ?? 0;
      const mod = meta?.modules ?? 0;
      const date = meta?.createdAt ? new Date(meta.createdAt).toLocaleDateString() : 'day one';
      return `v1 established ${date}: ${r} routes, ${m} models, ${j} jobs, ${f} functions across ${mod} modules. No comparison exists yet.`;
    }

    // Find the largest non-zero bucket in the deterministic order.
    let largestKey = null;
    let largestCount = 0;
    BUCKET_ORDER.forEach((key) => {
      const c = countBucket(diff, key);
      if (c > largestCount) {
        largestCount = c;
        largestKey = key;
      }
    });

    // Tenant guard changes are a standout item even if not the biggest bucket.
    const tenantAdded = (diff?.routes?.added || []).filter((r) => r.hasTenantGuard).length;
    const tenantRemoved = (diff?.routes?.removed || []).filter((r) => r.hasTenantGuard).length;
    const indexChanged = (diff?.models?.indexChanged || []).length;

    if (!largestKey) {
      if (tenantAdded) return `A quiet deploy: tenant guards were added to ${tenantAdded} route${tenantAdded === 1 ? '' : 's'}, but the overall shape did not change.`;
      if (indexChanged) return `A quiet deploy: ${indexChanged} model index${indexChanged === 1 ? '' : 'es'} changed, but the overall shape did not change.`;
      return 'No structural change — a redeploy of the same shape.';
    }

    const verb = VERB_BY_BUCKET[largestKey] || 'changed';
    let s = `${verb} by ${largestCount} ${largestKey.split('.')[0]}`;

    if (tenantAdded) s += `; tenant guard added to ${tenantAdded} route${tenantAdded === 1 ? '' : 's'}`;
    if (tenantRemoved) s += `; tenant guard removed from ${tenantRemoved} route${tenantRemoved === 1 ? '' : 's'}`;
    if (indexChanged) s += `; ${indexChanged} index${indexChanged === 1 ? '' : 'es'} changed`;

    return s.charAt(0).toUpperCase() + s.slice(1) + '.';
  }, [diff, isGenesis, meta]);

  return <p className="lemu-change-sentence">{sentence}</p>;
};

export default LemuChangeSentence;
