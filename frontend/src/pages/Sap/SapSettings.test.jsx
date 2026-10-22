import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, it, expect, beforeEach } from 'vitest';
import SapSettings from './SapSettings';
import SapService from '../../services/SapService';
import { getUserRole } from '../../utils/session';
vi.mock('../../utils/session', () => ({ getUserRole: vi.fn() }));
vi.mock('../../services/SapService', () => ({
  default: { settings: vi.fn(), saveSettings: vi.fn(), importSheet: vi.fn() },
}));
beforeEach(() => {
  vi.clearAllMocks();
  getUserRole.mockReturnValue('OWNER');
  SapService.settings.mockResolvedValue({
    tolerancePct: 10,
    multiValuePolicy: 'NEAREST',
    minKmForVerdict: 10,
  });
  SapService.saveSettings.mockResolvedValue({});
  SapService.importSheet.mockResolvedValue({
    rows: 1,
    lanes: 1,
    written: 1,
    skipped: [{ line: 3, reason: 'Missing SAP' }],
    rejectedNumericLabels: [],
    possibleDuplicates: [],
  });
});
const file = (csv = 'FROM,TO,SAP\nOCL,TOWN,280') =>
  Object.assign(new File([csv], 'sheet.csv', { type: 'text/csv' }), { text: async () => csv });
it('requires preview before committing the exact reviewed CSV', async () => {
  render(<SapSettings />);
  await screen.findByText('Comparison settings');
  expect(screen.queryByRole('button', { name: 'Confirm import' })).toBeNull();
  fireEvent.change(screen.getByLabelText('Sheet file'), { target: { files: [file()] } });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Preview import' })).not.toBeDisabled(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Preview import' }));
  const confirm = await screen.findByRole('button', { name: 'Confirm import' });
  expect(SapService.importSheet.mock.calls[0][0]).toEqual({
    csv: 'FROM,TO,SAP\nOCL,TOWN,280',
    dryRun: true,
  });
  expect(screen.getByText(/Missing SAP/)).toBeTruthy();
  fireEvent.click(confirm);
  await waitFor(() =>
    expect(SapService.importSheet.mock.calls[1][0]).toEqual({
      csv: 'FROM,TO,SAP\nOCL,TOWN,280',
      dryRun: false,
    }),
  );
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Confirm import' })).toBeNull());
});
it('invalidates a preview when another file is selected', async () => {
  render(<SapSettings />);
  await screen.findByText('Comparison settings');
  fireEvent.change(screen.getByLabelText('Sheet file'), { target: { files: [file()] } });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Preview import' })).not.toBeDisabled(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Preview import' }));
  await screen.findByRole('button', { name: 'Confirm import' });
  fireEvent.change(screen.getByLabelText('Sheet file'), {
    target: { files: [file('FROM,TO,SAP\nA,B,100')] },
  });
  expect(screen.queryByRole('button', { name: 'Confirm import' })).toBeNull();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Preview import' })).not.toBeDisabled(),
  );
});
it('saves numeric settings and the chosen multi-value policy', async () => {
  render(<SapSettings />);
  const input = await screen.findByLabelText('Tolerance (%)');
  fireEvent.change(input, { target: { value: '15' } });
  fireEvent.change(screen.getByLabelText('Several SAP values'), { target: { value: 'MAX' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));
  await waitFor(() =>
    expect(SapService.saveSettings).toHaveBeenCalledWith(
      { tolerancePct: 15, multiValuePolicy: 'MAX', minKmForVerdict: 10 },
      expect.anything(),
    ),
  );
});
it('hides import and save controls from other roles', async () => {
  getUserRole.mockReturnValue('USER');
  render(<SapSettings />);
  await screen.findByText('Comparison settings');
  expect(screen.queryByLabelText('Sheet file')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Save settings' })).toBeNull();
});
