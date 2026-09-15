import { describe, it, expect } from 'vitest';
import { provenanceOf } from './HotspotService';

describe('provenanceOf', () => {
  it('marks orgId:null rows as network-shared', () => {
    expect(provenanceOf({ orgId: null, source: 'AUTO_LEARNED' })).toBe('network');
    expect(provenanceOf({ source: 'AUTO_LEARNED' })).toBe('network');
  });

  it('distinguishes own learned from own manual', () => {
    expect(provenanceOf({ orgId: 'org1', source: 'AUTO_LEARNED' })).toBe('own-learned');
    expect(provenanceOf({ orgId: 'org1', source: 'MANUAL' })).toBe('own-manual');
  });

  it('handles missing rows', () => {
    expect(provenanceOf(null)).toBe('unknown');
    expect(provenanceOf(undefined)).toBe('unknown');
  });
});
