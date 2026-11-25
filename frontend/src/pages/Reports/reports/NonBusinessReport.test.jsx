import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const captured = vi.hoisted(() => ({ exportProps: null }));

vi.mock('../../../components/ui/ExportButton', () => ({
  default: (props) => {
    captured.exportProps = props;
    return <button type="button">Export</button>;
  },
}));

vi.mock('../ReportsService.js', () => ({
  ReportsService: {
    getNonBusiness: vi.fn(async () => ({
      data: [
        {
          excursionId: 'x1',
          date: '2026-09-02T00:00:00.000Z',
          vehicleNumber: 'WB25W1040',
          status: 'DEVIATION',
          placeKind: 'OFFICE',
          purpose: 'delivery',
          kmExtra: 12,
          kmTotal: 130,
          fuelInr: 900,
          wearInr: 100,
          totalInr: 1000,
          dwellMin: 20,
        },
        {
          excursionId: 'x2',
          date: '2026-09-01T00:00:00.000Z',
          vehicleNumber: 'OD02K5567',
          status: 'APPROVED',
          placeKind: 'DEPOT',
          purpose: 'pickup',
          kmExtra: 5,
          kmTotal: 90,
          fuelInr: 400,
          wearInr: 50,
          totalInr: 450,
          dwellMin: 10,
        },
      ],
      summary: { kmExtra: 17, deviationCostInr: 1000, approvedCostInr: 450 },
    })),
    searchVehicles: vi.fn(async () => []),
    searchDrivers: vi.fn(async () => []),
  },
}));

vi.mock('../../../services/vehicleListService', () => ({
  getVehicleList: vi.fn(async () => []),
}));

vi.mock('../../../services/manufacturerService', () => ({
  getManufacturerCatalog: vi.fn(async () => []),
}));

const NonBusinessReport = (await import('./NonBusinessReport')).default;

const mount = () =>
  render(
    <MemoryRouter>
      <NonBusinessReport />
    </MemoryRouter>,
  );

describe('NonBusinessReport — the report it mails', () => {
  beforeEach(() => {
    captured.exportProps = null;
  });

  it('spec 5: without a search the server builds the file', async () => {
    mount();

    await waitFor(() => expect(captured.exportProps).not.toBeNull());
    const { email } = captured.exportProps;
    expect(email.report).toBe('non-business');
    expect(email.label).toBe('Non-business report');
    expect(email.params.format).toBe('xlsx');
    expect(email.buildFile).toBeUndefined();
  });

  it('spec 5: a searched report is uploaded with the filtered rows only', async () => {
    mount();

    await waitFor(() => expect(captured.exportProps).not.toBeNull());
    fireEvent.change(screen.getByLabelText('Search vehicle, place, purpose'), {
      target: { value: 'WB25' },
    });

    await waitFor(() =>
      expect(captured.exportProps.email.buildFile).toBeTypeOf('function'),
    );
    // The server export cannot apply the search box, so this one is uploaded.
    expect(captured.exportProps.email.report).toBeUndefined();

    const file = await captured.exportProps.email.buildFile();
    expect(file.filename).toMatch(/^non_business_report_\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(file.rows).toBe(1);

    // jsdom's Blob has no arrayBuffer(), so the workbook is read by hand.
    const buffer = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsArrayBuffer(file.blob);
    });
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const cells = Object.values(sheet)
      .map((cell) => cell.v)
      .join(' ');
    expect(cells).toContain('WB25W1040');
    expect(cells).not.toContain('OD02K5567');
  });
});
