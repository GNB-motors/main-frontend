import { describe, expect, it } from 'vitest';
import { destinationName, evidence, heldReason, routeLines } from './whereNextModel';

const guess = (reason, polyline) => ({ reason, route: { polyline }, place: { name: 'Plant' } });
const line = [[23, 87], [23.1, 87.1], [23.2, 87.2]];

describe('where next map and wording', () => {
  it('draws only the top real geometry until expanded, then faint alternates', () => {
    const data = { destinations: [guess('(18 of 24 times)', line), guess('(2 of 24 times)', line), guess('(1 of 24 times)', [])] };
    expect(routeLines(data, false, { lat: 23, lng: 87 })).toHaveLength(1);
    const expanded = routeLines(data, true, { lat: 23, lng: 87 });
    expect(expanded).toHaveLength(2);
    expect(expanded[1].weak).toBe(true);
    expect(routeLines({ ...data, held: true }, true)).toEqual([]);
    expect(routeLines({ destinations: [guess('', [])] }, false, { lat: 23, lng: 87 })).toEqual([]);
  });
  it('uses own run counts and a cached locality when supplied', () => {
    expect(evidence(guess('(1 of 24 times)', line))).toBe('seen once — weak guess');
    expect(evidence(guess('(2 of 24 times)', line))).toBe('seen twice — weak guess');
    expect(evidence(guess('(18 of 24 times)', line))).toContain('strong guess');
    expect(destinationName({ name: 'Unnamed place', locality: 'Panagarh' })).toBe('Unnamed stop near Panagarh');
    expect(heldReason({ basis: { text: "Last fix is not near any of this org's places" } })).toMatch(/On the road between places/);
  });
});
