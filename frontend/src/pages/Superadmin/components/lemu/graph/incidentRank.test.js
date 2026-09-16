import {
  SEVERITY_LEVELS,
  severityLevelOf,
  rankIncidents,
  urgencyForRank,
  urgencyByNode,
  pullTowardCentre,
} from './incidentRank';

const NOW = Date.parse('2026-09-16T12:00:00Z');

const group = (over = {}) => ({
  fingerprint: 'fp',
  nodeId: 'module:a',
  matchQuality: 'exact',
  severity: 'ERROR',
  occurrences: 1,
  ...over,
});

describe('severityLevelOf', () => {
  it('maps every severity string to its level', () => {
    expect(severityLevelOf('FATAL')).toBe(4);
    expect(severityLevelOf('ERROR')).toBe(3);
    expect(severityLevelOf('WARN')).toBe(2);
    expect(severityLevelOf('INFO')).toBe(1);
    expect(severityLevelOf('DEBUG')).toBe(0);
  });

  it('reads missing/unknown severity as ERROR — never louder than a real FATAL', () => {
    expect(severityLevelOf(undefined)).toBe(SEVERITY_LEVELS.ERROR);
    expect(severityLevelOf(null)).toBe(SEVERITY_LEVELS.ERROR);
    expect(severityLevelOf('bogus')).toBe(SEVERITY_LEVELS.ERROR);
  });

  it('is case-insensitive', () => {
    expect(severityLevelOf('fatal')).toBe(4);
  });
});

describe('rankIncidents', () => {
  it('excludes groups that never attributed to a node', () => {
    const ranked = rankIncidents(
      [group(), group({ nodeId: null, matchQuality: 'none', fingerprint: 'u' })],
      NOW,
    );
    expect(ranked).toHaveLength(1);
    expect(ranked[0].nodeId).toBe('module:a');
  });

  it('orders severity first: a 1-occurrence FATAL beats a 999-occurrence ERROR', () => {
    const ranked = rankIncidents(
      [
        group({ fingerprint: 'err', severity: 'ERROR', occurrences: 999 }),
        group({ fingerprint: 'fat', severity: 'FATAL', occurrences: 1 }),
      ],
      NOW,
    );
    expect(ranked.map((i) => i.fingerprint)).toEqual(['fat', 'err']);
  });

  it('breaks severity ties by blast radius (occurrences)', () => {
    const ranked = rankIncidents(
      [
        group({ fingerprint: 'low', occurrences: 3 }),
        group({ fingerprint: 'high', occurrences: 40 }),
      ],
      NOW,
    );
    expect(ranked.map((i) => i.fingerprint)).toEqual(['high', 'low']);
  });

  it('breaks occurrence ties by age — longest unresolved first', () => {
    const ranked = rankIncidents(
      [
        group({
          fingerprint: 'fresh',
          occurrences: 5,
          firstOccurrence: '2026-09-15T12:00:00Z',
        }),
        group({
          fingerprint: 'ancient',
          occurrences: 5,
          firstOccurrence: '2026-08-01T00:00:00Z',
        }),
      ],
      NOW,
    );
    expect(ranked.map((i) => i.fingerprint)).toEqual(['ancient', 'fresh']);
    expect(ranked[0].ageMs).toBeGreaterThan(ranked[1].ageMs);
  });

  it('does not mutate the input groups', () => {
    const groups = [group()];
    const snapshot = JSON.parse(JSON.stringify(groups));
    rankIncidents(groups, NOW);
    expect(groups).toEqual(snapshot);
  });
});

describe('urgencyForRank — rank → visual weight', () => {
  it('rank 0 is the loudest on every channel', () => {
    const top = urgencyForRank(0);
    for (let r = 1; r < 8; r += 1) {
      const u = urgencyForRank(r);
      expect(u.scale).toBeLessThan(top.scale);
      expect(u.pulseHz).toBeLessThanOrEqual(top.pulseHz);
      expect(u.halo).toBeLessThan(top.halo);
      expect(u.pull).toBeLessThan(top.pull);
    }
  });

  it('channels decay monotonically — a worse incident never renders quieter', () => {
    let prev = urgencyForRank(0);
    for (let r = 1; r < 12; r += 1) {
      const u = urgencyForRank(r);
      expect(u.scale).toBeLessThanOrEqual(prev.scale);
      expect(u.pulseHz).toBeLessThanOrEqual(prev.pulseHz);
      expect(u.halo).toBeLessThanOrEqual(prev.halo);
      expect(u.pull).toBeLessThanOrEqual(prev.pull);
      prev = u;
    }
  });

  it('clamps negative and junk ranks to rank 0', () => {
    expect(urgencyForRank(-3)).toEqual(urgencyForRank(0));
    expect(urgencyForRank('junk')).toEqual(urgencyForRank(0));
  });

  it('pulse never drops below the floor — every incident still visibly pulses', () => {
    expect(urgencyForRank(100).pulseHz).toBe(0.6);
    expect(urgencyForRank(100).pull).toBe(0);
  });
});

describe('urgencyByNode', () => {
  it('keys urgency by node id with rank and incident attached', () => {
    const incidents = rankIncidents(
      [
        group({ fingerprint: 'b', nodeId: 'module:b' }),
        group({ fingerprint: 'a', nodeId: 'module:a' }),
      ],
      NOW,
    );
    const map = urgencyByNode(incidents);
    expect(map.get('module:b').rank).toBe(0);
    expect(map.get('module:a').rank).toBe(1);
    expect(map.get('module:a').incident.fingerprint).toBe('a');
  });

  it('a node’s worst incident wins; no duplicate entries', () => {
    const incidents = rankIncidents(
      [
        group({ fingerprint: 'worst', nodeId: 'module:a', severity: 'FATAL', occurrences: 1 }),
        group({ fingerprint: 'mild', nodeId: 'module:a', severity: 'ERROR', occurrences: 99 }),
      ],
      NOW,
    );
    const map = urgencyByNode(incidents);
    expect(map.size).toBe(1);
    expect(map.get('module:a').incident.fingerprint).toBe('worst');
  });
});

describe('pullTowardCentre', () => {
  it('pull 0 leaves the point untouched', () => {
    expect(pullTowardCentre(100, 50, 0, 800, 600)).toEqual({ x: 100, y: 50 });
  });

  it('pull 1 lands dead centre', () => {
    expect(pullTowardCentre(100, 50, 1, 800, 600)).toEqual({ x: 400, y: 300 });
  });

  it('a partial pull moves proportionally toward the centre on both axes', () => {
    const p = pullTowardCentre(200, 100, 0.5, 800, 600);
    expect(p.x).toBe(200 + (400 - 200) * 0.5);
    expect(p.y).toBe(100 + (300 - 100) * 0.5);
  });

  it('a point already at the centre stays put', () => {
    expect(pullTowardCentre(400, 300, 0.28, 800, 600)).toEqual({ x: 400, y: 300 });
  });
});
