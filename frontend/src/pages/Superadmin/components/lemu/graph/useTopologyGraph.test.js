import { describe, it, expect } from 'vitest';
import { buildTopologyGraph } from './useTopologyGraph';

describe('buildTopologyGraph', () => {
  it('returns an empty graph for null/undefined topology', () => {
    expect(buildTopologyGraph(null)).toEqual({ nodes: [], links: [] });
    expect(buildTopologyGraph(undefined)).toEqual({ nodes: [], links: [] });
  });

  it('returns an empty graph when nodes is missing or not an array', () => {
    expect(buildTopologyGraph({})).toEqual({ nodes: [], links: [] });
    expect(buildTopologyGraph({ nodes: 'nope', edges: [] })).toEqual({ nodes: [], links: [] });
  });

  it('assigns val from the SIZE table by kind, defaulting to 3', () => {
    const { nodes } = buildTopologyGraph({
      nodes: [
        { id: 'host:h', kind: 'host' },
        { id: 'table:t', kind: 'table' },
        { id: 'weird:w', kind: 'something-else' },
      ],
    });
    expect(nodes.map((n) => n.val)).toEqual([8, 4, 3]);
  });

  it('carries node fields through untouched, including state', () => {
    const { nodes } = buildTopologyGraph({
      nodes: [{ id: 'table:t', kind: 'table', state: 'declared', ops: 0 }],
    });
    expect(nodes[0]).toEqual({ id: 'table:t', kind: 'table', state: 'declared', ops: 0, val: 4 });
  });

  it('maps edges to links with source/target/kind', () => {
    const { links } = buildTopologyGraph({
      nodes: [{ id: 'a', kind: 'job' }, { id: 'b', kind: 'table' }],
      edges: [{ from: 'a', to: 'b', kind: 'reads' }],
    });
    expect(links).toEqual([{ source: 'a', target: 'b', kind: 'reads' }]);
  });

  it('drops edges that reference absent nodes', () => {
    const { links } = buildTopologyGraph({
      nodes: [{ id: 'a', kind: 'job' }],
      edges: [
        { from: 'a', to: 'ghost', kind: 'reads' },
        { from: 'ghost', to: 'a', kind: 'reads' },
        { from: 'a', to: 'a', kind: 'reads' },
      ],
    });
    expect(links).toEqual([{ source: 'a', target: 'a', kind: 'reads' }]);
  });

  it('drops null/undefined edges without throwing', () => {
    const { links } = buildTopologyGraph({
      nodes: [{ id: 'a', kind: 'job' }],
      edges: [null, undefined],
    });
    expect(links).toEqual([]);
  });

  it('treats a missing edges array as no links', () => {
    const { nodes, links } = buildTopologyGraph({ nodes: [{ id: 'a', kind: 'job' }] });
    expect(nodes).toHaveLength(1);
    expect(links).toEqual([]);
  });

  it('does not mutate the input topology', () => {
    const topology = {
      nodes: [{ id: 'a', kind: 'job' }],
      edges: [{ from: 'a', to: 'a', kind: 'reads' }],
    };
    buildTopologyGraph(topology);
    expect(topology.nodes[0]).toEqual({ id: 'a', kind: 'job' });
    expect(topology.edges[0]).toEqual({ from: 'a', to: 'a', kind: 'reads' });
  });
});
