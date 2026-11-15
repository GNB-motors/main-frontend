import { describe, it, expect } from 'vitest';
import {
  FUEL_VERDICTS,
  NOT_CHECKED,
  verdictFor,
  parkedDropL,
  isParkedDrop,
  drivingUseSentence,
  reviewLossL,
  isReviewLoss,
} from './fuelVerdicts';

describe('FUEL_VERDICTS', () => {
  it('names the four verdicts in plain words', () => {
    expect(FUEL_VERDICTS.EXPLAINED_BY_DRIVING.label).toBe('Explained by driving');
    expect(FUEL_VERDICTS.UNEXPLAINED_WHILE_PARKED.label).toBe('Went down while parked');
    expect(FUEL_VERDICTS.FILL_MISMATCH.label).toBe("Fill doesn't match bill");
    expect(FUEL_VERDICTS.NOT_ENOUGH_DATA.label).toBe('Not enough data');
  });

  it('tones them so the owner can read them without a legend', () => {
    expect(FUEL_VERDICTS.EXPLAINED_BY_DRIVING.tone).toBe('good');
    expect(FUEL_VERDICTS.UNEXPLAINED_WHILE_PARKED.tone).toBe('act');
    expect(FUEL_VERDICTS.FILL_MISMATCH.tone).toBe('watch');
    expect(FUEL_VERDICTS.NOT_ENOUGH_DATA.tone).toBe('info');
  });

  it('never accuses anyone', () => {
    Object.values(FUEL_VERDICTS).forEach((v) => {
      expect(`${v.label} ${v.tip}`.toLowerCase()).not.toMatch(/siphon|theft|stolen|steal/);
    });
  });
});

describe('verdictFor', () => {
  it('reads the verdict the backend sent', () => {
    const v = verdictFor({ verdict: 'UNEXPLAINED_WHILE_PARKED' });
    expect(v.label).toBe('Went down while parked');
    expect(v.tone).toBe('act');
    expect(v.checked).toBe(true);
    expect(v.key).toBe('UNEXPLAINED_WHILE_PARKED');
  });

  it('uses the backend’s own reason when it gives one', () => {
    const v = verdictFor({
      verdict: 'EXPLAINED_BY_DRIVING',
      verdictWhy: { text: '4,820 km at 3.2 km/L', basis: '12 fills' },
    });
    expect(v.text).toBe('4,820 km at 3.2 km/L');
    expect(v.basis).toBe('12 fills');
  });

  it('says the check has not been made when there is no verdict', () => {
    const v = verdictFor({});
    expect(v.label).toBe(NOT_CHECKED.label);
    expect(v.checked).toBe(false);
    expect(v.key).toBeNull();
  });
});

describe('parkedDropL', () => {
  it('reads the measured litres', () => {
    expect(parkedDropL({ parkedDropL: 281.4 })).toBe(281.4);
  });

  it('is null, never zero, when the drop was not measured', () => {
    expect(parkedDropL({})).toBeNull();
    expect(parkedDropL({ parkedDropL: null })).toBeNull();
    expect(parkedDropL(null)).toBeNull();
  });
});

describe('isParkedDrop', () => {
  it('follows the verdict', () => {
    expect(isParkedDrop({ verdict: 'UNEXPLAINED_WHILE_PARKED' })).toBe(true);
    expect(isParkedDrop({ verdict: 'EXPLAINED_BY_DRIVING' })).toBe(false);
  });

  it('does not fall back to the old flag, which fired on parked trucks', () => {
    expect(isParkedDrop({ siphonSuspected: true })).toBe(false);
    expect(isParkedDrop({})).toBe(false);
  });
});

describe('v2 review loss', () => {
  it('uses the adjusted loss and never the threshold or parked-drop field', () => {
    const window = {
      verdict: 'REVIEW_LOSS',
      unaccountedLossL: 40,
      reviewLineL: 15,
      parkedDropL: 999,
    };
    expect(isReviewLoss(window)).toBe(true);
    expect(isParkedDrop(window)).toBe(false);
    expect(reviewLossL(window)).toBe(40);
    expect(reviewLossL({ verdict: 'REVIEW_LOSS', reviewLineL: 15 })).toBeNull();
    expect(reviewLossL({ verdict: 'CLEAN', unaccountedLossL: -5 })).toBe(0);
    expect(reviewLossL({ verdict: 'INSUFFICIENT_DATA', unaccountedLossL: 100 })).toBeNull();
  });
  it.each(['REVIEW_LOSS', 'CLEAN', 'INSUFFICIENT_DATA', 'KEY_CONFLICT'])(
    'recognizes the backend verdict %s as checked',
    (verdict) => {
      expect(verdictFor({ verdict }).checked).toBe(true);
      expect(verdictFor({ verdict }).label).not.toBe('Not checked yet');
    },
  );
});

describe('drivingUseSentence', () => {
  it('says what the driving used and what it usually needs', () => {
    expect(drivingUseSentence({ drivingUseL: 638, expectedDrivingUseL: 610, km: 1920 })).toBe(
      'Used 638 L for 1,920 km; this truck usually needs 610 L for that.',
    );
  });

  it('says nothing about the distance when there is none', () => {
    expect(drivingUseSentence({ drivingUseL: 638, expectedDrivingUseL: 610 })).toBe(
      'Used 638 L; this truck usually needs 610 L.',
    );
  });

  it('says nothing at all when a number is missing', () => {
    expect(drivingUseSentence({ drivingUseL: 638 })).toBeNull();
    expect(drivingUseSentence({})).toBeNull();
    expect(drivingUseSentence(null)).toBeNull();
  });

  it('never accuses in the sentence it builds', () => {
    const sentence = drivingUseSentence({
      drivingUseL: 638,
      expectedDrivingUseL: 610,
      km: 1920,
    });
    expect(sentence.toLowerCase()).not.toMatch(/siphon|theft|stolen|steal/);
  });
});
