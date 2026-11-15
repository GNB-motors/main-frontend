import { describe, it, expect } from 'vitest';
import {
  FRONTEND_FIELD_CATALOG,
  getFrontendField,
  FRONTEND_FIELD_MAP,
  DATASETS,
  REPORT_TEMPLATES,
} from './customReportFields';
import CustomReportsPage from './CustomReportsPage';
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
