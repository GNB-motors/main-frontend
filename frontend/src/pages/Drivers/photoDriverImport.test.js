import { describe, it, expect } from 'vitest';
import { defaultDecision, driverRowView, resolveItems, splitFiles } from './photoDriverImport';

describe('photo driver import', () => {
  it('splits photos from spreadsheets', () => {
    const { photos, sheets } = splitFiles([
      new File(['a'], 'register.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'drivers.xlsx'),
      new File(['c'], 'licence.png', { type: 'image/png' }),
    ]);
    expect(photos.map((f) => f.name)).toEqual(['register.jpg', 'licence.png']);
    expect(sheets.map((f) => f.name)).toEqual(['drivers.xlsx']);
  });

  it('keeps the reader out of sight: no scores, no checksums, no identity digits', () => {
    const view = driverRowView({
      key: 'k1',
      nameRead: 'Asha Roy',
      phone: '9876543210',
      licenceNumber: 'DL-12',
      photoCount: 2,
      docs: [{ type: 'aadhaar', number: '1234 5678 9012' }],
      checksum: 'ab12',
      confidence: 0.91,
      match: {
        status: 'likely',
        candidates: [{ userId: 'u1', name: 'Asha Roy', phone: '9876543210', score: 0.94 }],
      },
    });
    expect(view.status).toBe('likely');
    expect(view.candidates[0]).toEqual({
      userId: 'u1',
      name: 'Asha Roy',
      phone: '9876543210',
      reason: '',
    });
    expect(JSON.stringify(view)).not.toContain('1234 5678 9012');
    expect(JSON.stringify(view)).not.toContain('ab12');
    expect(JSON.stringify(view)).not.toContain('0.94');
  });

  it('suggests using an existing driver and creating a new one', () => {
    const existing = driverRowView({ key: 'k1', match: { status: 'existing', userId: 'u9' } });
    expect(defaultDecision(existing)).toEqual({ action: 'use', userId: 'u9', name: '' });
    const fresh = driverRowView({ key: 'k2', nameRead: 'New Person', match: { status: 'new' } });
    expect(defaultDecision(fresh)).toEqual({ action: 'create', userId: '', name: 'New Person' });
  });

  it('builds the resolve body from the owner decisions', () => {
    const views = [
      driverRowView({ key: 'k1', nameRead: 'Asha', match: { status: 'existing', userId: 'u1' } }),
      driverRowView({ key: 'k2', nameRead: 'Ram', match: { status: 'likely', candidates: [] } }),
    ];
    const items = resolveItems(views, {
      k1: { action: 'use', userId: 'u1', name: 'Asha' },
      k2: { action: 'create', userId: '', name: 'Ram Das' },
    });
    expect(items).toEqual([
      { key: 'k1', action: 'use', userId: 'u1' },
      { key: 'k2', action: 'create', name: 'Ram Das' },
    ]);
  });
});
