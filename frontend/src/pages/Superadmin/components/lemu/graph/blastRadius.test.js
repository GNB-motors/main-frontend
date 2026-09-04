import { describe, it, expect } from 'vitest';
import { downstreamOf, upstreamOf } from './blastRadius';

const link = (source, target) => ({ source, target });

describe('blastRadius', () => {
  const chain = [link('A', 'B'), link('B', 'C')];

  describe('downstreamOf (things that depend on root)', () => {
    it('walks the full transitive chain', () => {
      expect(downstreamOf(chain, 'A')).toEqual(new Set(['B', 'C']));
    });

    it('returns empty set when nothing depends on root', () => {
      expect(downstreamOf(chain, 'C')).toEqual(new Set());
    });

    it('collects a diamond without duplicates', () => {
      const diamond = [link('A', 'B'), link('A', 'C'), link('B', 'D'), link('C', 'D')];
      expect(downstreamOf(diamond, 'A')).toEqual(new Set(['B', 'C', 'D']));
    });
  });

  describe('upstreamOf (things root depends on)', () => {
    it('walks the chain in reverse', () => {
      expect(upstreamOf(chain, 'C')).toEqual(new Set(['B', 'A']));
    });

    it('returns empty set when root depends on nothing', () => {
      expect(upstreamOf(chain, 'A')).toEqual(new Set());
    });
  });

  describe('cycles (code-layer require graphs can have them)', () => {
    it('terminates on a two-node cycle and excludes the root itself', () => {
      const cyc = [link('A', 'B'), link('B', 'A')];
      expect(downstreamOf(cyc, 'A')).toEqual(new Set(['B']));
      expect(upstreamOf(cyc, 'A')).toEqual(new Set(['B']));
    });

    it('handles a self-loop without including the root', () => {
      expect(downstreamOf([link('A', 'A')], 'A')).toEqual(new Set());
    });
  });

  describe('input shapes', () => {
    it('returns an empty set for a null/undefined rootId', () => {
      expect(downstreamOf(chain, null)).toEqual(new Set());
      expect(downstreamOf(chain, undefined)).toEqual(new Set());
      expect(upstreamOf(chain, null)).toEqual(new Set());
    });

    it('returns an empty set for null/undefined/missing links', () => {
      expect(downstreamOf(null, 'A')).toEqual(new Set());
      expect(downstreamOf(undefined, 'A')).toEqual(new Set());
      expect(downstreamOf([], 'A')).toEqual(new Set());
    });

    it('resolves object endpoints (force-graph mutates links in place)', () => {
      const mutated = [{ source: { id: 'A' }, target: { id: 'B' } }];
      expect(downstreamOf(mutated, 'A')).toEqual(new Set(['B']));
      expect(upstreamOf(mutated, 'B')).toEqual(new Set(['A']));
    });

    it('skips links with null endpoints', () => {
      expect(downstreamOf([link('A', null), link(null, 'B'), link('A', 'B')], 'A')).toEqual(new Set(['B']));
    });
  });
});
