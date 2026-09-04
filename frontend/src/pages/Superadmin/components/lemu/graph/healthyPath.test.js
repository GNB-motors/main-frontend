import { describe, it, expect } from 'vitest';
import { healthyPathSet } from './healthyPath';

const node = (id, kind, state = 'measured') => ({ id, kind, state });

describe('healthyPathSet', () => {
  it('returns an empty set for empty inputs', () => {
    expect(healthyPathSet([], [])).toEqual(new Set());
  });

  it('lights nodes forward-reachable from a source over reads edges', () => {
    const nodes = [node('source:s', 'source'), node('job:j', 'job')];
    const links = [{ source: 'source:s', target: 'job:j', kind: 'reads' }];
    expect(healthyPathSet(nodes, links)).toEqual(new Set(['source:s', 'job:j']));
  });

  it('lights nodes backward-reachable from a table over mirrors edges', () => {
    const nodes = [node('table:t', 'table'), node('pipe:p', 'pipe'), node('collection:c', 'collection')];
    const links = [
      { source: 'collection:c', target: 'pipe:p', kind: 'mirrors' },
      { source: 'pipe:p', target: 'table:t', kind: 'mirrors' },
    ];
    expect(healthyPathSet(nodes, links)).toEqual(new Set(['collection:c', 'pipe:p', 'table:t']));
  });

  it('is a UNION of the source-forward and table-backward walks (segments need not connect)', () => {
    const nodes = [node('source:s', 'source'), node('job:j', 'job'), node('table:t', 'table'), node('pipe:p', 'pipe')];
    const links = [
      { source: 'source:s', target: 'job:j', kind: 'reads' },
      { source: 'pipe:p', target: 'table:t', kind: 'mirrors' },
    ];
    expect(healthyPathSet(nodes, links)).toEqual(new Set(['source:s', 'job:j', 'pipe:p', 'table:t']));
  });

  it('never lights declared (unmeasured) nodes, including the seed itself', () => {
    const nodes = [
      node('source:s', 'source', 'declared'),
      node('job:j', 'job', 'declared'),
      node('table:t', 'table', 'measured'),
    ];
    const links = [
      { source: 'source:s', target: 'job:j', kind: 'reads' },
      { source: 'job:j', target: 'table:t', kind: 'mirrors' },
    ];
    expect(healthyPathSet(nodes, links)).toEqual(new Set(['table:t']));
  });

  it('ignores placement edges (hosts/contains/serves) but still lights measured seeds themselves', () => {
    const nodes = [node('source:s', 'source'), node('host:h', 'host'), node('table:t', 'table'), node('store:x', 'store')];
    const links = [
      { source: 'host:h', target: 'source:s', kind: 'hosts' },
      { source: 'store:x', target: 'table:t', kind: 'serves' },
    ];
    // host and store are never walked over, and the seeds have no flow edges —
    // but a measured seed is added to `reached` at walk start, so it lights
    // itself even with zero flow edges.
    expect(healthyPathSet(nodes, links)).toEqual(new Set(['source:s', 'table:t']));
  });

  it('drops reached ids that are not nodes in the graph', () => {
    const nodes = [node('source:s', 'source')];
    const links = [{ source: 'source:s', target: 'ghost:g', kind: 'reads' }];
    expect(healthyPathSet(nodes, links)).toEqual(new Set(['source:s']));
  });

  it('terminates on cycles in the flow edges', () => {
    const nodes = [node('source:s', 'source'), node('table:t', 'table'), node('collection:a', 'collection'), node('collection:b', 'collection')];
    const links = [
      { source: 'collection:a', target: 'collection:b', kind: 'mirrors' },
      { source: 'collection:b', target: 'collection:a', kind: 'mirrors' },
      { source: 'collection:b', target: 'table:t', kind: 'mirrors' },
      { source: 'source:s', target: 'collection:a', kind: 'reads' },
    ];
    expect(healthyPathSet(nodes, links)).toEqual(new Set(['source:s', 'collection:a', 'collection:b', 'table:t']));
  });

  it('resolves object link endpoints (force-graph mutated links)', () => {
    const nodes = [node('source:s', 'source'), node('job:j', 'job')];
    const links = [{ source: { id: 'source:s' }, target: { id: 'job:j' }, kind: 'reads' }];
    expect(healthyPathSet(nodes, links)).toEqual(new Set(['source:s', 'job:j']));
  });

  it('does not light nodes when no source or table seeds exist', () => {
    const nodes = [node('job:j', 'job'), node('pipe:p', 'pipe')];
    const links = [{ source: 'job:j', target: 'pipe:p', kind: 'reads' }];
    expect(healthyPathSet(nodes, links)).toEqual(new Set());
  });
});
