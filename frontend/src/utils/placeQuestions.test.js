import { describe, it, expect } from 'vitest';
import {
  QUESTION_KIND_TEXT,
  kmAtStakeText,
  placeAnswerMessage,
  placeTripsStayOpen,
  questionHeadline,
  questionKmAtStake,
  questionSuspicious,
} from './placeQuestions';

describe('place questions — the kilometres at stake', () => {
  it('reads a normal value', () => {
    expect(questionKmAtStake({ kmAtStake: 1240 })).toBe(1240);
    expect(kmAtStakeText({ kmAtStake: 1240 })).toBe('1,240 km depend on this answer');
  });

  it('rounds to whole kilometres, because the server sends whole kilometres', () => {
    expect(questionKmAtStake({ kmAtStake: 1240.6 })).toBe(1241);
    expect(questionKmAtStake({ kmAtStake: 1240.4 })).toBe(1240);
  });

  it('is null when the field is null', () => {
    expect(questionKmAtStake({ kmAtStake: null })).toBeNull();
    expect(kmAtStakeText({ kmAtStake: null })).toBeNull();
  });

  it('is null when the field is absent, as on the old backend', () => {
    expect(questionKmAtStake({})).toBeNull();
    expect(kmAtStakeText({})).toBeNull();
    expect(questionKmAtStake(undefined)).toBeNull();
    expect(kmAtStakeText(undefined)).toBeNull();
  });

  it('is null for a value that is not a number', () => {
    expect(questionKmAtStake({ kmAtStake: 'many' })).toBeNull();
    expect(questionKmAtStake({ kmAtStake: '' })).toBeNull();
  });
});

describe('place questions — how many trips look unusual', () => {
  it('reads a normal value', () => {
    expect(questionSuspicious({ suspicious: 3 })).toBe(3);
  });

  it('is null for null, absent and zero — zero is not "some trips look unusual"', () => {
    expect(questionSuspicious({ suspicious: null })).toBeNull();
    expect(questionSuspicious({})).toBeNull();
    expect(questionSuspicious({ suspicious: 0 })).toBeNull();
  });
});

describe('place questions — what kind of question this is', () => {
  it('asks the long-stop question in the owner’s words', () => {
    expect(QUESTION_KIND_TEXT.LONG_STOP).toBe(
      'Trucks stop here for a long time. Is this a delivery point?',
    );
    expect(questionHeadline({ kind: 'LONG_STOP' })).toBe(
      'Trucks stop here for a long time. Is this a delivery point?',
    );
  });

  it('has a line for every kind the backend sends', () => {
    expect(questionHeadline({ kind: 'INFERRED_DROP' })).toBeTruthy();
    expect(questionHeadline({ kind: 'UNKNOWN_DROP' })).toBeTruthy();
  });

  it('has no line when the kind is absent, as on the old backend', () => {
    expect(questionHeadline({})).toBeNull();
    expect(questionHeadline(null)).toBeNull();
  });

  it('has no line for a kind this build does not know', () => {
    expect(questionHeadline({ kind: 'SOMETHING_NEW' })).toBeNull();
  });
});

describe('place questions — what an answer means', () => {
  it('says the trips stay open when the place was labelled but no trip was closed', () => {
    expect(placeAnswerMessage({ tripsUpdated: 0, placeId: 'site-1' })).toBe(
      'Saved. These trips stay open until their drop is found.',
    );
    expect(placeTripsStayOpen({ tripsUpdated: 0, placeId: 'site-1' })).toBe(true);
  });

  it('counts the trips it closed', () => {
    expect(placeAnswerMessage({ tripsUpdated: 2, placeId: 'site-1' })).toBe(
      'Done: 2 trips updated',
    );
    expect(placeTripsStayOpen({ tripsUpdated: 2, placeId: 'site-1' })).toBe(false);
  });

  it('says the place is named when the old backend counts nothing', () => {
    expect(placeAnswerMessage({})).toBe('Done. We will name this place from now on.');
    expect(placeAnswerMessage({ tripsUpdated: null })).toBe(
      'Done. We will name this place from now on.',
    );
    expect(placeAnswerMessage(undefined)).toBe('Done. We will name this place from now on.');
  });

  it('reports a skipped or dismissed point as such', () => {
    expect(placeAnswerMessage({ tripsUpdated: 0, placeId: null }, 'SKIP')).toBe(
      'Skipped for now. No place or trip was changed.',
    );
    expect(placeAnswerMessage({ tripsUpdated: 0, placeId: null }, 'NOT_A_PLACE')).toBe(
      'Noted. We will not ask you about this point again.',
    );
  });
});
