import { describe, it, expect } from 'vitest';
import { initViewState } from './graphViewState';

const params = (search) => new URLSearchParams(search);

describe('initViewState', () => {
  it('returns the design defaults for an empty URL', () => {
    expect(initViewState(params(''))).toEqual({
      view: 'graph',
      query: '',
      hopDepth: 2,
      mode: '2d',
      layer: 'code',
    });
  });

  it('reads gview, q, hops, mode and layer from the URL', () => {
    expect(initViewState(params('?gview=table&q=tri&hops=3&mode=3d&layer=infra'))).toEqual({
      view: 'table',
      query: 'tri',
      hopDepth: 3,
      mode: '3d',
      layer: 'infra',
    });
  });

  it('honours hops=all', () => {
    expect(initViewState(params('?hops=all')).hopDepth).toBe('all');
  });

  it('rejects values outside the supported sets', () => {
    const v = initViewState(params('?gview=list&hops=9&mode=webgl&layer=banana'));
    expect(v.view).toBe('graph');
    expect(v.hopDepth).toBe(2);
    expect(v.mode).toBe('2d');
    expect(v.layer).toBe('code');
  });
});
