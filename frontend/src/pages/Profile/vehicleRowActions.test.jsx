import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useVehicleColumns } from './useVehicleColumns';
it('keeps deletion inside More actions and delegates to the existing confirmation flow', () => {
  const edit = vi.fn(),
    remove = vi.fn();
  function Actions() {
    const columns = useVehicleColumns({ onEdit: edit, onDelete: remove, accountMap: {} });
    return columns
      .find((column) => column.key === 'actions')
      .render({ id: 'v1', registration_no: 'WB11T0662' });
  }
  render(
    <MemoryRouter>
      <Actions />
    </MemoryRouter>,
  );
  expect(screen.queryByTitle('Delete vehicle')).not.toBeInTheDocument();
  expect(
    screen.getByLabelText('More actions for WB11T0662').closest('details'),
  ).not.toHaveAttribute('open');
  fireEvent.click(screen.getByLabelText('More actions for WB11T0662'));
  fireEvent.click(screen.getByRole('button', { name: 'Delete vehicle…' }));
  expect(remove).toHaveBeenCalledWith(expect.objectContaining({ id: 'v1' }));
  expect(edit).not.toHaveBeenCalled();
});
