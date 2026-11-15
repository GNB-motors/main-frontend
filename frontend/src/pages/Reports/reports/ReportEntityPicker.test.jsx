import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ReportEntityPicker from './ReportEntityPicker';

const props = {
  label: 'Vehicle',
  value: 'all',
  allLabel: 'All vehicles',
  searchPlaceholder: 'Search vehicle number',
};
describe('shared searchable report picker', () => {
  it('fetches on open and preserves the chosen entity data', async () => {
    const vehicle = { id: 'v1', label: 'WB11T0662', sub: 'Tata' };
    const fetchOptions = vi.fn().mockResolvedValue([vehicle]);
    const onChange = vi.fn();
    render(<ReportEntityPicker {...props} fetchOptions={fetchOptions} onChange={onChange} />);
    expect(fetchOptions).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Vehicle: All vehicles' }));
    fireEvent.click(await screen.findByRole('option', { name: /WB11T0662/ }));
    expect(onChange).toHaveBeenCalledWith('v1', vehicle);
    expect(
      screen.queryByRole('textbox', { name: 'Search vehicle number' }),
    ).not.toBeInTheDocument();
  });
  it('uses server search and ignores the response for an earlier query', async () => {
    let finishOld;
    const fetchOptions = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishOld = resolve;
          }),
      )
      .mockResolvedValue([{ id: 'v2', label: 'WB11S1962' }]);
    render(<ReportEntityPicker {...props} fetchOptions={fetchOptions} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Vehicle: All vehicles' }));
    await waitFor(() => expect(fetchOptions).toHaveBeenCalledOnce());
    const oldSignal = fetchOptions.mock.calls[0][1];
    fireEvent.change(screen.getByRole('textbox', { name: 'Search vehicle number' }), {
      target: { value: '1962' },
    });
    expect(await screen.findByRole('option', { name: 'WB11S1962' })).toBeInTheDocument();
    expect(fetchOptions).toHaveBeenLastCalledWith('1962', expect.any(AbortSignal));
    expect(oldSignal.aborted).toBe(true);
    await act(async () => finishOld([{ id: 'v1', label: 'Old truck' }]));
    expect(screen.queryByRole('option', { name: 'Old truck' })).not.toBeInTheDocument();
  });
  it('shows a failed lookup and keeps the clear-filter choice available', async () => {
    const onChange = vi.fn();
    render(
      <ReportEntityPicker
        {...props}
        fetchOptions={vi.fn().mockRejectedValue(new Error('offline'))}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Vehicle: All vehicles' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the list.');
    fireEvent.click(screen.getByRole('option', { name: 'All vehicles' }));
    expect(onChange).toHaveBeenCalledWith('all', null);
  });
});
