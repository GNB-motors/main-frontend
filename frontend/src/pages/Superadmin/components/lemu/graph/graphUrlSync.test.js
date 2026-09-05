import { describe, it, expect } from 'vitest';
import { applyGraphParams } from './graphUrlSync';

const base = { view: 'graph', hopDepth: 2, query: '', mode: '3d', layer: 'code' };

describe('applyGraphParams', () => {
  it('writes defaults as deletions, keeping the URL short', () => {
    const next = applyGraphParams('', base);
    expect([...next.keys()]).toEqual([]);
  });

  it('round-trips non-default values', () => {
    const next = applyGraphParams('', {
      view: 'table', hopDepth: 'all', query: 'tri', mode: '2d', layer: 'infra',
    });
    expect(next.get('gview')).toBe('table');
    expect(next.get('hops')).toBe('all');
    expect(next.get('q')).toBe('tri');
    expect(next.get('mode')).toBe('2d');
    expect(next.get('layer')).toBe('infra');
  });

  it('preserves params it does not own (node, tab, findings) from the live search', () => {
    const next = applyGraphParams('?node=table%3Atelemetry_events&findings=open&v=41', {
      view: 'graph', hopDepth: 1, query: '', mode: '3d', layer: 'infra',
    });
    expect(next.get('node')).toBe('table:telemetry_events');
    expect(next.get('findings')).toBe('open');
    expect(next.get('v')).toBe('41');
    expect(next.get('hops')).toBe('1');
    expect(next.get('layer')).toBe('infra');
  });

  it('replaces owned params on the live search without resurrecting stale ones', () => {
    const next = applyGraphParams('?q=old&node=collection%3Alivevehiclepositions', {
      view: 'graph', hopDepth: 2, query: '', mode: '3d', layer: 'code',
    });
    expect(next.get('q')).toBeNull();
    expect(next.get('node')).toBe('collection:livevehiclepositions');
  });

  it('treats a whitespace-only query as empty', () => {
    const next = applyGraphParams('?q=old', { ...base, query: '   ' });
    expect(next.get('q')).toBeNull();
  });
});
