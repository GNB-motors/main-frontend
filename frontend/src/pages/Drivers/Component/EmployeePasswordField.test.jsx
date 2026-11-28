import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import EmployeePasswordField from './EmployeePasswordField';
import BasicInformationForm from './BasicInformationForm';
import { DriverService } from '../DriverService';

const viewer = vi.hoisted(() => ({ role: 'OWNER', id: 'owner', permissions: {} }));
vi.mock('../../../utils/session.js', () => ({
  getUserRole: () => viewer.role,
  getUserId: () => viewer.id,
}));
vi.mock('../../../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ permissions: viewer.permissions }),
}));
vi.mock('../DriverService', () => ({ DriverService: { resetPassword: vi.fn() } }));
vi.mock('../../../contexts/BranchContext', () => ({ useActiveBranch: () => ({ branchId: null }) }));
vi.mock('./AssignedVehicleField', () => ({ default: () => null }));

const employee = { driverId: 'driver1', role: 'DRIVER', firstName: 'Asha', lastName: 'Rao' };
const onSave = vi.fn();
function Form({ isEdit = false, target = employee }) {
  const [value, onChange] = useState('');
  return (
    <form onSubmit={onSave}>
      <EmployeePasswordField isEdit={isEdit} employee={target} value={value} onChange={onChange} />
    </form>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  viewer.role = 'OWNER';
  viewer.id = 'owner';
  viewer.permissions = {};
  DriverService.resetPassword.mockResolvedValue({ signedOut: true });
});

it('reveals and hides the entered password without submitting or losing the value', () => {
  render(<Form />);
  const input = screen.getByLabelText('Password');
  fireEvent.change(input, { target: { value: 'Example123!' } });
  expect(input).toHaveAttribute('type', 'password');
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(input).toHaveAttribute('type', 'text');
  expect(input).toHaveValue('Example123!');
  fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
  expect(input).toHaveAttribute('type', 'password');
  expect(onSave).not.toHaveBeenCalled();
});

it('includes the eye button in the actual Add employee form', () => {
  render(<BasicInformationForm initialData={{}} onSubmit={onSave} />);
  const input = screen.getByLabelText('Password');
  fireEvent.change(input, { target: { value: 'Example123!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(input).toHaveAttribute('type', 'text');
  expect(input).toHaveValue('Example123!');
  expect(onSave).not.toHaveBeenCalled();
});

it('opens the existing reset flow from edit without submitting the employee form', async () => {
  render(<Form isEdit />);
  fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
  const dialog = screen.getByRole('dialog', { name: 'Reset password' });
  fireEvent.change(within(dialog).getByLabelText('New password'), {
    target: { value: 'Example123!' },
  });
  fireEvent.change(within(dialog).getByLabelText('Type it again'), {
    target: { value: 'Example123!' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Change password' }));
  await waitFor(() =>
    expect(DriverService.resetPassword).toHaveBeenCalledWith(
      'driver1',
      { mode: 'set', password: 'Example123!', signOut: true },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    ),
  );
  expect(onSave).not.toHaveBeenCalled();
});

it.each([
  ['DRIVER', 'owner', 'DRIVER', {}],
  ['OWNER', 'driver1', 'DRIVER', {}],
  ['OWNER', 'owner', 'OWNER', {}],
  ['MANAGER', 'manager', 'DRIVER', {}],
])(
  'keeps reset hidden for ineligible viewers or targets (%s, %s, %s)',
  (role, id, targetRole, permissions) => {
    Object.assign(viewer, { role, id, permissions });
    render(<Form isEdit target={{ ...employee, role: targetRole }} />);
    expect(screen.queryByRole('button', { name: 'Reset password' })).not.toBeInTheDocument();
  },
);
