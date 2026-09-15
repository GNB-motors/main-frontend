import { describe, it, expect } from 'vitest';
import { traceUpstream, upstreamNote } from './upstreamTrace';

const link = (source, target) => ({ source, target });

describe('traceUpstream', () => {
  it('reports each diamond node once at its shortest depth', () => {
    // D depends on B and C; both depend on A.
    const diamond = [link('A', 'B'), link('A', 'C'), link('B', 'D'), link('C', 'D')];
    expect(traceUpstream('D', diamond)).toEqual(new Map([['D', 0], ['B', 1], ['C', 1], ['A', 2]]));
  });

  it('terminates on a cycle without looping', () => {
    const cyc = [link('A', 'B'), link('B', 'A')];
    expect(traceUpstream('A', cyc)).toEqual(new Map([['A', 0], ['B', 1]]));
  });

  it('handles a self-loop without including the root as its own ancestor', () => {
    expect(traceUpstream('A', [link('A', 'A')])).toEqual(new Map([['A', 0]]));
  });

  it('truncates at cap', () => {
    const chain = [link('A', 'B'), link('B', 'C'), link('C', 'D')];
    expect(traceUpstream('D', chain, 2)).toEqual(new Map([['D', 0], ['C', 1], ['B', 2]]));
    expect(traceUpstream('D', chain, 2).has('A')).toBe(false);
  });

  describe('input shapes', () => {
    it('returns an empty map for a null/undefined root', () => {
      expect(traceUpstream(null, [link('A', 'B')])).toEqual(new Map());
      expect(traceUpstream(undefined, [link('A', 'B')])).toEqual(new Map());
    });

    it('returns just the root for null/undefined/missing links', () => {
      expect(traceUpstream('A', null)).toEqual(new Map([['A', 0]]));
      expect(traceUpstream('A', undefined)).toEqual(new Map([['A', 0]]));
      expect(traceUpstream('A', [])).toEqual(new Map([['A', 0]]));
    });

    it('resolves object endpoints (layout engine mutates links in place)', () => {
      const mutated = [{ source: { id: 'A' }, target: { id: 'B' } }];
      expect(traceUpstream('B', mutated)).toEqual(new Map([['B', 0], ['A', 1]]));
    });

    it('skips links with null endpoints', () => {
      expect(traceUpstream('B', [link('A', null), link(null, 'B'), link('A', 'B')])).toEqual(
        new Map([['B', 0], ['A', 1]])
      );
    });
  });
});

describe('upstreamNote', () => {
  it('reports zero ancestors and the root message for a parentless node', () => {
    expect(upstreamNote('A', [link('A', 'B')])).toBe('0 ancestors · 0 hops deep · no origin node reached — this is a root');
  });

  it('summarizes a diamond trace with its origin', () => {
    const diamond = [link('A', 'B'), link('A', 'C'), link('B', 'D'), link('C', 'D')];
    expect(upstreamNote('D', diamond)).toBe('3 ancestors · 2 hops deep · origins: A');
  });

  it('uses singular "hop" at depth one', () => {
    expect(upstreamNote('B', [link('A', 'B')])).toBe('1 ancestors · 1 hop deep · origins: A');
  });

  it('lists up to three origins then counts the rest', () => {
    const links = [link('O1', 'X'), link('O2', 'X'), link('O3', 'X'), link('O4', 'X'), link('O5', 'X')];
    expect(upstreamNote('X', links)).toBe('5 ancestors · 1 hop deep · origins: O1, O2, O3 +2 more');
  });

  it('names origins through nameOf when a node table is available', () => {
    const byId = { A: { name: 'alpha' } };
    expect(upstreamNote('B', [link('A', 'B')], Infinity, (id) => byId[id].name)).toBe(
      '1 ancestors · 1 hop deep · origins: alpha'
    );
  });

  it('falls back to the root message when the cap cuts the walk before any origin', () => {
    const chain = [link('A', 'B'), link('B', 'C')];
    expect(upstreamNote('C', chain, 1)).toBe('1 ancestors · 1 hop deep · no origin node reached — this is a root');
  });
});

describe('topoTraceLinks', () => {
  it('adapts topology {from,to} edges to the {source,target} graph shape', async () => {
    const { topoTraceLinks } = await import('./upstreamTrace');
    const topoEdges = [{ from: 'host:h', to: 'table:t', kind: 'hosts' }];
    expect(topoTraceLinks(topoEdges)).toEqual([{ source: 'host:h', target: 'table:t' }]);
    expect(upstreamNote('table:t', topoTraceLinks(topoEdges))).toBe(
      '1 ancestors · 1 hop deep · origins: host:h'
    );
  });

  it('tolerates null/undefined payloads', async () => {
    const { topoTraceLinks } = await import('./upstreamTrace');
    expect(topoTraceLinks(null)).toEqual([]);
    expect(topoTraceLinks(undefined)).toEqual([]);
  });
});
