import { afterEach, describe, expect, it, vi } from 'vitest';
import rings from './indiaPumpBoundary.json';
import { filterIndianPumps, indiaContains } from './indiaPumpFilter';

afterEach(() => vi.unstubAllGlobals());
describe('India pump filtering', () => {
  const contains = indiaContains(rings);
  it.each([
    ['Delhi', 28.6139, 77.209, true],
    ['Kolkata', 22.5726, 88.3639, true],
    ['Port Blair', 11.6234, 92.7265, true],
    ['Dhaka', 23.8103, 90.4125, false],
    ['Kathmandu', 27.7172, 85.324, false],
    ['Lahore', 31.5204, 74.3587, false],
    ['Colombo', 6.9271, 79.8612, false],
  ])('classifies %s against the country outline', (_name, lat, lng, expected) => {
    expect(contains({ lat, lng })).toBe(expected);
  });
  it('excludes invalid coordinates and respects interior holes', () => {
    expect(contains({ lat: null, lng: 88 })).toBe(false);
    const hole = indiaContains([
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
      [
        [2, 2],
        [4, 2],
        [4, 4],
        [2, 4],
        [2, 2],
      ],
    ]);
    expect(hole({ lat: 3, lng: 3 })).toBe(false);
    expect(hole({ lat: 1, lng: 1 })).toBe(true);
  });
  it('loads the self-hosted boundary only for pumps and retries a failed load', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValue({ ok: true, json: async () => rings });
    vi.stubGlobal('fetch', fetch);
    const hospital = { layer: 'hospitals', lat: 23.8103, lng: 90.4125 };
    expect(await filterIndianPumps([hospital])).toEqual([hospital]);
    expect(fetch).not.toHaveBeenCalled();
    const pump = { layer: 'pumps', lat: 22.5726, lng: 88.3639 };
    const foreign = { layer: 'pumps', lat: 23.8103, lng: 90.4125 };
    await expect(filterIndianPumps([pump])).rejects.toThrow('India pump boundary');
    expect(await filterIndianPumps([pump, foreign, hospital])).toEqual([pump, hospital]);
    await filterIndianPumps([pump]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
