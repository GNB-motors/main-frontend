import { formatAge, connectionChip, flowChip } from './fleetEdgeHealthFormat.js';

describe('fleetEdgeHealthFormat', () => {
  it('formats ages into human "how long ago"', () => {
    expect(formatAge(null)).toBe('—');
    expect(formatAge(undefined)).toBe('—');
    expect(formatAge(30)).toBe('30s');
    expect(formatAge(300)).toBe('5 min');
    expect(formatAge(3600)).toBe('1 hr');
    expect(formatAge(4500)).toBe('1 hr 15 min');
    expect(formatAge(90000)).toBe('1 d');
  });

  it('maps connection statuses to tones', () => {
    expect(connectionChip('CONNECTED')).toEqual({ tone: 'ok', text: 'Connected' });
    expect(connectionChip('NEEDS_REAUTH').tone).toBe('critical');
    expect(connectionChip('NOT_LINKED').tone).toBe('inert');
    expect(connectionChip('WEIRD')).toEqual({ tone: 'inert', text: 'WEIRD' });
  });

  it('maps data-flow statuses to tones', () => {
    expect(flowChip('FLOWING').tone).toBe('ok');
    expect(flowChip('STALE').tone).toBe('caution');
    expect(flowChip('NO_DATA').tone).toBe('critical');
  });
});
