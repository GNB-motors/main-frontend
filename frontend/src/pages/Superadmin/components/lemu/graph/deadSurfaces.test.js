import { describe, it, expect } from 'vitest';
import { findDeadSurfaces } from './deadSurfaces';

describe('findDeadSurfaces', () => {
  it('returns all six categories, empty when nothing is dead', () => {
    const out = findDeadSurfaces({});
    expect(out).toEqual({
      zeroOutputJobs: [],
      neverRanJobs: [],
      orphanModules: [],
      idleModels: [],
      quietMounts: [],
      disabledJobs: [],
    });
  });

  it('throws when called with no argument (destructuring has no top-level default)', () => {
    // Oddity, characterized: the parameter defaults cover a missing field,
    // not a missing argument. Callers always pass an object.
    expect(() => findDeadSurfaces()).toThrow(TypeError);
  });

  describe('orphanModules', () => {
    it('flags module nodes nothing links to', () => {
      const out = findDeadSurfaces({
        nodes: [
          { id: 'module:a', kind: 'module', label: 'a' },
          { id: 'module:b', kind: 'module', label: 'b' },
        ],
        links: [{ source: 'x', target: 'module:b' }],
      });
      expect(out.orphanModules).toEqual([
        { id: 'module:a', label: 'a', reason: 'no module depends on it' },
      ]);
    });

    it('does not flag non-module nodes with no inbound links', () => {
      const out = findDeadSurfaces({ nodes: [{ id: 'model:m', kind: 'model', label: 'm', ops: 5 }] });
      expect(out.orphanModules).toEqual([]);
    });

    it('resolves object link endpoints when computing inbound', () => {
      const out = findDeadSurfaces({
        nodes: [{ id: 'module:a', kind: 'module', label: 'a' }],
        links: [{ source: { id: 'x' }, target: { id: 'module:a' } }],
      });
      expect(out.orphanModules).toEqual([]);
    });
  });

  describe('idleModels and quietMounts', () => {
    it('flags models with no ops', () => {
      const out = findDeadSurfaces({
        nodes: [
          { id: 'model:a', kind: 'model', label: 'a' },
          { id: 'model:b', kind: 'model', label: 'b', ops: 12 },
        ],
      });
      expect(out.idleModels).toEqual([{ id: 'model:a', label: 'a', reason: 'no traffic in 24h' }]);
    });

    it('flags mounts with no ops', () => {
      const out = findDeadSurfaces({
        nodes: [
          { id: 'mount:a', kind: 'mount', label: 'a' },
          { id: 'mount:b', kind: 'mount', label: 'b', ops: 0 },
        ],
      });
      // ops: 0 is falsy, so it counts as quiet
      expect(out.quietMounts).toEqual([
        { id: 'mount:a', label: 'a', reason: 'no requests in 24h' },
        { id: 'mount:b', label: 'b', reason: 'no requests in 24h' },
      ]);
    });
  });

  describe('job health', () => {
    it('accepts both j.job and j.name as the job name', () => {
      const out = findDeadSurfaces({
        jobHealth: [
          { job: 'by-job', status: 'never-ran' },
          { name: 'by-name', status: 'never-ran' },
        ],
      });
      expect(out.neverRanJobs.map((j) => j.label)).toEqual(['by-job', 'by-name']);
    });

    it('skips job entries with no name', () => {
      const out = findDeadSurfaces({ jobHealth: [{ status: 'never-ran' }] });
      expect(out.neverRanJobs).toEqual([]);
    });

    it('flags zero-output jobs at 3+ consecutive runs', () => {
      const out = findDeadSurfaces({
        jobHealth: [
          { name: 'two', consecutiveRunsWithZeroOutput: 2 },
          { name: 'three', consecutiveRunsWithZeroOutput: 3 },
        ],
      });
      expect(out.zeroOutputJobs).toEqual([
        { id: 'job:three', label: 'three', reason: 'succeeded but wrote 0 rows in 3 consecutive runs' },
      ]);
    });

    it('treats missing consecutiveRunsWithZeroOutput as 0', () => {
      const out = findDeadSurfaces({ jobHealth: [{ name: 'ok', status: 'healthy' }] });
      expect(out.zeroOutputJobs).toEqual([]);
    });

    it('routes flag-off jobs to disabledJobs instead of neverRanJobs', () => {
      const out = findDeadSurfaces({
        jobHealth: [{ name: 'feed', status: 'never-ran' }],
        flags: { feed: false },
      });
      expect(out.disabledJobs).toEqual([
        { id: 'job:feed', label: 'feed', reason: 'feature flag is off — not a fault' },
      ]);
      expect(out.neverRanJobs).toEqual([]);
    });

    it('a flag-disabled job also skips the zero-output check (continue)', () => {
      const out = findDeadSurfaces({
        jobHealth: [{ name: 'feed', consecutiveRunsWithZeroOutput: 5 }],
        flags: { feed: false },
      });
      expect(out.zeroOutputJobs).toEqual([]);
      expect(out.disabledJobs).toHaveLength(1);
    });

    it('a never-ran job with 3+ zero-output runs lands in BOTH lists', () => {
      const out = findDeadSurfaces({
        jobHealth: [{ name: 'dup', status: 'never-ran', consecutiveRunsWithZeroOutput: 3 }],
      });
      expect(out.neverRanJobs.map((j) => j.id)).toEqual(['job:dup']);
      expect(out.zeroOutputJobs.map((j) => j.id)).toEqual(['job:dup']);
    });
  });
});
