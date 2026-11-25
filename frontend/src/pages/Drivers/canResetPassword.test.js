import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { canResetRow } from './canResetPassword';
import { useDriverColumns } from './useDriverColumns.jsx';

describe('canResetRow', () => {
  it('spec 4: an owner may reset drivers, managers and the other staff rows', () => {
    ['DRIVER', 'MANAGER', 'FIELD_AGENT', 'KAM', 'OPS_EXECUTIVE', 'ACCOUNTS', 'APPROVER'].forEach(
      (role) => {
        expect(canResetRow('OWNER', { id: 'u1', role }, {}, 'me')).toBe(true);
      },
    );
  });

  it('spec 4: an owner never gets a button on an owner row', () => {
    expect(canResetRow('OWNER', { id: 'u1', role: 'OWNER' }, {}, 'me')).toBe(false);
  });

  it('review 4: the role is the truth — a DRIVER row is a driver row', () => {
    // normalizeDriver keeps the role of the account; an owner row carries the
    // role OWNER, so the button follows the role and nothing else.
    expect(canResetRow('OWNER', { id: 'u1', role: 'DRIVER', isOwner: true }, {}, 'me')).toBe(true);
  });

  it('spec 4: a manager may reset driver rows only', () => {
    expect(canResetRow('MANAGER', { id: 'u1', role: 'DRIVER' }, { drivers: true }, 'me')).toBe(true);
    expect(canResetRow('MANAGER', { id: 'u1', role: 'MANAGER' }, { drivers: true }, 'me')).toBe(
      false,
    );
    expect(canResetRow('MANAGER', { id: 'u1', role: 'KAM' }, { drivers: true }, 'me')).toBe(false);
  });

  it('spec 4/D4: a manager without the drivers permission gets no button', () => {
    expect(canResetRow('MANAGER', { id: 'u1', role: 'DRIVER' }, {}, 'me')).toBe(false);
    expect(canResetRow('MANAGER', { id: 'u1', role: 'DRIVER' }, undefined, 'me')).toBe(false);
    expect(canResetRow('MANAGER', { id: 'u1', role: 'DRIVER' }, { drivers: false }, 'me')).toBe(false);
  });

  it('spec 4/D3: a row without a role gets no button', () => {
    expect(canResetRow('OWNER', { id: 'u1' }, {}, 'me')).toBe(false);
    expect(canResetRow('OWNER', { id: 'u1', role: '' }, {}, 'me')).toBe(false);
  });

  it('review 4: a row with unknown data gets no button', () => {
    expect(canResetRow('OWNER', {}, {}, 'me')).toBe(false);
    expect(canResetRow('OWNER', { id: 'u1', role: null }, {}, 'me')).toBe(false);
    expect(canResetRow('SUPER_ADMIN', { id: 'u1', role: undefined }, {}, 'me')).toBe(false);
    expect(canResetRow('MANAGER', { id: 'u1' }, { drivers: true }, 'me')).toBe(false);
    expect(canResetRow('OWNER', null, {}, 'me')).toBe(false);
  });

  it('review 4: an owner row is refused for every viewer', () => {
    ['OWNER', 'SUPER_ADMIN', 'MANAGER'].forEach((viewer) => {
      expect(canResetRow(viewer, { id: 'u1', role: 'OWNER' }, { drivers: true }, 'me')).toBe(false);
    });
  });

  it('review 4: a superadmin row is refused as well', () => {
    expect(canResetRow('SUPER_ADMIN', { id: 'u1', role: 'SUPER_ADMIN' }, {}, 'me')).toBe(false);
    expect(canResetRow('OWNER', { id: 'u1', role: 'SUPER_ADMIN' }, {}, 'me')).toBe(false);
  });

  it('spec 4/D5: the viewer never gets a button on their own row', () => {
    expect(canResetRow('OWNER', { id: 'me', role: 'DRIVER' }, {}, 'me')).toBe(false);
    expect(canResetRow('OWNER', { id: 'other', role: 'DRIVER' }, {}, 'me')).toBe(true);
  });

  it('review 4: an unknown viewer gets no button at all', () => {
    expect(canResetRow('OWNER', { id: 'u1', role: 'DRIVER' }, {}, null)).toBe(false);
    expect(canResetRow('OWNER', { id: 'u1', role: 'DRIVER' }, {}, undefined)).toBe(false);
    expect(canResetRow('OWNER', { id: 'u1', role: 'DRIVER' }, {}, '')).toBe(false);
  });

  it('review 4: a row without an id gets no button at all', () => {
    expect(canResetRow('OWNER', { role: 'DRIVER' }, {}, 'me')).toBe(false);
    expect(canResetRow('OWNER', { id: null, role: 'DRIVER' }, {}, 'me')).toBe(false);
    expect(canResetRow('OWNER', { id: '', role: 'DRIVER' }, {}, 'me')).toBe(false);
  });

  it('spec 4: any other viewer gets no button at all', () => {
    expect(canResetRow('DRIVER', { id: 'u1', role: 'DRIVER' }, { drivers: true }, 'me')).toBe(false);
    expect(canResetRow('KAM', { id: 'u1', role: 'DRIVER' }, { drivers: true }, 'me')).toBe(false);
    expect(canResetRow(undefined, { id: 'u1', role: 'DRIVER' }, {}, 'me')).toBe(false);
  });
});

// The key button itself: it must be there for an eligible row — also when the
// employee is deactivated (a password still has to be reset then).
function ActionsCell({ driver, viewerRole = 'OWNER' }) {
  const columns = useDriverColumns({
    onEdit: () => {},
    onDelete: () => {},
    onActivateHere: () => {},
    onResetPassword: () => {},
    canReset: (row) => canResetRow(viewerRole, row, { drivers: true }, 'me'),
    getInitials: () => 'A',
    formatRole: (role) => role,
  });
  const actions = columns.find((column) => column.key === 'actions');
  return actions.render(driver);
}

describe('the reset key on the Employees page', () => {
  it('review 4: an eligible row gets the key', () => {
    render(React.createElement(ActionsCell, { driver: { id: 'u9', role: 'DRIVER' } }));

    expect(screen.getByTitle('Reset password')).toBeInTheDocument();
  });

  it('review 4: a deactivated employee keeps the key', () => {
    render(
      React.createElement(ActionsCell, {
        driver: { id: 'u9', role: 'DRIVER', branchStatus: 'DEACTIVATED' },
      }),
    );

    expect(screen.getByTitle('Reset password')).toBeInTheDocument();
    expect(screen.getByTitle('Mark as active')).toBeInTheDocument();
  });

  it('review 4: a row that may not be reset has no key', () => {
    render(React.createElement(ActionsCell, { driver: { id: 'u9' } }));

    expect(screen.queryByTitle('Reset password')).not.toBeInTheDocument();
  });
});
