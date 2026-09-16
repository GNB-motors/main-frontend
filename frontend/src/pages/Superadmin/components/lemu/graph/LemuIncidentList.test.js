import { formatIncidentAge } from './incidentRank';

/* formatIncidentAge lives in the pure module; these cases pin its buckets. */

describe('formatIncidentAge', () => {
  it('renders sub-minute ages as <1m', () => {
    expect(formatIncidentAge(0)).toBe('<1m');
    expect(formatIncidentAge(59 * 1000)).toBe('<1m');
    expect(formatIncidentAge(null)).toBe('<1m');
    expect(formatIncidentAge(Number.NaN)).toBe('<1m');
  });

  it('renders minutes below an hour', () => {
    expect(formatIncidentAge(60 * 1000)).toBe('1m');
    expect(formatIncidentAge(59 * 60 * 1000)).toBe('59m');
  });

  it('renders hours below a day', () => {
    expect(formatIncidentAge(60 * 60 * 1000)).toBe('1h');
    expect(formatIncidentAge(23 * 60 * 60 * 1000)).toBe('23h');
  });

  it('renders days beyond that', () => {
    expect(formatIncidentAge(24 * 60 * 60 * 1000)).toBe('1d');
    expect(formatIncidentAge(30 * 24 * 60 * 60 * 1000)).toBe('30d');
  });
});
