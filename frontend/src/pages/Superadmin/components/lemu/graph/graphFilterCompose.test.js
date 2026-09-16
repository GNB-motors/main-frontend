import { describe, it, expect } from 'vitest';
import { composeVisible } from './graphFilterCompose';

const node = (id, extra = {}) => ({ id, ...extra });
const link = (s, t, kind = 'reads') => ({ source: s, target: t, kind });

const graph = {
  nodes: [node('a'), node('b'), node('c'), node('d')],
  links: [link('a', 'b'), link('b', 'c'), link('c', 'd')],
};

const base = {
  hiddenKinds: new Set(),
  offStates: new Set(),
  focusMatches: false,
  matches: null,
  selectedNodeId: null,
  hopDepth: 'all',
};

describe('composeVisible', () => {
  it('returns the graph untouched with no filters', () => {
    expect(composeVisible(graph, base)).toBe(graph);
  });

  it('drops hidden kinds first, cutting their links', () => {
    const g = {
      nodes: [node('a', { kind: 'module' }), node('b', { kind: 'route' })],
      links: [link('a', 'b')],
    };
    const out = composeVisible(g, { ...base, hiddenKinds: new Set(['route']) });
    expect(out.nodes.map((n) => n.id)).toEqual(['a']);
    expect(out.links).toEqual([]);
  });

  it('drops off states, keeping only links whose endpoints survive', () => {
    const g = {
      nodes: [
        node('a', { state: 'measured' }),
        node('b', { state: 'declared' }),
        node('c', { state: 'measured' }),
      ],
      links: [link('a', 'b'), link('a', 'c')],
    };
    const out = composeVisible(g, { ...base, offStates: new Set(['declared']) });
    expect(out.nodes.map((n) => n.id)).toEqual(['a', 'c']);
    expect(out.links.map((l) => l.source)).toEqual(['a']);
  });

  it('focusMatches restricts to the matches set', () => {
    const out = composeVisible(graph, {
      ...base,
      focusMatches: true,
      matches: new Set(['a', 'b']),
    });
    expect(out.nodes.map((n) => n.id)).toEqual(['a', 'b']);
    expect(out.links.map((l) => l.target)).toEqual(['b']);
  });

  it('applies the hop collapse last, around the selection', () => {
    const out = composeVisible(graph, { ...base, selectedNodeId: 'b', hopDepth: 1 });
    expect(out.nodes.map((n) => n.id).sort()).toEqual(['a', 'b', 'c']);
    expect(out.links.length).toBe(2);
  });

  it('hop collapse composes after kind filtering', () => {
    const g = {
      nodes: [
        node('a', { kind: 'module' }),
        node('b', { kind: 'module' }),
        node('c', { kind: 'route' }),
      ],
      links: [link('a', 'c'), link('c', 'b')],
    };
    const out = composeVisible(g, {
      ...base,
      hiddenKinds: new Set(['route']),
      selectedNodeId: 'a',
      hopDepth: 1,
    });
    expect(out.nodes.map((n) => n.id)).toEqual(['a']);
  });

  it('hopDepth all with a selection does not collapse', () => {
    const out = composeVisible(graph, { ...base, selectedNodeId: 'b', hopDepth: 'all' });
    expect(out.nodes.length).toBe(4);
  });

  it('does not mutate the input graph', () => {
    const before = JSON.stringify(graph);
    composeVisible(graph, { ...base, selectedNodeId: 'a', hopDepth: 1 });
    expect(JSON.stringify(graph)).toBe(before);
  });
});
