import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  FRONTEND_FIELD_CATALOG,
  getFrontendField,
  FRONTEND_FIELD_MAP,
  DATASETS,
  REPORT_TEMPLATES,
} from './customReportFields';
import CustomReportsPage from './CustomReportsPage';
import CustomReportBuilder from './CustomReportBuilder';
import CustomReportDatePicker from './CustomReportDatePicker';
import {
  toYmd,
  toDmy,
  parseDmyInput,
} from './customReportDateUtils';
import { ReportsService } from '../../ReportsService';

describe('Custom Reports Frontend Field Catalog', () => {
  it('loads CustomReportsPage component without import resolution errors', () => {
    expect(typeof CustomReportsPage).toBe('function');
  });

  it('contains valid module definitions for all catalogue fields', () => {
    expect(FRONTEND_FIELD_CATALOG.length).toBeGreaterThan(15);
    const validModules = ['DRIVER', 'VEHICLE', 'FUEL', 'TRIP', 'ADBLUE', 'COMPLIANCE'];
    for (const f of FRONTEND_FIELD_CATALOG) {
      expect(validModules).toContain(f.module);
      expect(typeof f.key).toBe('string');
      expect(typeof f.label).toBe('string');
    }
  });

  it('correctly maps types and numeric units', () => {
    const fuelQty = getFrontendField('fuelQuantity');
    expect(fuelQty.type).toBe('number');
    expect(fuelQty.unit).toBe('L');

    const fuelSpend = getFrontendField('fuelAmount');
    expect(fuelSpend.type).toBe('currency');

    const mileage = getFrontendField('mileage');
    expect(mileage.unit).toBe('KM/L');

    const rcStatus = getFrontendField('rcStatus');
    expect(rcStatus.type).toBe('badge');
  });

  it('safely handles unknown fields with default text type', () => {
    const unknown = getFrontendField('nonExistentField');
    expect(unknown.key).toBe('nonExistentField');
    expect(unknown.type).toBe('text');
  });

  it('getCustomReportCatalog resolves safely with fallback datasets and fields', async () => {
    const catalog = await ReportsService.getCustomReportCatalog();
    expect(catalog.datasets.length).toBeGreaterThan(0);
    expect(catalog.fields.length).toBeGreaterThan(0);
    expect(catalog.unsupportedFields.length).toBeGreaterThan(0);
  });

  it('getCustomReportTemplates resolves with pre-built templates', async () => {
    const templates = await ReportsService.getCustomReportTemplates();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0].fields.length).toBeGreaterThan(0);
  });
});

describe('Custom Reports UI Navigation Options', () => {
  it('defaults to Requested Reports, with Create Custom Report positioned under requested reports and opening builder on click', () => {
    render(<CustomReportsPage />);

    // Front landing shows Requested Custom Report Fields
    expect(screen.getByText('Requested Custom Report Fields')).toBeDefined();

    // Create Custom Report button is rendered under Requested Reports
    const createBtn = screen.getByRole('button', { name: /Create Custom Report/i });
    expect(createBtn).toBeDefined();

    // Removed navigation options from front
    expect(screen.queryByText('My Saved Reports')).toBeNull();
    expect(screen.queryByText('Report Templates')).toBeNull();

    // Clicking Create Custom Report opens the builder view
    fireEvent.click(createBtn);

    // Builder view elements are now visible
    expect(screen.getByText('Back to Requested Reports')).toBeDefined();
    expect(screen.getByText(/Filters & Business Scope/i)).toBeDefined();

    // Clicking Back returns to Requested Reports
    fireEvent.click(screen.getByText('Back to Requested Reports'));
    expect(screen.getByText('Requested Custom Report Fields')).toBeDefined();
  });
});

describe('CustomReportDatePicker & Date Helpers', () => {
  it('toYmd converts ISO timestamps and DD-MM-YYYY strings to YYYY-MM-DD', () => {
    expect(toYmd('2026-11-13T00:00:00.000+05:30')).toBe('2026-11-13');
    expect(toYmd('13-11-2026')).toBe('2026-11-13');
    expect(toYmd('2026-05-01')).toBe('2026-05-01');
    expect(toYmd('')).toBe('');
    expect(toYmd(null)).toBe('');
  });

  it('toDmy consistently formats dates to dd-mm-yyyy', () => {
    expect(toDmy('2026-11-13T00:00:00.000+05:30')).toBe('13-11-2026');
    expect(toDmy('2026-05-01')).toBe('01-05-2026');
    expect(toDmy('')).toBe('');
    expect(toDmy(null)).toBe('');
  });

  it('parseDmyInput correctly parses and validates dd-mm-yyyy inputs', () => {
    expect(parseDmyInput('15-08-2026')).toBe('2026-08-15');
    expect(parseDmyInput('01-01-2025')).toBe('2025-01-01');

    // Invalid dates
    expect(parseDmyInput('31-02-2026')).toBeNull(); // Feb 31 does not exist
    expect(parseDmyInput('15-13-2026')).toBeNull(); // Month 13 does not exist
    expect(parseDmyInput('not-a-date')).toBeNull();
    expect(parseDmyInput('')).toBeNull();
  });

  it('renders input in dd-mm-yyyy format and toggles calendar picker', () => {
    const handleChange = vi.fn();
    render(
      <CustomReportDatePicker
        id="test-date"
        label="From Date"
        value="2026-11-13T00:00:00.000+05:30"
        onChange={handleChange}
      />
    );

    const input = screen.getByLabelText('From Date');
    expect(input.value).toBe('13-11-2026');

    // Open calendar popup
    const calendarBtn = screen.getByLabelText('Open calendar picker');
    fireEvent.click(calendarBtn);

    // Popup is open
    expect(screen.getByRole('dialog', { name: /From Date calendar picker/i })).toBeDefined();
  });

  it('disables dates outside minDate and maxDate bounds', () => {
    render(
      <CustomReportDatePicker
        id="test-bound"
        label="Bounded Date"
        value="2026-11-10T00:00:00.000+05:30"
        minDate="2026-11-05"
        maxDate="2026-11-15"
      />
    );

    const input = screen.getByLabelText('Bounded Date');
    fireEvent.click(input);

    // Day 4 should be disabled (before minDate 2026-11-05)
    const day4 = screen.getByRole('button', { name: '4' });
    expect(day4.hasAttribute('disabled')).toBe(true);

    // Day 10 should be enabled (within range)
    const day10 = screen.getByRole('button', { name: '10' });
    expect(day10.hasAttribute('disabled')).toBe(false);

    // Day 20 should be disabled (after maxDate 2026-11-15)
    const day20 = screen.getByRole('button', { name: '20' });
    expect(day20.hasAttribute('disabled')).toBe(true);
  });
});

describe('Date Range Validation & Action Toolbar in CustomReportBuilder', () => {
  it('renders Submit Report for Approval button and does not render Generate Report Preview', () => {
    const config = {
      dataset: 'fuel_transactions',
      fields: ['fuelDate', 'fuelQuantity'],
      filters: {},
    };

    render(
      <CustomReportBuilder
        catalog={{ datasets: [], fields: [] }}
        config={config}
      />
    );

    // Submit Report for Approval must exist
    expect(screen.getAllByText('Submit Report for Approval').length).toBeGreaterThan(0);
    // Generate Report Preview must not exist
    expect(screen.queryByRole('button', { name: /Generate Report Preview/i })).toBeNull();
  });

  it('displays validation error and disables Submit Report for Approval when From date is later than To date', () => {
    const configWithInvalidRange = {
      dataset: 'fuel_transactions',
      fields: ['fuelDate', 'fuelQuantity'],
      filters: {
        startDate: '2026-11-20T00:00:00.000+05:30',
        endDate: '2026-11-10T23:59:59.999+05:30',
      },
    };

    render(
      <CustomReportBuilder
        catalog={{ datasets: [], fields: [] }}
        config={configWithInvalidRange}
      />
    );

    // Error banner should be displayed
    expect(
      screen.getByText(/From date cannot be later than To date/i)
    ).toBeDefined();

    // Submit Report for Approval button should be disabled
    const submitBtns = screen.getAllByRole('button', {
      name: /Submit Report for Approval/i,
    });
    expect(submitBtns[0].hasAttribute('disabled')).toBe(true);
  });

  it('allows Submit Report for Approval when From date is earlier than or equal to To date', () => {
    const configWithValidRange = {
      dataset: 'fuel_transactions',
      fields: ['fuelDate', 'fuelQuantity'],
      filters: {
        startDate: '2026-11-01T00:00:00.000+05:30',
        endDate: '2026-11-10T23:59:59.999+05:30',
      },
    };

    render(
      <CustomReportBuilder
        catalog={{ datasets: [], fields: [] }}
        config={configWithValidRange}
      />
    );

    // Error banner should not exist
    expect(screen.queryByText(/From date cannot be later than To date/i)).toBeNull();

    // Submit Report for Approval button should be enabled
    const submitBtns = screen.getAllByRole('button', {
      name: /Submit Report for Approval/i,
    });
    expect(submitBtns[0].hasAttribute('disabled')).toBe(false);
  });
});
