import { describe, it, expect } from 'vitest';
import {
  CYCLE_FLAG_LABEL,
  cycleFlagLabel,
  cycleFlagLabels,
  cycleGapFlags,
  fullBasisText,
  hasCycleFlag,
  toleranceScopeText,
} from './fuelCycleFields';

describe('the flags a fuel cycle can carry', () => {
  it('says what was not measured, in plain words', () => {
    expect(CYCLE_FLAG_LABEL.FILL_TYPE_UNKNOWN).toBe('fill type not recorded');
    expect(CYCLE_FLAG_LABEL.GAP_NOT_ASSESSED).toBe('not assessed yet');
    expect(CYCLE_FLAG_LABEL.LEDGER_PARTIAL).toBe('ledger covers part of this cycle');
    expect(CYCLE_FLAG_LABEL.GAP_DURING_SILENCE).toBe('truck silent during this gap');
  });

  it('never reads as "no gap" and never accuses anyone', () => {
    const words = Object.values(CYCLE_FLAG_LABEL).join(' ').toLowerCase();
    expect(words).not.toMatch(/no gap|steal|stolen|theft|siphon|thief|cheat|fraud/);
  });

  it('keeps the code of a flag it does not know', () => {
    expect(cycleFlagLabel('RECONCILE_GAP')).toBe('RECONCILE_GAP');
    expect(cycleFlagLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW');
  });

  it('lists the flags in the order the backend sent them', () => {
    expect(cycleFlagLabels(['GAP_NOT_ASSESSED', 'LEDGER_PARTIAL'])).toEqual([
      'not assessed yet',
      'ledger covers part of this cycle',
    ]);
  });

  it('has no flags at all when the row carries none', () => {
    expect(cycleFlagLabels([])).toEqual([]);
    expect(cycleFlagLabels(null)).toEqual([]);
    expect(hasCycleFlag(null, 'LEDGER_PARTIAL')).toBe(false);
  });

  it('knows when the cycle carries a flag', () => {
    expect(hasCycleFlag(['LEDGER_PARTIAL'], 'LEDGER_PARTIAL')).toBe(true);
    expect(hasCycleFlag(['LEDGER_PARTIAL'], 'GAP_NOT_ASSESSED')).toBe(false);
  });

  it('leaves the fill-type flag out of the flags list — the km/L cell says it', () => {
    expect(cycleGapFlags(['FILL_TYPE_UNKNOWN', 'LEDGER_PARTIAL'])).toEqual(['LEDGER_PARTIAL']);
    expect(cycleGapFlags(['FILL_TYPE_UNKNOWN'])).toEqual([]);
    expect(cycleGapFlags(null)).toEqual([]);
  });
});

describe('where the cycle’s km/L came from', () => {
  it('reads a normal value', () => {
    expect(fullBasisText('SLIP')).toBe('from slips');
    expect(fullBasisText('REGISTER_MAIN')).toBe('from register rows');
  });

  it('is null when the field is null', () => {
    expect(fullBasisText(null)).toBeNull();
  });

  it('is null when the field is absent, as on the old backend', () => {
    expect(fullBasisText(undefined)).toBeNull();
  });
});

describe('what the km gap was judged against', () => {
  it('names the truck’s own model', () => {
    expect(toleranceScopeText({ scope: 'MODEL', modelKey: 'LPT 4830' })).toBe(
      'compared with other LPT 4830 trucks',
    );
    expect(toleranceScopeText({ scope: 'POOLED_MODEL', modelKey: 'LPT 4830' })).toBe(
      'compared with other LPT 4830 trucks',
    );
  });

  it('says so when the limit was the org’s own', () => {
    expect(toleranceScopeText({ scope: 'ORG', modelKey: null })).toBe(
      "compared with your organisation's trucks",
    );
    expect(toleranceScopeText({ scope: 'POOLED_ORG', modelKey: null })).toBe(
      'compared with trucks from other organisations',
    );
  });

  it('is null when the server sent no tolerance, as on the old backend', () => {
    expect(toleranceScopeText(null)).toBeNull();
    expect(toleranceScopeText(undefined)).toBeNull();
    expect(toleranceScopeText({})).toBeNull();
  });

  it('is null when the scope has no model to name', () => {
    expect(toleranceScopeText({ scope: 'MODEL', modelKey: null })).toBeNull();
  });
});
