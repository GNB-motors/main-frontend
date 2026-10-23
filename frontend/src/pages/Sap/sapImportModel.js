/**
 * A sheet import is a list of proposals; the person decides which become route SAPs. Pure.
 *
 * A proposal is included by default when both of its ends name a known place and its route
 * has no SAP yet (or a different one). Places and the SAP value can be changed per row.
 */

/** The starting choice for one proposal. */
export function initialChoice(p) {
  const sapKm = (p.sapValues || [])[0] ?? null;
  const fromSiteId = p.from?.siteId || null;
  const toSiteId = p.to?.siteId || null;
  const sameAsExisting =
    p.existing && p.existing.sapKm === sapKm && (p.existing.basis || 'ONE_WAY') === 'ONE_WAY';
  return {
    include: Boolean(
      p.ready && fromSiteId && toSiteId && fromSiteId !== toSiteId && !sameAsExisting,
    ),
    fromSiteId,
    toSiteId,
    sapKm,
    basis: 'ONE_WAY',
  };
}

export const initialChoices = (proposals) =>
  Object.fromEntries((proposals || []).map((p) => [p.ref, initialChoice(p)]));

/** Whether a choice can be saved: two different places and a SAP km in range. */
export const choiceValid = (c) =>
  Boolean(
    c &&
    c.fromSiteId &&
    c.toSiteId &&
    c.fromSiteId !== c.toSiteId &&
    c.sapKm >= 1 &&
    c.sapKm <= 3000,
  );

/** The entries POST /sap/import/apply takes: included, valid choices only. */
export function entriesToApply(proposals, choices) {
  return (proposals || [])
    .filter((p) => choices[p.ref]?.include && choiceValid(choices[p.ref]))
    .map((p) => {
      const c = choices[p.ref];
      return {
        fromSiteId: c.fromSiteId,
        toSiteId: c.toSiteId,
        sapKm: Number(c.sapKm),
        basis: c.basis,
        importRef: p.ref,
      };
    });
}

/** Proposals for one view of the editor. */
export function proposalsIn(view, proposals, choices) {
  const list = proposals || [];
  if (view === 'ready') return list.filter((p) => p.ready);
  if (view === 'places') return list.filter((p) => !p.ready);
  if (view === 'selected') return list.filter((p) => choices[p.ref]?.include);
  return list;
}
