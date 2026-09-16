/* Read-once view-state initialisers for the graph tab. The tab reads the URL
   exactly once at mount (the write side is graphUrlSync.applyGraphParams) and
   this module owns the parsing rules: which param names are recognised, which
   values are legal, and what the defaults are. Pure so the rules are testable
   without React. */

export const initViewState = (searchParams) => {
  const v = searchParams.get('gview');
  const h = searchParams.get('hops');
  const m = searchParams.get('mode');
  return {
    view: v === 'graph' || v === 'table' ? v : 'graph',
    query: searchParams.get('q') || '',
    hopDepth: h === 'all' ? 'all' : ['1', '2', '3', '4'].includes(h) ? Number(h) : 2,
    mode: m === '2d' || m === '3d' ? m : '2d',
    layer: searchParams.get('layer') === 'infra' ? 'infra' : 'code',
  };
};
