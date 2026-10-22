import { describe, it, expect, vi } from 'vitest';
import React, { createRef } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import VehicleBasicInformationForm from './VehicleBasicInformationForm.jsx';
vi.mock('../../../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ isEnabled: () => false }),
}));
const initialData = {};
function fillIdentity() {
  fireEvent.change(screen.getByLabelText('Registration number'), {
    target: { value: 'wb11f1234' },
  });
  fireEvent.change(screen.getByLabelText('Chassis / VIN'), {
    target: { value: 'mat12345678912345' },
  });
  fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'Signa 2823.K' } });
}
describe('vehicle identity form', () => {
  it('blocks missing fields through native submission and saves canonical manufacturer', () => {
    const submit = vi.fn();
    const form = createRef();
    render(<VehicleBasicInformationForm ref={form} initialData={initialData} onSubmit={submit} />);
    act(() => form.current.requestSubmit());
    expect(submit).not.toHaveBeenCalled();
    fillIdentity();
    act(() => form.current.requestSubmit());
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('radio', { name: 'Tata' }));
    act(() => form.current.requestSubmit());
    expect(submit).toHaveBeenCalledWith({
      registration_no: 'WB11F1234',
      chassis_number: 'MAT12345678912345',
      model: 'Signa 2823.K',
      manufacturer: 'TATA',
    });
  });
  it('prefills edit manufacturer and supports more makes without changing model', () => {
    render(
      <VehicleBasicInformationForm
        initialData={{ manufacturer: 'ASHOK LEYLAND', model: 'AVTR' }}
        manufacturers={[{ value: 'VOLVO', label: 'Volvo' }]}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Ashok Leyland' })).toBeChecked();
    fireEvent.change(screen.getByLabelText('More manufacturers'), { target: { value: 'VOLVO' } });
    expect(screen.getByRole('radio', { name: 'Ashok Leyland' })).not.toBeChecked();
    expect(screen.getByLabelText('Model')).toHaveValue('AVTR');
  });
});
