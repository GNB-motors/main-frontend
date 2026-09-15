import { describe, it, expect } from 'vitest';
import { placeLabels, LABEL_FONT, LABEL_MAX } from './kgLabels';
import { createCamera } from './kgProject';

/* Fixed-width measurer so clash geometry is exact: every label is 60px wide. */
const measure60 = () => ({ width: 60 });
const boxW = 60 + 6; // box width = w + 6

const node = (id, x, y, r = 8, overrides = {}) => ({
  id, name: id, kind: 'module', r, x, y, z: 0, ...overrides,
});

const base = (overrides = {}) => ({
  layer: 'code',
  visibleCount: 100,
  cam: createCamera(), // k = 1, no pan
  is3d: false,
  width: 1600,
  height: 900,
  measureText: measure60,
  ...overrides,
});

describe('placeLabels', () => {
  it('exposes the design font and the 30-char truncation limit', () => {
    expect(LABEL_FONT).toBe("500 10.5px 'IBM Plex Mono', monospace");
    expect(LABEL_MAX).toBe(30);
  });

  it('yields one label for two nodes 2px apart, not two', () => {
    const nodes = [node('a', 800, 400), node('b', 802, 400)];
    const labels = placeLabels(nodes, base({ visibleCount: 2 }));
    expect(labels).toHaveLength(1);
  });

  it('always keeps an important (selected) node\'s label even on clash', () => {
    const nodes = [node('a', 800, 400), node('b', 802, 400)];
    const labels = placeLabels(nodes, base({ visibleCount: 100, selId: 'b' }));
    const b = labels.find((l) => l.id === 'b');
    expect(b).toBeDefined();
    expect(b.alpha).toBe(1);
    // the non-important clashing node is still dropped…
    expect(labels.find((l) => l.id === 'a')).toBeUndefined();
    // …but when both are important, both survive the same clash
    const both = placeLabels(nodes, base({ visibleCount: 100, selId: 'b', neighbours: new Set(['a']) }));
    expect(both).toHaveLength(2);
  });

  it('treats neighbours and search matches as important (small nodes survive)', () => {
    const nodes = [node('alpha', 800, 400, 3), node('beta', 802, 400, 3)];
    // neither is important: both are below r 5.5 and beta's box clashes
    expect(placeLabels(nodes, base({ visibleCount: 100 }))).toHaveLength(0);
    const asNeighbour = placeLabels(nodes, base({ visibleCount: 100, neighbours: new Set(['beta']) }));
    expect(asNeighbour.map((l) => l.id)).toEqual(['beta']);
    expect(asNeighbour[0].alpha).toBe(1);
    const asMatch = placeLabels(nodes, base({ visibleCount: 100, query: 'bet' }));
    expect(asMatch.map((l) => l.id)).toEqual(['beta']);
  });

  it('skips unimportant small nodes at 100 nodes / k = 1.0 in the code layer', () => {
    const nodes = [];
    for (let i = 0; i < 100; i++) {
      // small nodes on a 10x10 grid, 60px apart — no two projected boxes overlap
      nodes.push(node('n' + i, 200 + (i % 10) * 60, 100 + Math.floor(i / 10) * 60, 3));
    }
    const labels = placeLabels(nodes, base());
    expect(labels).toHaveLength(0); // labelAll false, all r < 5.5, none important
  });

  it('keeps large unimportant nodes when labelAll is on and boxes do not clash', () => {
    const nodes = [node('big', 400, 300, 8), node('far', 900, 600, 8)];
    const labels = placeLabels(nodes, base({ visibleCount: 50 }));
    expect(labels).toHaveLength(2);
    expect(labels.every((l) => l.alpha === 0.68)).toBe(true); // no selection active
  });

  it('labels big infra nodes but still skips small unimportant ones', () => {
    const big = placeLabels([node('a', 300, 300, 8), node('b', 700, 300, 8)], base({ layer: 'infra' }));
    expect(big).toHaveLength(2);
    // labelAll does not rescue a node below the r 5.5 floor
    const small = placeLabels([node('a', 300, 300, 3), node('b', 700, 300, 3)], base({ layer: 'infra' }));
    expect(small).toHaveLength(0);
  });

  it('labels everything when zoomed past k > 1.6, even in the code layer', () => {
    const cam = { ...createCamera(), k: 2 };
    const nodes = [node('a', 100, 100, 8), node('b', 300, 100, 8)];
    expect(placeLabels(nodes, base({ cam }))).toHaveLength(2);
  });

  it('dims labels to 0.3 while a selection is active', () => {
    const nodes = [node('a', 300, 300, 8), node('b', 900, 600, 8)];
    const labels = placeLabels(nodes, base({ visibleCount: 50, selId: 'a' }));
    expect(labels.find((l) => l.id === 'a').alpha).toBe(1);
    expect(labels.find((l) => l.id === 'b').alpha).toBe(0.3);
  });

  it('culls nodes outside the viewport margin (±80 x, ±40 y)', () => {
    const nodes = [
      node('in', 800, 400, 8),
      node('right', 1600 + 79, 400, 8),
      node('gone', 1600 + 81, 400, 8),
      node('low', 800, 900 + 39, 8),
      node('below', 800, 900 + 41, 8),
    ];
    const labels = placeLabels(nodes, base({ visibleCount: 5 }));
    const ids = labels.map((l) => l.id);
    expect(ids).toContain('in');
    expect(ids).toContain('right');
    expect(ids).not.toContain('gone');
    expect(ids).toContain('low');
    expect(ids).not.toContain('below');
  });

  it('returns every box inside the viewport for well-placed nodes', () => {
    const nodes = [];
    for (let i = 0; i < 20; i++) nodes.push(node('n' + i, 200 + (i % 5) * 200, 100 + Math.floor(i / 5) * 120, 8));
    const labels = placeLabels(nodes, base({ visibleCount: 20 }));
    expect(labels.length).toBeGreaterThan(0);
    for (const l of labels) {
      const [x, y, w, h] = l.box;
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x + w).toBeLessThanOrEqual(1600);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y + h).toBeLessThanOrEqual(900);
    }
  });

  it('uses the design box geometry [x - w/2 - 3, y + r + 4, w + 6, 13]', () => {
    const labels = placeLabels([node('a', 500, 300, 10)], base({ visibleCount: 1 }));
    const [x, y, w, h] = labels[0].box;
    expect(x).toBeCloseTo(500 - 30 - 3);
    expect(y).toBeCloseTo(300 + 10 + 4);
    expect(w).toBe(boxW);
    expect(h).toBe(13);
    expect(labels[0].text[1]).toBeCloseTo(300 + 10 + 5.5);
  });

  it('truncates labels at 30 chars with …', () => {
    const long = 'x'.repeat(45);
    const labels = placeLabels([node('id1', 500, 300, 10, { name: long })], base({ visibleCount: 1 }));
    expect(labels[0].label).toBe('x'.repeat(29) + '…');
    expect(labels[0].label.length).toBe(30);
  });

  it('respects the painter order in 3D (depth-sorted candidates)', () => {
    const nodes = [node('near', 400, 300, 8, { z: -200 }), node('far', 400, 300, 8, { z: 500 })];
    const cam = { ...createCamera(), yaw: 0, pitch: 0, k: 1 };
    const labels = placeLabels(nodes, base({ cam, is3d: true, visibleCount: 50 }));
    // only the near node keeps a label: the far one shrinks (s < 1), its box
    // lands inside the near node's and it is not important
    expect(labels).toHaveLength(1);
    expect(labels[0].id).toBe('near');
  });
});
