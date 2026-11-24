import { describe, it, expect, vi } from 'vitest';
import React, { createRef } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import VehicleBasicInformationForm from './VehicleBasicInformationForm.jsx';
vi.mock('../../../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ isEnabled: () => false }),
}));
const initialData = {};
const manufacturers = [
  { value: 'TATA', label: 'Tata' },
  { value: 'ASHOK LEYLAND', label: 'Ashok Leyland' },
];
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
    render(
      <VehicleBasicInformationForm
        ref={form}
        initialData={initialData}
        manufacturers={manufacturers}
        onSubmit={submit}
      />,
    );
    act(() => form.current.requestSubmit());
    expect(submit).not.toHaveBeenCalled();
    fillIdentity();
    act(() => form.current.requestSubmit());
    expect(submit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('combobox', { name: 'Manufacturer' }), {
      target: { value: 'TATA' },
    });
    act(() => form.current.requestSubmit());
    expect(submit).toHaveBeenCalledWith({
      registration_no: 'WB11F1234',
      chassis_number: 'MAT12345678912345',
      model: 'Signa 2823.K',
      manufacturer: 'TATA',
    });
  });
  it('renders backend choices and switches manufacturer without changing the model', () => {
    render(
      <VehicleBasicInformationForm
        initialData={{ manufacturer: 'ASHOK LEYLAND', model: 'AVTR' }}
        manufacturers={manufacturers}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByRole('combobox', { name: 'Manufacturer' })).toHaveValue('ASHOK LEYLAND');
    expect(screen.getByRole('combobox', { name: 'Manufacturer' }).options).toHaveLength(3);
    expect(screen.queryByLabelText('More manufacturers')).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Manufacturer' }), {
      target: { value: 'TATA' },
    });
    expect(screen.getByRole('combobox', { name: 'Manufacturer' })).not.toHaveValue('ASHOK LEYLAND');
    expect(screen.getByLabelText('Model')).toHaveValue('AVTR');
  });
  it('has no hardcoded choices before backend metadata loads', () => {
    const submit = vi.fn();
    const form = createRef();
    render(<VehicleBasicInformationForm ref={form} metadataLoading onSubmit={submit} />);
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent('Loading manufacturers');
    fillIdentity();
    act(() => form.current.requestSubmit());
    expect(submit).not.toHaveBeenCalled();
  });
  it('preserves a historical manufacturer on edit without offering it as a choice', () => {
    const submit = vi.fn();
    const form = createRef();
    render(
      <VehicleBasicInformationForm
        ref={form}
        isEdit
        initialData={{
          manufacturer: 'VOLVO',
          registration_no: 'WB11F1234',
          chassis_number: 'MAT12345678912345',
          model: 'FM',
        }}
        manufacturers={manufacturers}
        onSubmit={submit}
      />,
    );
    expect(screen.getByText(/Current manufacturer: VOLVO/)).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Volvo' })).not.toBeInTheDocument();
    act(() => form.current.requestSubmit());
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ manufacturer: 'VOLVO' }));
  });
});

it('offers additional catalog makes and Other through one dropdown', () => {
  render(
    <VehicleBasicInformationForm
      initialData={{ manufacturer: 'UNKNOWN' }}
      manufacturers={[
        ...manufacturers,
        { value: 'EICHER', label: 'Eicher' },
        { value: 'VOLVO', label: 'Volvo' },
        { value: 'UNKNOWN', label: 'Other' },
      ]}
      onSubmit={vi.fn()}
    />,
  );
  expect(screen.getByRole('combobox', { name: 'Manufacturer' })).toHaveValue('UNKNOWN');
  fireEvent.change(screen.getByRole('combobox', { name: 'Manufacturer' }), {
    target: { value: 'EICHER' },
  });
  expect(screen.getByRole('combobox', { name: 'Manufacturer' })).toHaveValue('EICHER');
  expect(screen.getByRole('option', { name: 'Volvo' })).toBeInTheDocument();
});
