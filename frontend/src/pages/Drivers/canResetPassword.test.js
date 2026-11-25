import { describe, it, expect } from 'vitest';
import { canResetRow } from './canResetPassword';

describe('canResetRow', () => {
  it('spec 4: an owner may reset drivers, managers and the other staff rows', () => {
    ['DRIVER', 'MANAGER', 'FIELD_AGENT', 'KAM', 'OPS_EXECUTIVE', 'ACCOUNTS', 'APPROVER'].forEach(
      (role) => {
        expect(canResetRow('OWNER', { id: 'u1', role })).toBe(true);
      },
    );
  });

  it('spec 4: an owner never gets a button on an owner row', () => {
    expect(canResetRow('OWNER', { id: 'u1', role: 'OWNER' })).toBe(false);
    expect(canResetRow('OWNER', { id: 'u1', role: 'DRIVER', isOwner: true })).toBe(false);
  });

  it('spec 4: a manager may reset driver rows only', () => {
    expect(canResetRow('MANAGER', { id: 'u1', role: 'DRIVER' }, { drivers: true })).toBe(true);
    expect(canResetRow('MANAGER', { id: 'u1', role: 'MANAGER' }, { drivers: true })).toBe(false);
    expect(canResetRow('MANAGER', { id: 'u1', role: 'KAM' }, { drivers: true })).toBe(false);
  });

  it('spec 4/D4: a manager without the drivers permission gets no button', () => {
    expect(canResetRow('MANAGER', { id: 'u1', role: 'DRIVER' }, {})).toBe(false);
    expect(canResetRow('MANAGER', { id: 'u1', role: 'DRIVER' })).toBe(false);
    expect(canResetRow('MANAGER', { id: 'u1', role: 'DRIVER' }, { drivers: false })).toBe(false);
  });

  it('spec 4/D3: a row without a role gets no button', () => {
    expect(canResetRow('OWNER', { id: 'u1' })).toBe(false);
    expect(canResetRow('OWNER', { id: 'u1', role: '' })).toBe(false);
  });

  it('spec 4/D5: the viewer never gets a button on their own row', () => {
    expect(canResetRow('OWNER', { id: 'me', role: 'DRIVER' }, {}, 'me')).toBe(false);
    expect(canResetRow('OWNER', { id: 'other', role: 'DRIVER' }, {}, 'me')).toBe(true);
  });

  it('spec 4: any other viewer gets no button at all', () => {
    expect(canResetRow('DRIVER', { id: 'u1', role: 'DRIVER' }, { drivers: true })).toBe(false);
    expect(canResetRow('KAM', { id: 'u1', role: 'DRIVER' }, { drivers: true })).toBe(false);
    expect(canResetRow(undefined, { id: 'u1', role: 'DRIVER' })).toBe(false);
  });
});
