import { describe, it, expect } from 'vitest';
import { mergePlaces } from './mergePlaces.js';

const site = (over) => ({
  _id: 's1',
  name: 'Loading bay',
  siteType: 'LOADING',
  status: 'CONFIRMED',
  centroidLat: 23.1,
  centroidLng: 86.9,
  radiusM: 150,
  origins: ['ENGINE'],
  ...over,
});

const square = (lat, lng) => ({
  type: 'Polygon',
  coordinates: [
    [
      [lng, lat],
      [lng + 0.01, lat],
      [lng + 0.01, lat + 0.01],
      [lng, lat + 0.01],
      [lng, lat],
    ],
  ],
});

describe('mergePlaces — core, group and purpose', () => {
  it('carries the core parts, the group and the purpose', () => {
    const [p] = mergePlaces({
      sites: [
        site({
          polygon: square(23.1, 86.9),
          polygonCore: square(23.11, 86.91),
          areaGroup: {
            id: 'g1',
            anchor: true,
            members: ['s1', 's2'],
            polygon: square(23.05, 86.85),
          },
          facility: { siteType: 'FUEL_PUMP' },
        }),
      ],
    });
    expect(p.coreParts).toHaveLength(1);
    expect(p.groupId).toBe('g1');
    expect(p.groupAnchor).toBe(true);
    expect(p.groupParts).toHaveLength(1);
    expect(p.groupMembers).toEqual(['s1', 's2']);
    expect(p.purpose).toBe('pump');
  });

  it('a member carries the group but no group shape, and learns the members', () => {
    const places = mergePlaces({
      sites: [
        site({
          _id: 's1',
          areaGroup: {
            id: 'g1',
            anchor: true,
            members: ['s1', 's2'],
            polygon: square(23.05, 86.85),
          },
        }),
        site({ _id: 's2', centroidLat: 23.2, areaGroup: { id: 'g1', anchor: false } }),
      ],
    });
    const anchor = places.find((p) => p.sourceId === 's1');
    const member = places.find((p) => p.sourceId === 's2');
    expect(member.groupId).toBe('g1');
    expect(member.groupAnchor).toBe(false);
    expect(member.groupParts).toBeNull();
    expect(member.groupMembers).toEqual(['s1', 's2']);
    expect(anchor.groupParts).toHaveLength(1);
  });

  it('a place with no group carries none', () => {
    const [p] = mergePlaces({ sites: [site({ polygonCore: square(23.11, 86.91) })] });
    expect(p.groupId).toBeNull();
    expect(p.groupAnchor).toBe(false);
    expect(p.groupParts).toBeNull();
    expect(p.groupMembers).toEqual([]);
    expect(p.coreParts).toHaveLength(1);
  });

  it('a theft outranks the fuel pump and an unknown type stays general', () => {
    const [pump] = mergePlaces({ sites: [site({ facility: { siteType: 'FUEL_PUMP' } })] });
    expect(pump.purpose).toBe('pump');
    const [theft] = mergePlaces({
      sites: [site({ siteType: 'FUEL_PUMP', risk: { theftIncidents: 2 } })],
    });
    expect(theft.purpose).toBe('theft');
    const [other] = mergePlaces({ sites: [site({ siteType: 'MYSTERY' })] });
    expect(other.purpose).toBe('general');
  });
});
