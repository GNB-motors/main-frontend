import { describe, it, expect } from 'vitest';
import {
  emptyCnRow,
  cnLineTotal,
  draftForBill,
  toCnAllocations,
  allocationState,
  unadjustedTotal,
} from './receiptAllocation';

const bill = (outstandingAmount, cns) => ({ billId: 'b1', outstandingAmount, cns });

describe('cnLineTotal', () => {
  it('is zero for an empty row', () => {
    expect(cnLineTotal(emptyCnRow())).toBe(0);
  });

  it('adds cash received and every deduction', () => {
    expect(
      cnLineTotal({
        amountReceived: 90000,
        detentionDeducted: 2500,
        shortageDeducted: 6000,
        othersDeducted: 1500,
      }),
    ).toBe(100000);
  });

  it('reads string input and treats blanks / junk as zero', () => {
    expect(
      cnLineTotal({
        amountReceived: '1500.50',
        detentionDeducted: '',
        shortageDeducted: 'abc',
        othersDeducted: undefined,
      }),
    ).toBe(1500.5);
  });
});

describe('draftForBill', () => {
  it('prefills each CN with its recorded detention and shortage', () => {
    const draft = draftForBill(
      bill(0, [{ cnId: 'c1', detentionAmount: 1200, shortageAmount: 300 }, { cnId: 'c2' }]),
    );
    expect(draft.c1).toEqual({ ...emptyCnRow(), detentionDeducted: 1200, shortageDeducted: 300 });
    expect(draft.c2).toEqual(emptyCnRow());
  });

  it('is empty for a bill with no CNs', () => {
    expect(draftForBill({ billId: 'b1' })).toEqual({});
  });
});

describe('toCnAllocations', () => {
  it('sends numbers for every amount and keeps label / remarks', () => {
    const b = bill(5000, [{ cnId: 'c1' }, { cnId: 'c2' }]);
    const payload = toCnAllocations(b, {
      c1: { ...emptyCnRow(), amountReceived: '4000', othersDeducted: '250', othersLabel: 'Toll' },
    });
    expect(payload).toEqual([
      {
        cnId: 'c1',
        amountReceived: 4000,
        detentionDeducted: 0,
        shortageDeducted: 0,
        othersDeducted: 250,
        othersLabel: 'Toll',
        remarks: '',
      },
      {
        cnId: 'c2',
        amountReceived: 0,
        detentionDeducted: 0,
        shortageDeducted: 0,
        othersDeducted: 0,
      },
    ]);
  });
});

describe('allocationState', () => {
  it('allows a partial payment and reports what is left on the receipt', () => {
    const s = allocationState({
      voucherUnadjusted: 50000,
      bill: bill(80000, [{ cnId: 'c1' }]),
      cnDraft: { c1: { ...emptyCnRow(), amountReceived: '30000' } },
    });
    expect(s).toEqual({
      allocatingForBill: 30000,
      remaining: 20000,
      overBill: false,
      overVoucher: false,
      canPost: true,
    });
  });

  it('allows settling the bill and the receipt exactly', () => {
    const s = allocationState({
      voucherUnadjusted: 100000,
      bill: bill(100000, [{ cnId: 'c1' }, { cnId: 'c2' }]),
      cnDraft: {
        c1: { ...emptyCnRow(), amountReceived: 60000 },
        c2: { ...emptyCnRow(), amountReceived: 35000, shortageDeducted: 5000 },
      },
    });
    expect(s.allocatingForBill).toBe(100000);
    expect(s.remaining).toBe(0);
    expect(s.canPost).toBe(true);
  });

  it('blocks allocating more than the bill owes', () => {
    const s = allocationState({
      voucherUnadjusted: 200000,
      bill: bill(100000, [{ cnId: 'c1' }]),
      cnDraft: { c1: { ...emptyCnRow(), amountReceived: 100000.01 } },
    });
    expect(s.overBill).toBe(true);
    expect(s.canPost).toBe(false);
  });

  // The server charges deductions against the voucher too (totalAllocated vs
  // unadjustedAmount), so a deduction can push the receipt over.
  it('blocks when cash plus deductions exceed the receipt', () => {
    const s = allocationState({
      voucherUnadjusted: 90000,
      bill: bill(100000, [{ cnId: 'c1' }]),
      cnDraft: { c1: { ...emptyCnRow(), amountReceived: 90000, shortageDeducted: 10000 } },
    });
    expect(s.remaining).toBe(-10000);
    expect(s.overVoucher).toBe(true);
    expect(s.canPost).toBe(false);
  });

  it('tolerates floating-point noise at the boundary', () => {
    const s = allocationState({
      voucherUnadjusted: 0.3,
      bill: bill(0.3, [{ cnId: 'c1' }, { cnId: 'c2' }]),
      cnDraft: {
        c1: { ...emptyCnRow(), amountReceived: 0.1 },
        c2: { ...emptyCnRow(), amountReceived: 0.2 },
      },
    });
    expect(s.overBill).toBe(false);
    expect(s.overVoucher).toBe(false);
    expect(s.canPost).toBe(true);
  });

  it('cannot post nothing', () => {
    const s = allocationState({
      voucherUnadjusted: 5000,
      bill: bill(5000, [{ cnId: 'c1' }]),
      cnDraft: {},
    });
    expect(s.allocatingForBill).toBe(0);
    expect(s.canPost).toBe(false);
  });

  it('with no bill selected, nothing is allocated and the whole receipt remains', () => {
    expect(allocationState({ voucherUnadjusted: 7000 })).toEqual({
      allocatingForBill: 0,
      remaining: 7000,
      overBill: false,
      overVoucher: false,
      canPost: false,
    });
  });

  it('keeps large sums exact', () => {
    const s = allocationState({
      voucherUnadjusted: 98765432.1,
      bill: bill(98765432.1, [{ cnId: 'c1' }]),
      cnDraft: { c1: { ...emptyCnRow(), amountReceived: '98765432.10' } },
    });
    expect(s.remaining).toBe(0);
    expect(s.canPost).toBe(true);
  });
});

describe('unadjustedTotal', () => {
  it('sums the queue and skips missing amounts', () => {
    expect(unadjustedTotal([{ unadjustedAmount: 1000 }, { unadjustedAmount: 2500.5 }, {}])).toBe(
      3500.5,
    );
  });

  it('is zero for an empty queue', () => {
    expect(unadjustedTotal([])).toBe(0);
  });
});
