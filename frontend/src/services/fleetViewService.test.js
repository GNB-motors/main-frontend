import { describe, it, expect, vi, beforeEach } from 'vitest';

const get = vi.hoisted(() => vi.fn());
vi.mock('../utils/axiosConfig', () => ({ default: { get } }));

const { fleetViewService } = await import('./fleetViewService');

describe('fleetViewService.getDigestConditional', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends the tag it holds and asks for the body without one', async () => {
    get.mockResolvedValue({
      status: 200,
      data: { data: { sections: [] } },
      headers: { etag: '"v1"' },
    });
    const res = await fleetViewService.getDigestConditional({
      date: '2026-11-18',
      quick: true,
      etag: '"v1"',
    });
    expect(get).toHaveBeenCalledWith(
      '/api/fleet-view/digest',
      expect.objectContaining({
        headers: { 'If-None-Match': '"v1"' },
        validateStatus: expect.any(Function),
      }),
    );
    expect(res.status).toBe(200);
    expect(res.etag).toBe('"v1"');

    await fleetViewService.getDigestConditional({ date: '2026-11-18' });
    expect(get.mock.calls[1][1].headers).toBeUndefined();
  });

  it('reports a 304 as such and reads no body', async () => {
    get.mockResolvedValue({ status: 304, data: '', headers: { etag: '"v1"' } });
    const res = await fleetViewService.getDigestConditional({
      date: '2026-11-18',
      etag: '"v1"',
    });
    expect(res).toEqual({ status: 304, data: null, etag: '"v1"' });
  });

  it('lets the 304 the server sends through', async () => {
    get.mockResolvedValue({ status: 304, data: '', headers: {} });
    await fleetViewService.getDigestConditional({ date: '2026-11-18', etag: '"v1"' });
    const { validateStatus } = get.mock.calls[0][1];
    expect(validateStatus(200)).toBe(true);
    expect(validateStatus(304)).toBe(true);
    expect(validateStatus(500)).toBe(false);
  });
});
