import { describe, it, expect } from 'vitest';
import { clickDraft, clickMenuItems, clampRadius, declareOutcome } from './trackClickModel';

describe('trackClickModel', () => {
  it('bounds the radius of a new place', () => {
    expect(clampRadius(10)).toBe(50);
    expect(clampRadius(9000)).toBe(5000);
    expect(clampRadius(120)).toBe(120);
  });

  it('never turns an unknown radius into no fence at all', () => {
    expect(clampRadius(undefined)).toBe(50);
    expect(clampRadius(null)).toBe(50);
    expect(clampRadius('abc')).toBe(50);
  });

  it('offers making a place only to the people who may make one', () => {
    expect(clickMenuItems({ canEdit: true }).map((item) => item.id)).toContain('makePlace');
    expect(clickMenuItems({ canEdit: false }).map((item) => item.id)).not.toContain('makePlace');
  });

  it('starts the draft where the pointer landed', () => {
    const draft = clickDraft({ lat: 22.5937, lng: 78.9629 });
    expect(draft.center).toEqual({ lat: 22.5937, lng: 78.9629 });
    expect(draft.radiusM).toBe(100);
    expect(draft.shape).toBe('circle');
  });

  it('says a place is already there when the backend says so', () => {
    const outcome = declareOutcome({ site: { _id: 'p1', name: 'Balaji Plant' }, existing: true });
    expect(outcome.existing).toBe(true);
    expect(outcome.message).toBe('Already a place: Balaji Plant');
    expect(outcome.site._id).toBe('p1');
  });

  it('says the place was saved when it is new', () => {
    const outcome = declareOutcome({ site: { _id: 'p2', name: 'New Yard' }, existing: false });
    expect(outcome.existing).toBe(false);
    expect(outcome.message).toBe('Saved New Yard');
  });
});
