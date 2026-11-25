import { describe, it, expect } from 'vitest';
import { parseWith } from './validate.js';

const parseStatus = (data) =>
  parseWith('reportEmailStatusSchema', () => import('./reportEmail.schema.js'), data);
const parseSettings = (data) =>
  parseWith('emailReportSettingsSchema', () => import('./reportEmail.schema.js'), data);

describe('reportEmail.schema.js', () => {
  it('accepts a queued report e-mail as the API sends it', async () => {
    const data = {
      id: 're_123',
      status: 'queued',
      delivery: 'pending',
      filename: 'oil_report.xlsx',
      sizeBytes: 20480,
      to: ['owner@gnb.com'],
      sentAt: null,
      error: null,
    };
    expect(await parseStatus(data)).toEqual(data);
  });

  it('rejects a status whose id is not a string', async () => {
    await expect(parseStatus({ id: 123, status: 'queued' })).rejects.toThrow();
  });

  it('accepts the scheduled e-mail settings', async () => {
    const data = {
      daily: true,
      weekly: false,
      recipients: ['owner@gnb.com'],
      defaultRecipients: ['owner@gnb.com'],
      serverEnabled: true,
      emailConfigured: true,
      sendTimeIst: '08:00',
      weeklyDay: 'Monday',
      updatedAt: '2026-11-25T04:00:00.000Z',
    };
    expect(await parseSettings(data)).toEqual(data);
  });

  it('accepts settings that are switched off on the server', async () => {
    const data = {
      daily: false,
      weekly: false,
      recipients: [],
      defaultRecipients: [],
      serverEnabled: false,
      emailConfigured: false,
    };
    expect(await parseSettings(data)).toEqual(data);
  });

  it('rejects a daily flag that is not a boolean', async () => {
    await expect(parseSettings({ daily: 'yes' })).rejects.toThrow();
  });
});
