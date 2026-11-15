import { describe, expect, it } from 'vitest';
import {
  certaintyOf,
  chosenPlate,
  confirmedTruckText,
  hasUnsavedOfficeChanges,
  identity,
  isMarketTruck,
  matchStatus,
  officeCandidates,
  officeRow,
  photoIndex,
} from './officeBill';

const CAPTURE = {
  id: 'cap-1',
  status: 'pending',
  thumbnailUrl: '/api/fleet-view/bills/cap-1/pages/0',
  uploadedBy: { name: 'Asha', role: 'OWNER' },
  ocr: { litres: 180, amount: 4500, printedDate: '2026-11-01', pump: 'HP Pump 3' },
};

describe('the office bill adapter', () => {
  it('reads the bill of a capture into the words the table shows', () => {
    const row = officeRow(CAPTURE);
    expect(row.litres).toBe('180 L');
    expect(row.amount).toBe('₹4,500');
    expect(row.pump).toBe('HP Pump 3');
    expect(row.date).toBe('1 Nov 2026');
    expect(row.uploader).toBe('Asha · Owner');
    expect(row.status).toBe('Needs review');
  });

  it('says that a confirmed bill is confirmed, and a bill with no state is nothing yet', () => {
    expect(matchStatus({ ...CAPTURE, link: { registrationNumber: 'A' } })).toBe('Confirmed');
    expect(matchStatus({ id: 'x' })).toBe('-');
    expect(matchStatus(null)).toBe('-');
  });

  it('keeps the chosen plate, the hint and the strong candidate in that order', () => {
    expect(chosenPlate({ link: { registrationNumber: 'A' }, vehicleHint: 'B' })).toBe('A');
    expect(chosenPlate({ vehicleHint: 'B' })).toBe('B');
    expect(
      chosenPlate({
        suggestion: { decision: 'AUTO', candidates: [{ registrationNumber: 'C', score: 1 }] },
      }),
    ).toBe('C');
  });

  it('gives every candidate a certainty word and keeps the reasons', () => {
    const candidates = officeCandidates({
      decision: 'ASK',
      candidates: [
        { registrationNumber: 'A', score: 0.92, reasons: ['the plate on the bill'] },
        { registrationNumber: 'B', score: 0.4, reasons: [] },
      ],
    });
    expect(candidates[0].certainty).toEqual({ kind: 'sure', text: 'Strong match' });
    expect(candidates[0].reasons).toEqual(['the plate on the bill']);
    expect(candidates[1].certainty.kind).toBe('none');
  });

  it('reads a score of ninety two as a strong match', () => {
    expect(certaintyOf(92).kind).toBe('sure');
    expect(certaintyOf(0.6).kind).toBe('guess');
    expect(certaintyOf(undefined).kind).toBe('guess');
  });

  it('knows the market truck case', () => {
    expect(isMarketTruck({ askReason: 'MARKET_TRUCK' })).toBe(true);
    expect(isMarketTruck({ askReason: 'NO_TRUCK_WITH_THESE_DIGITS' })).toBe(true);
    expect(isMarketTruck({ askReason: 'NO_PRINTED_TIME' })).toBe(false);
    expect(isMarketTruck(null)).toBe(false);
  });

  it('reads the page of the photo the server holds', () => {
    expect(photoIndex(CAPTURE)).toBe(0);
    expect(photoIndex({ thumbnailUrl: '/pages/2' })).toBe(2);
    expect(photoIndex({})).toBe(0);
  });

  it('shows the name and the role of a person, never a contact detail', () => {
    expect(identity({ name: 'Ravi', role: 'MANAGER' })).toBe('Ravi · Manager');
    expect(identity({ name: 'Ravi', role: 'MANAGER', phone: '9999999999' })).not.toContain(
      '9999999999',
    );
  });

  it('names the truck of a confirmed bill and the person who confirmed it', () => {
    const row = officeRow({
      ...CAPTURE,
      link: { registrationNumber: 'WB11G0762', by: { name: 'Ravi', role: 'MANAGER' } },
    });
    expect(row.confirmed).toBe(true);
    expect(row.confirmedByName).toBe('Ravi');
    expect(confirmedTruckText(row)).toBe('Truck: WB11G0762 · confirmed by Ravi');
  });

  it('knows when closing the drawer would throw work away', () => {
    const clean = {
      editing: false,
      plate: 'WB11G0762',
      savedPlate: 'WB11G0762',
      reason: '',
      truckChosen: false,
    };
    expect(hasUnsavedOfficeChanges(clean)).toBe(false);
    // A truck picked but not confirmed is work that would be lost.
    expect(hasUnsavedOfficeChanges({ ...clean, truckChosen: true })).toBe(true);
    // A reason typed into the change-truck form is work that would be lost.
    expect(hasUnsavedOfficeChanges({ ...clean, editing: true, reason: 'the other truck' })).toBe(
      true,
    );
    // The same plate written differently is not a change.
    expect(hasUnsavedOfficeChanges({ ...clean, editing: true, plate: 'wb 11 g 0762' })).toBe(false);
    expect(hasUnsavedOfficeChanges({ ...clean, editing: true, plate: 'MH12AB1234' })).toBe(true);
  });
});
