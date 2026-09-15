import { describe, it, expect } from 'vitest';
import { overlayFromDiff, ghostNode } from './diffOverlay';

describe('overlayFromDiff', () => {
  it('returns an empty Map for null/undefined diff', () => {
    expect(overlayFromDiff(null).size).toBe(0);
    expect(overlayFromDiff(undefined).size).toBe(0);
  });

  it('returns an empty Map for an empty diff object', () => {
    expect(overlayFromDiff({}).size).toBe(0);
  });

  it('marks added/removed routes using the nodeId scheme', () => {
    const marks = overlayFromDiff({
      routes: {
        added: [{ method: 'GET', path: '/vehicles', mountPath: '/api' }],
        removed: [{ method: 'POST', path: '/trips' }],
      },
    });
    expect(marks.get('route:GET:/api/vehicles')).toBe('added');
    expect(marks.get('route:POST:/trips')).toBe('removed');
  });

  it('drops null/undefined route entries; a non-object entry survives as "route:undefined:/"', () => {
    expect(() => overlayFromDiff({ routes: { added: [null] } })).not.toThrow();
    const marks = overlayFromDiff({ routes: { added: [null, undefined] } });
    expect(marks.size).toBe(0);
    // Oddity, characterized: nodeId.route does not throw on a primitive —
    // property reads yield undefined and fullRoutePath falls back to '/'.
    const odd = overlayFromDiff({ routes: { added: [42] } });
    expect(odd.get('route:undefined:/')).toBe('added');
  });

  it('rebuilds changed routes from the "METHOD /path" middleware key', () => {
    const marks = overlayFromDiff({
      routes: { middlewareChanged: [{ key: 'GET /api/vehicles', before: [], after: [] }] },
    });
    expect(marks.get('route:GET:/api/vehicles')).toBe('changed');
  });

  it('skips middleware entries whose key has no space', () => {
    const marks = overlayFromDiff({
      routes: { middlewareChanged: [{ key: 'GET' }, { key: ' /leadingspace' }, { key: 'PUT /ok' }] },
    });
    expect(marks.size).toBe(1);
    expect(marks.get('route:PUT:/ok')).toBe('changed');
  });

  it('marks models by modelName, including indexChanged', () => {
    const marks = overlayFromDiff({
      models: {
        added: [{ modelName: 'Vehicle' }],
        removed: [{ modelName: 'Trip' }],
        indexChanged: [{ modelName: 'Driver', before: [], after: [] }],
      },
    });
    expect(marks.get('model:Vehicle')).toBe('added');
    expect(marks.get('model:Trip')).toBe('removed');
    expect(marks.get('model:Driver')).toBe('changed');
  });

  it('skips model entries without a modelName', () => {
    const marks = overlayFromDiff({
      models: { added: [{}, null, { other: 'field' }], indexChanged: [{ before: [] }] },
    });
    expect(marks.size).toBe(0);
  });

  it('marks jobs by name', () => {
    const marks = overlayFromDiff({
      jobs: {
        added: [{ name: 'nightly-sync' }],
        removed: [{ name: 'old-feed' }],
        uninstrumented: [{ name: 'ignored' }],
      },
    });
    expect(marks.get('job:nightly-sync')).toBe('added');
    expect(marks.get('job:old-feed')).toBe('removed');
    // uninstrumented is deliberately not a change — skipped
    expect(marks.has('job:ignored')).toBe(false);
  });

  it('marks modules as plain "module:<name>" strings and skips non-strings', () => {
    const marks = overlayFromDiff({
      modules: {
        added: ['auth', { name: 'not-a-string' }],
        removed: ['billing'],
      },
    });
    expect(marks.get('module:auth')).toBe('added');
    expect(marks.get('module:billing')).toBe('removed');
    expect(marks.size).toBe(2);
  });

  it('silently drops functions and edges sections (no node meaning)', () => {
    const marks = overlayFromDiff({
      functions: { added: [{ functionName: 'f' }], removed: [] },
      edges: { added: [{ from: 'a', to: 'b' }], removed: [] },
    });
    expect(marks.size).toBe(0);
  });

  it('a later section overwrites an earlier mark for the same id', () => {
    const marks = overlayFromDiff({
      models: {
        added: [{ modelName: 'Vehicle' }],
        indexChanged: [{ modelName: 'Vehicle', before: [], after: [] }],
      },
    });
    expect(marks.get('model:Vehicle')).toBe('changed');
    expect(marks.size).toBe(1);
  });
});

describe('ghostNode', () => {
  it('builds a metric-free removed placeholder from an id', () => {
    expect(ghostNode('module:auth')).toEqual({
      id: 'module:auth',
      kind: 'module',
      label: 'auth',
      state: 'removed',
      ghost: true,
      val: 3,
    });
  });

  it('derives kind and label from the first colon segment', () => {
    const g = ghostNode('route:GET:/api/x');
    expect(g.kind).toBe('route');
    expect(g.label).toBe('GET:/api/x');
    expect(g.state).toBe('removed');
  });

  it('produces an empty label for an id with no colon', () => {
    const g = ghostNode('bare');
    expect(g.kind).toBe('bare');
    expect(g.label).toBe('');
  });
});
