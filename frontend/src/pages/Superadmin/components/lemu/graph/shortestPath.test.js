import { describe, it, expect } from 'vitest';
import { shortestPath } from './shortestPath';

const link = (source, target) => ({ source, target });

describe('shortestPath', () => {
  it('returns the endpoints for a direct link', () => {
    expect(shortestPath([link('A', 'B')], 'A', 'B')).toEqual(['A', 'B']);
  });

  it('finds a transitive path', () => {
    expect(shortestPath([link('A', 'B'), link('B', 'C')], 'A', 'C')).toEqual(['A', 'B', 'C']);
  });

  it('prefers the shorter of two paths (BFS)', () => {
    const links = [link('A', 'B'), link('B', 'D'), link('A', 'C'), link('C', 'D')];
    expect(shortestPath(links, 'A', 'D')).toEqual(['A', 'B', 'D']);
  });

  it('is undirected: walks links against their direction', () => {
    expect(shortestPath([link('A', 'B')], 'B', 'A')).toEqual(['B', 'A']);
  });

  it('returns [fromId] when from === to, without needing the node to exist', () => {
    expect(shortestPath([], 'A', 'A')).toEqual(['A']);
  });

  it('returns [] when there is no connecting path', () => {
    expect(shortestPath([link('A', 'B'), link('C', 'D')], 'A', 'D')).toEqual([]);
  });

  it('returns [] when an endpoint is null or undefined', () => {
    expect(shortestPath([link('A', 'B')], null, 'B')).toEqual([]);
    expect(shortestPath([link('A', 'B')], 'A', undefined)).toEqual([]);
  });

  it('returns [] for null/undefined/missing links', () => {
    expect(shortestPath(null, 'A', 'B')).toEqual([]);
    expect(shortestPath(undefined, 'A', 'B')).toEqual([]);
    expect(shortestPath([], 'A', 'B')).toEqual([]);
  });

  it('resolves object endpoints (layout engine mutated links)', () => {
    const mutated = [{ source: { id: 'A' }, target: { id: 'B' } }];
    expect(shortestPath(mutated, 'A', 'B')).toEqual(['A', 'B']);
  });

  it('skips links with null endpoints', () => {
    expect(shortestPath([link('A', null), link('A', 'B')], 'A', 'B')).toEqual(['A', 'B']);
  });

  it('does not revisit nodes, so cycles terminate', () => {
    const cyc = [link('A', 'B'), link('B', 'A'), link('B', 'C')];
    expect(shortestPath(cyc, 'A', 'C')).toEqual(['A', 'B', 'C']);
  });
});
