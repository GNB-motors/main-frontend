import { describe, it, expect } from 'vitest';
import infoTipParts from './infoTipParts';

describe('infoTipParts', () => {
  it('turns three or more clauses into a list', () => {
    const out = infoTipParts(
      'AutoTrip (as of 17 Nov); counted by pickup departure; km is the Trips table loaded distance',
      "How we know: Yesterday's work",
    );
    expect(out.items).toEqual([
      'AutoTrip (as of 17 Nov)',
      'Counted by pickup departure',
      'Km is the Trips table loaded distance',
    ]);
    expect(out.body).toBeNull();
  });

  it('keeps one or two clauses as a sentence', () => {
    const text = 'Estimated from FleetEdge telemetry + configured prices; review before acting.';
    expect(infoTipParts(text)).toEqual({ heading: null, items: null, body: text });
  });

  it('splits on middle dots too', () => {
    expect(
      infoTipParts('Money in: not built · People: no roster · Trend: fine').items,
    ).toHaveLength(3);
  });

  it('does not repeat "How we know:" under a "How we know" heading', () => {
    const out = infoTipParts('How we know: AutoTrip feed', "How we know: Yesterday's work");
    expect(out.heading).toBe("How we know: Yesterday's work");
    expect(out.body).toBe('AutoTrip feed');
  });

  it('has no heading for the generic label', () => {
    expect(infoTipParts('x', 'What is this?').heading).toBeNull();
  });

  it('passes a React node through untouched', () => {
    const node = { type: 'span' };
    expect(infoTipParts(node, 'About X')).toEqual({ heading: 'About X', items: null, body: node });
  });
});
