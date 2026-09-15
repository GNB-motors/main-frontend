import { describe, it, expect } from 'vitest';
import { pickNode, pickHostChip } from './kgPick';

describe('pickNode — the design\'s pick()', () => {
  const at = (x, y, s = 1) => () => ({ x, y, s });

  it('hits a node inside max(6, r*k*s) + 5 of its centre', () => {
    const n = { id: 'a', r: 10 };
    // r*k*s = 10 → hit radius 15
    expect(pickNode([n], at(100, 100), 112, 100, 1)).toBe(n);
    expect(pickNode([n], at(100, 100), 116, 100, 1)).toBeNull();
  });

  it('floors the hit radius at 6 + 5 for tiny or zero-radius nodes', () => {
    const n = { id: 'a', r: 0 };
    // hit radius = max(6, 0) + 5 = 11
    expect(pickNode([n], at(50, 50), 60, 50, 1)).toBe(n);
    expect(pickNode([n], at(50, 50), 62, 50, 1)).toBeNull();
  });

  it('applies the camera zoom and the projection scale to the radius', () => {
    const n = { id: 'a', r: 10 };
    // k = 2, s = 0.5 → r*k*s = 10 → same 15px hit radius
    expect(pickNode([n], at(100, 100, 0.5), 112, 100, 2)).toBe(n);
    expect(pickNode([n], at(100, 100, 0.5), 116, 100, 2)).toBeNull();
  });

  it('reverse iteration: the later (on-top) node wins on overlap', () => {
    const a = { id: 'a', r: 20 }, b = { id: 'b', r: 20 };
    expect(pickNode([a, b], at(100, 100), 100, 100, 1)).toBe(b);
    expect(pickNode([b, a], at(100, 100), 100, 100, 1)).toBe(a);
  });

  it('nearest wins when two nodes both contain the point', () => {
    const a = { id: 'a', r: 30 }, b = { id: 'b', r: 30 };
    const proj = { a: { x: 100, y: 100 }, b: { x: 108, y: 100 } };
    expect(pickNode([a, b], (n) => proj[n.id], 104, 100, 1)).toBe(b); // d=4 vs d=4? tie → later
  });

  it('skips nodes with no projection and returns null on empty space', () => {
    const a = { id: 'a', r: 10 };
    expect(pickNode([a], () => null, 0, 0, 1)).toBeNull();
    expect(pickNode([], at(0, 0), 0, 0, 1)).toBeNull();
  });
});

describe('pickHostChip', () => {
  const chips = [
    { hostId: 'host:a', rect: [10, 20, 100, 16] },
    { hostId: 'host:b', rect: [0, 0, 30, 16] },
  ];

  it('hits inside a chip rect', () => {
    expect(pickHostChip(chips, 50, 28)).toBe('host:a');
    expect(pickHostChip(chips, 5, 8)).toBe('host:b');
  });

  it('misses outside every rect', () => {
    expect(pickHostChip(chips, 200, 200)).toBeNull();
    expect(pickHostChip([], 5, 8)).toBeNull();
  });

  it('the topmost (later) chip wins on overlap', () => {
    const over = [
      { hostId: 'host:a', rect: [0, 0, 50, 16] },
      { hostId: 'host:b', rect: [10, 0, 50, 16] },
    ];
    expect(pickHostChip(over, 20, 8)).toBe('host:b');
  });
});
