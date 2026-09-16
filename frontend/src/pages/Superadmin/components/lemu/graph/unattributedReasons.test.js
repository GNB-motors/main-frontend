import { describe, it, expect } from 'vitest';
import { formatUnattributed } from './unattributedReasons';

describe('formatUnattributed', () => {
  it('reads like the H9 banner line: total plus per-reason counts', () => {
    expect(
      formatUnattributed({
        count: 67,
        reasons: { 'no stack': 41, 'outside manifest': 19, 'missing sourcemap': 7 },
      }),
    ).toBe('67 unattributed: 41 no stack, 19 outside manifest, 7 missing sourcemap');
  });

  it('orders known reasons deterministically, unknown reasons after, sorted', () => {
    expect(
      formatUnattributed({
        reasons: {
          'missing sourcemap': 2,
          'node_modules frame': 1,
          'no stack': 9,
          'zz new class': 3,
          'aa new class': 4,
        },
      }),
    ).toBe(
      '19 unattributed: 9 no stack, 1 node_modules frame, 2 missing sourcemap, 4 aa new class, 3 zz new class',
    );
  });

  it('derives the total from the map, not the passed count', () => {
    expect(formatUnattributed({ count: 99, reasons: { 'no stack': 3 } })).toBe(
      '3 unattributed: 3 no stack',
    );
  });

  it('falls back to the bare-count sentence when the backend has no reasons map', () => {
    expect(formatUnattributed({ count: 5 })).toBe('5 errors could not be attributed');
    expect(formatUnattributed({ count: 1 })).toBe('1 error could not be attributed');
    expect(formatUnattributed({})).toBe('0 errors could not be attributed');
  });

  it('falls back when the map is empty', () => {
    expect(formatUnattributed({ count: 2, reasons: {} })).toBe('2 errors could not be attributed');
  });
});
