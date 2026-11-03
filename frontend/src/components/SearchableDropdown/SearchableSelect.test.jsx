import { useState } from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import SearchableSelect from './SearchableSelect';
afterEach(cleanup);
function Form({ onChange = () => {} }) {
  const [value, setValue] = useState('');
  return (
    <form aria-label="Example form">
      <label htmlFor="vehicle-choice">Vehicle</label>
      <SearchableSelect
        id="vehicle-choice"
        name="vehicleId"
        required
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          onChange(event);
        }}
      >
        <option value="" disabled>
          Choose vehicle
        </option>
        <optgroup label="Fleet">
          <option value="v1">Tata Prima</option>
          <option value="v2" disabled>
            Unavailable truck
          </option>
          <option value="v3">Ashok Leyland</option>
        </optgroup>
      </SearchableSelect>
    </form>
  );
}
it('searches grouped options and preserves actual form values and change events', async () => {
  const change = vi.fn();
  render(<Form onChange={change} />);
  fireEvent.click(screen.getByRole('combobox', { name: 'Vehicle' }));
  const search = await screen.findByRole('textbox', { name: 'Search options' });
  fireEvent.change(search, { target: { value: 'leyland' } });
  expect(screen.queryByRole('option', { name: 'Tata Prima' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('option', { name: 'Ashok Leyland' }));
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Vehicle' })).toHaveTextContent('Ashok Leyland'),
  );
  expect(change).toHaveBeenCalledOnce();
  expect(new FormData(screen.getByRole('form')).get('vehicleId')).toBe('v3');
});
it('supports keyboard selection, Escape, disabled choices and focus return', async () => {
  render(<Form />);
  const trigger = screen.getByRole('combobox', { name: 'Vehicle' });
  fireEvent.click(trigger);
  const search = await screen.findByRole('textbox', { name: 'Search options' });
  expect(screen.getByRole('option', { name: 'Unavailable truck' })).toBeDisabled();
  fireEvent.change(search, { target: { value: 'tata' } });
  fireEvent.keyDown(search, { key: 'ArrowDown' });
  fireEvent.keyDown(search, { key: 'Enter' });
  await waitFor(() => expect(trigger).toHaveTextContent('Tata Prima'));
  fireEvent.click(trigger);
  fireEvent.keyDown(await screen.findByRole('textbox', { name: 'Search options' }), {
    key: 'Escape',
  });
  await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
});
it('keeps required validation and disables both native form field and visible trigger', async () => {
  const { rerender } = render(<Form />);
  const form = screen.getByRole('form');
  expect(form.checkValidity()).toBe(false);
  rerender(
    <>
      <label htmlFor="off">Disabled picker</label>
      <SearchableSelect id="off" disabled value="v1" onChange={() => {}}>
        <option value="v1">Tata</option>
      </SearchableSelect>
    </>,
  );
  expect(screen.getByRole('combobox', { name: 'Disabled picker' })).toBeDisabled();
  fireEvent.click(screen.getByRole('combobox', { name: 'Disabled picker' }));
  expect(screen.queryByRole('textbox', { name: 'Search options' })).not.toBeInTheDocument();
});
