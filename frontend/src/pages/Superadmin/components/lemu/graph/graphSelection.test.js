import { describe, it, expect } from 'vitest';
import { analysisNeighbourSet, nextNavTarget } from './graphSelection';

const link = (s, t) => ({ source: s, target: t, kind: 'reads' });

describe('analysisNeighbourSet', () => {
  it('is null when there is no blast or path', () => {
    expect(analysisNeighbourSet(null, null, 'a')).toBeNull();
  });

  it('merges blast up/down as-is and path nodes minus the selection', () => {
    const blast = { down: new Set(['a', 'b']), up: new Set(['c']) };
    const path = ['c', 'a', 'd'];
    const s = analysisNeighbourSet(blast, path, 'a');
    expect([...s].sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('returns null when there is nothing to highlight', () => {
    expect(analysisNeighbourSet(null, ['a'], 'a')).toBeNull();
    expect(analysisNeighbourSet({ down: new Set(), up: new Set() }, null, 'a')).toBeNull();
  });
});

describe('nextNavTarget', () => {
  const links = [link('a', 'b'), link('b', 'c')];

  it('returns null with no selection (caller picks the first visible node)', () => {
    expect(nextNavTarget({ anchor: null, ids: [], index: -1 }, null, links, 1)).toBeNull();
  });

  it('starts a fresh cursor at the first/last neighbour of a new anchor', () => {
    const fwd = nextNavTarget({ anchor: null, ids: [], index: -1 }, 'b', links, 1);
    expect(fwd.id).toBe('a');
    expect(fwd.cursor.anchor).toBe('b');
    const back = nextNavTarget({ anchor: null, ids: [], index: -1 }, 'b', links, -1);
    expect(back.id).toBe('c');
  });

  it('wraps around the cached neighbour list', () => {
    const cursor = { anchor: 'b', ids: ['p', 'a', 'c'], index: 2 };
    expect(nextNavTarget(cursor, 'b', links, 1).id).toBe('p');
    expect(nextNavTarget({ ...cursor, index: 0 }, 'b', links, -1).id).toBe('c');
  });

  it('resets the cursor when the anchor changed', () => {
    const cursor = { anchor: 'a', ids: ['b'], index: 0 };
    const next = nextNavTarget(cursor, 'b', links, 1);
    expect(next.cursor.anchor).toBe('b');
    expect(next.id).toBe('a');
  });

  it('returns null for an isolated node', () => {
    expect(nextNavTarget({ anchor: null, ids: [], index: -1 }, 'x', links, 1)).toBeNull();
  });
});
