import {
  KINDS, KINDS_LIGHT, DARK, LIGHT, CANVAS,
  kindHue, KIND_HUE, KIND_LABEL, LINK_LABEL,
  RING_RECIPES, OUTLINE_COLOR, hexa, nodeAppearance,
  themeTokens, canvasTokens,
  isGhostNode, THEME_STORAGE_KEY,
  readStoredTheme, writeStoredTheme, applyThemeVars, clearThemeVars,
} from './graphTheme';

describe('kindHue — hue = kind (P3)', () => {
  it('every kind in KIND_LABEL has a hue in both themes', () => {
    for (const kind of Object.keys(KIND_LABEL)) {
      expect(kindHue(kind, 'dark'), `dark:${kind}`).toBeTruthy();
      expect(kindHue(kind, 'light'), `light:${kind}`).toBeTruthy();
    }
  });

  it('no two kinds share a hue within a theme', () => {
    const darkHues = Object.keys(KIND_LABEL).map((k) => kindHue(k, 'dark'));
    const lightHues = Object.keys(KIND_LABEL).map((k) => kindHue(k, 'light'));
    expect(new Set(darkHues).size).toBe(darkHues.length);
    expect(new Set(lightHues).size).toBe(lightHues.length);
  });

  it('dark hues come from the design KINDS table; light from KINDS_LIGHT', () => {
    expect(kindHue('store', 'dark')).toBe(KINDS.store.c);
    expect(kindHue('store', 'light')).toBe(KINDS_LIGHT.store);
    expect(kindHue('nope', 'dark')).toBeUndefined();
  });

  it('route takes the mount hue family at reduced saturation, distinct from mount (§0 C7)', () => {
    expect(kindHue('route', 'dark')).not.toBe(kindHue('mount', 'dark'));
    expect(kindHue('route', 'light')).not.toBe(kindHue('mount', 'light'));
    expect(kindHue('route', 'dark')).toBeTruthy();
  });

  it('KIND_HUE compat object carries the design dark hues (not the old hand-picked map)', () => {
    expect(KIND_HUE.store).toBe(KINDS.store.c);
    expect(KIND_HUE.route).toBe(KINDS.route.c);
  });
});

describe('theme tokens', () => {
  it('themeTokens resolves the right palette per theme', () => {
    expect(themeTokens('dark')).toBe(DARK);
    expect(themeTokens('light')).toBe(LIGHT);
    expect(themeTokens(undefined)).toBe(DARK);
  });

  it('canvasTokens: glow is dark-only', () => {
    expect(canvasTokens('dark').glow).toBe(true);
    expect(canvasTokens('light').glow).toBe(false);
  });

  it('CANVAS carries both themes with the draw-pass keys', () => {
    for (const t of ['dark', 'light']) {
      for (const key of ['g0', 'g1', 'g2', 'void', 'voidFault', 'selRing', 'halo', 'nbRing', 'hoverRing', 'spec', 'pipRim', 'innerRim', 'faultCss', 'glow']) {
        expect(CANVAS[t][key], `${t}.${key}`).toBeDefined();
      }
    }
  });
});

describe('hexa', () => {
  it('converts #rrggbb + alpha to rgba()', () => {
    expect(hexa('#FB923C', 0.5)).toBe('rgba(251,146,60,0.5)');
    expect(hexa('#000000', 1)).toBe('rgba(0,0,0,1)');
  });

  it('passes non-hex strings through unchanged', () => {
    expect(hexa('rgba(1,2,3,.4)', 0.5)).toBe('rgba(1,2,3,.4)');
    expect(hexa(undefined, 0.5)).toBeUndefined();
  });
});

describe('nodeAppearance — P3 channel separation', () => {
  it('a declared node returns ring hollow and minRadius 4.6', () => {
    const a = nodeAppearance({ id: 'a', kind: 'store', state: 'declared' }, {});
    expect(a.ring).toBe('hollow');
    expect(a.minRadius).toBe(4.6);
    expect(RING_RECIPES[a.ring]).toBeTruthy();
  });

  it('a measured node keeps the small-node floor of 2.2', () => {
    expect(nodeAppearance({ id: 'a', kind: 'store', state: 'measured' }, {}).minRadius).toBe(2.2);
  });

  it('a search miss dims to 0.11 and does NOT change colour', () => {
    const hit = nodeAppearance({ id: 'a', kind: 'store', state: 'measured' }, {});
    const miss = nodeAppearance({ id: 'b', kind: 'store', state: 'measured' }, { matches: new Set(['a']) });
    expect(miss.opacity).toBe(0.11);
    expect(miss.color).toBe(hit.color);
  });

  it('a node both selected and error-bearing gets outline selected AND pip errors', () => {
    const a = nodeAppearance({ id: 'a', kind: 'store', state: 'measured', errorCount: 3 }, { selectedNodeId: 'a' });
    expect(a.outline).toBe('selected');
    expect(a.pip).toBe('errors');
  });

  it('outline stays on one channel: the manifest diff suppresses selection', () => {
    const overlay = new Map([['a', 'changed']]);
    const a = nodeAppearance({ id: 'a', kind: 'store', state: 'measured' }, { selectedNodeId: 'a', overlay });
    expect(a.outline).toBe('changed');
    expect(OUTLINE_COLOR.changed).toBeTruthy();
  });

  it('a neighbour gets outline neighbour, not selected', () => {
    const a = nodeAppearance({ id: 'b', kind: 'store', state: 'measured' }, { selectedNodeId: 'a', neighbours: new Set(['b']) });
    expect(a.outline).toBe('neighbour');
  });

  it('a diff ghost (state removed) gets the ghost ring — hollow, not fault', () => {
    const a = nodeAppearance({ id: 'a', kind: 'module', state: 'removed', ghost: true }, {});
    expect(a.ring).toBe('ghost');
    expect(a.ring).not.toBe('fault');
    expect(RING_RECIPES.ghost.fill).toBe('void');
    expect(RING_RECIPES.ghost.dim).toBeGreaterThan(0);
    expect(RING_RECIPES.ghost.dim).toBeLessThan(1);
    // non-measured: keeps the 4.6 legibility floor
    expect(a.minRadius).toBe(4.6);
  });

  it('the ghost flag alone (no state) is still a ghost', () => {
    expect(isGhostNode({ id: 'a', kind: 'module', ghost: true })).toBe(true);
    expect(isGhostNode({ id: 'a', kind: 'module', state: 'removed' })).toBe(true);
    expect(isGhostNode({ id: 'a', kind: 'module', state: 'measured' })).toBe(false);
    expect(isGhostNode({ id: 'a', kind: 'module', state: 'unreachable' })).toBe(false);
    expect(isGhostNode(null)).toBe(false);
    const a = nodeAppearance({ id: 'a', kind: 'module', ghost: true }, {});
    expect(a.ring).toBe('ghost');
  });

  it('ghost ring recipes render hollow-style rings in both themes', () => {
    expect(RING_RECIPES.ghost.ringAlpha(true)).toBe(RING_RECIPES.hollow.ringAlpha(true));
    expect(RING_RECIPES.ghost.ringAlpha(false)).toBe(RING_RECIPES.hollow.ringAlpha(false));
    expect(RING_RECIPES.ghost.ringWidth(10, true)).toBe(RING_RECIPES.hollow.ringWidth(10, true));
    expect(RING_RECIPES.ghost.innerRim(10)).toBe(RING_RECIPES.hollow.innerRim(10));
    // and no fault-only keys crept in
    expect(RING_RECIPES.ghost.halo).toBeUndefined();
    expect(RING_RECIPES.ghost.slash).toBeUndefined();
  });
});

describe('theme plumbing — persistence and scoped CSS vars', () => {
  beforeEach(() => {
    try { window.localStorage.clear(); } catch { /* jsdom always has it */ }
  });

  it('readStoredTheme defaults to dark when nothing is stored', () => {
    expect(readStoredTheme()).toBe('dark');
  });

  it('readStoredTheme honours a stored light choice and rejects garbage', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(readStoredTheme()).toBe('light');
    window.localStorage.setItem(THEME_STORAGE_KEY, 'solarized');
    expect(readStoredTheme()).toBe('dark');
    window.localStorage.setItem(THEME_STORAGE_KEY, 'DARK');
    expect(readStoredTheme()).toBe('dark');
  });

  it('reads and writes are safe when localStorage throws', () => {
    const spyGet = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    expect(readStoredTheme()).toBe('dark');
    spyGet.mockRestore();
    const spySet = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    expect(() => writeStoredTheme('light')).not.toThrow();
    spySet.mockRestore();
  });

  it('writeStoredTheme persists a valid theme', () => {
    writeStoredTheme('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    writeStoredTheme('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('applyThemeVars writes the full LIGHT token set as CSS custom properties', () => {
    const el = document.createElement('div');
    applyThemeVars(el, 'light');
    expect(el.style.getPropertyValue('--bg')).toBe(LIGHT.bg);
    expect(el.style.getPropertyValue('--panel')).toBe(LIGHT.panel);
    expect(el.style.getPropertyValue('--faultT')).toBe(LIGHT.faultT);
    expect(el.style.getPropertyValue('--hollow')).toBe(LIGHT.hollow);
    expect(el.style.getPropertyValue('--bg')).not.toBe(DARK.bg);
    applyThemeVars(el, 'dark');
    expect(el.style.getPropertyValue('--bg')).toBe(DARK.bg);
  });

  it('applyThemeVars/clearThemeVars are no-ops on a missing element', () => {
    expect(() => applyThemeVars(null, 'light')).not.toThrow();
    expect(() => clearThemeVars(null)).not.toThrow();
  });

  it('clearThemeVars removes every token key from both palettes', () => {
    const el = document.createElement('div');
    applyThemeVars(el, 'light');
    clearThemeVars(el);
    const keys = new Set([...Object.keys(DARK), ...Object.keys(LIGHT)]);
    keys.forEach((k) => expect(el.style.getPropertyValue('--' + k), `--${k}`).toBe(''));
  });
});

describe('legend labels', () => {
  it('KIND_LABEL and LINK_LABEL survive for the legend', () => {
    expect(KIND_LABEL.store).toBeTruthy();
    expect(LINK_LABEL.reads).toBeTruthy();
  });
});
