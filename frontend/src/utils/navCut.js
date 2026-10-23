import { jobForPath, jobLabel } from './navJobs.js';

/**
 * navCut — apply the org's OWN measured usage to the sidebar.
 *
 * THE RULE
 * --------
 * A navigation entry leaves the menu only when this organization's own recorded
 * behaviour says it is dead, and the number that said so travels with it. Two
 * verdicts fold an entry into its job:
 *
 *   NEVER_OPENED     not opened once since usage recording started
 *   BELOW_ORG_FLOOR  opened, but less than this org's own median surface
 *
 * Four things this file will NOT do:
 *
 *  1. Cut without evidence. If the profile is missing, INSUFFICIENT, has no
 *     learned floor, or simply has no verdict for a path, that entry STAYS. A
 *     brand-new org gets the full menu and a menu that has not been measured
 *     never loses anything.
 *  2. Cut anything that is not a nav destination. `Profile` and `Settings` have
 *     no job, and the ERP workspaces are role-scoped rather than
 *     frequency-scoped.
 *  3. Delete. A folded entry is moved to its job's "more inside this job" list
 *     with the route intact. Every link keeps working; every page keeps its
 *     data. This is navigation, not removal.
 *  4. Use a constant. There is no "unused for N days" anywhere in here. The
 *     only boundary is `learned.engagementFloor`, which the server computed from
 *     this org's own distribution last night.
 */

export const FOLDED_DISPOSITIONS = Object.freeze(['NEVER_OPENED', 'BELOW_ORG_FLOOR']);

/** Verdict for one path, or null when the server has not judged it. */
export function verdictFor(profile, path) {
  if (!profile || !Array.isArray(profile.surfaces)) return null;
  return profile.surfaces.find((s) => s.surfaceKey === path) || null;
}

/**
 * Whether the cut may act at all. Everything the server needs to have measured
 * must be present, or the menu is shown whole.
 */
export function cutIsApplicable(profile) {
  if (!profile) return { ok: false, why: 'No usage profile yet — nothing is cut.' };
  if (profile.state !== 'LEARNED') {
    return {
      ok: false,
      why: 'Not enough of this organization\'s own history yet — nothing is cut.',
    };
  }
  const floor = profile.learned?.engagementFloor;
  if (floor == null) {
    return { ok: false, why: 'This organization\'s engagement floor is not learned yet — nothing is cut.' };
  }
  return { ok: true, why: null };
}

/**
 * Every dashboard path the menu offers. Sent to the server with the profile
 * request so a screen this org has NEVER opened still gets judged — without
 * the list, "never opened" is invisible, because an unopened screen leaves no
 * row behind.
 */
export function surfaceKeysFromNav(items) {
  const keys = new Set();
  for (const item of items || []) {
    if (item.type === 'link' && item.to) keys.add(item.to);
    if (item.type === 'group') {
      for (const child of item.children || []) if (child.to) keys.add(child.to);
      for (const route of item.matchRoutes || []) keys.add(route);
    }
  }
  return [...keys];
}

/**
 * Fold the menu.
 *
 * @param items  SIDE_NAV_ITEMS, already filtered by feature flags
 * @param profile  GET /api/usage/nav-profile
 * @returns {{ items, folded, foldedByJob, applied, why }}
 */
export function applyUsageCut(items, profile) {
  const verdict = cutIsApplicable(profile);
  if (!verdict.ok) {
    return { items: items || [], folded: [], foldedByJob: {}, applied: false, why: verdict.why };
  }

  const folded = [];
  const foldedByJob = {};
  const keep = (entry, job, parentLabel) => {
    if (!job) return true;
    const v = verdictFor(profile, entry.to);
    if (!v || !FOLDED_DISPOSITIONS.includes(v.disposition)) return true;
    const record = {
      label: entry.label,
      to: entry.to,
      job,
      jobLabel: jobLabel(job),
      parentLabel: parentLabel || null,
      disposition: v.disposition,
      reason: v.reason,
      evidence: v.evidence,
    };
    folded.push(record);
    if (!foldedByJob[job]) foldedByJob[job] = [];
    foldedByJob[job].push(record);
    return false;
  };

  const next = [];
  for (const item of items || []) {
    if (item.type === 'section') {
      next.push(item);
      continue;
    }
    if (item.type === 'link') {
      if (keep(item, item.job || jobForPath(item.to))) next.push(item);
      continue;
    }
    // type === 'group' — a group survives if it still has a child that did.
    const children = (item.children || []).filter((child) => keep(child, child.job || jobForPath(child.to), item.label));
    if (children.length) next.push({ ...item, children });
  }

  // A section heading with nothing under it disappears; the menu must not show
  // an empty heading because of a cut.
  const withSections = next.filter((item, i) => {
    if (item.type !== 'section') return true;
    const nextItem = next[i + 1];
    return !!nextItem && nextItem.type !== 'section';
  });

  return {
    items: withSections,
    folded,
    foldedByJob,
    applied: folded.length > 0,
    why: folded.length
      ? `${folded.length} entr${folded.length === 1 ? 'y' : 'ies'} folded into a job, each on this organization's own numbers.`
      : null,
  };
}