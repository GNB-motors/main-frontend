import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BasicInformationForm from './BasicInformationForm';

vi.mock('../../../contexts/BranchContext', () => ({ useActiveBranch: () => ({ branchId: null }) }));
vi.mock('./AssignedVehicleField.jsx', () => ({ default: () => null }));

it('marks new employee credentials as separate from the signed-in owner login', () => {
  render(<BasicInformationForm onSubmit={() => {}} />);
  const email = screen.getByRole('textbox', { name: 'Email', exact: true });
  expect(email.closest('form')).toHaveAttribute('autocomplete', 'off');
  expect(email).toHaveAttribute('autocomplete', 'off');
  expect(email).toHaveValue('');
  expect(screen.getByLabelText('Password', { exact: true })).toHaveAttribute(
    'autocomplete',
    'new-password',
  );
  expect(screen.getByLabelText('Password', { exact: true })).toHaveValue('');
});
