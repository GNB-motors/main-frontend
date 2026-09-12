import { describe, expect, it } from 'vitest';
import {
  GRAPH_STATES,
  nf,
  countByState,
  countByKind,
  countQueryMatches,
} from './graphPanelCounts';

const nodes = [
  { id: 'host:a', kind: 'host', state: 'measured' },
  { id: 'table:t1', kind: 'table', state: 'declared' },
  { id: 'table:t2', kind: 'table', state: 'unreachable' },
  { id: 'module:m1', kind: 'module' }, // no state (CODE layer shape)
  { id: 'module:m2', kind: 'module', state: 'measured' },
];

describe('nf', () => {
  it('groups thousands en-US and maps nullish to an em dash', () => {
    expect(nf(0)).toBe('0');
    expect(nf(324)).toBe('324');
    expect(nf(1700)).toBe('1,700');
    expect(nf(null)).toBe('—');
    expect(nf(undefined)).toBe('—');
  });
});

describe('countByState', () => {
  it('counts only nodes that carry a real state', () => {
    expect(countByState(nodes)).toEqual({ measured: 2, declared: 1, unreachable: 1 });
  });

  it('returns zeroed buckets for an empty or missing graph', () => {
    expect(countByState([])).toEqual({ measured: 0, declared: 0, unreachable: 0 });
    expect(countByState(undefined)).toEqual({ measured: 0, declared: 0, unreachable: 0 });
  });

  it('never invents a state for stateless nodes', () => {
    const c = countByState([{ id: 'module:m1', kind: 'module' }]);
    expect(c.measured + c.declared + c.unreachable).toBe(0);
    expect(GRAPH_STATES).toEqual(['measured', 'declared', 'unreachable']);
  });
});

describe('countByKind', () => {
  it('counts the whole graph per kind', () => {
    expect(countByKind(nodes)).toEqual({ host: 1, table: 2, module: 2 });
  });

  it('returns an empty map for no nodes', () => {
    expect(countByKind(null)).toEqual({});
  });
});

describe('countQueryMatches', () => {
  it('matches case-insensitively on id substring', () => {
    expect(countQueryMatches(nodes, 'TABLE')).toBe(2);
    expect(countQueryMatches(nodes, 'host:')).toBe(1);
  });

  it('is zero for an empty or whitespace query', () => {
    expect(countQueryMatches(nodes, '')).toBe(0);
    expect(countQueryMatches(nodes, '   ')).toBe(0);
    expect(countQueryMatches(nodes, null)).toBe(0);
  });
});
