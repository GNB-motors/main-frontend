import { describe, it, expect } from 'vitest';
import {
  classifyIssuePriority,
  isRecordResolved,
  getResolutionDetails,
  formatCurrencyINR,
  PRIORITY_LEVELS,
} from './serviceIntelligenceLogic';

describe('classifyIssuePriority', () => {
  it('identifies broken axle as P0 Critical', () => {
    const priority = classifyIssuePriority({
      type: 'Axle Breakdown',
      notes: 'Rear left axle broken on highway NH-2',
      amount: 18000,
      recordType: 'REPAIR',
    });
    expect(priority.code).toBe('P0');
    expect(priority.key).toBe('CRITICAL');
  });

  it('identifies tyre puncture as P2 Medium (much less concerning than broken axle)', () => {
    const priority = classifyIssuePriority({
      type: 'Tyre Puncture',
      notes: 'Front right tyre puncture repaired at roadside dhaba',
      amount: 250,
      recordType: 'REPAIR',
    });
    expect(priority.code).toBe('P2');
    expect(priority.key).toBe('MEDIUM');
  });

  it('identifies clutch plate failure as P1 High', () => {
    const priority = classifyIssuePriority({
      type: 'Clutch Overhaul',
      notes: 'Clutch plate slipping and overheating under load',
      amount: 9500,
      recordType: 'REPAIR',
    });
    expect(priority.code).toBe('P1');
    expect(priority.key).toBe('HIGH');
  });

  it('identifies scheduled oil service as P3 Low / Routine', () => {
    const priority = classifyIssuePriority({
      type: 'Scheduled Oil Change',
      notes: 'Engine oil and filter change as per 10,000 km schedule',
      amount: 4500,
      recordType: 'SERVICE',
    });
    expect(priority.code).toBe('P3');
    expect(priority.key).toBe('LOW');
  });

  it('respects explicit priority override if given', () => {
    const priority = classifyIssuePriority({
      type: 'General Checkup',
      notes: 'Urgent axle inspection',
      priority: 'P0',
    });
    expect(priority.code).toBe('P0');
  });
});

describe('isRecordResolved & getResolutionDetails', () => {
  it('detects unresolved record', () => {
    expect(isRecordResolved({ notes: 'Broken axle reported' })).toBe(false);
  });

  it('detects resolved tag in notes and extracts details', () => {
    const record = {
      notes: 'Broken axle reported. [RESOLVED: New axle installed by Tata Workshop]',
      updatedAt: '2026-03-20T10:00:00.000Z',
    };
    expect(isRecordResolved(record)).toBe(true);
    const details = getResolutionDetails(record);
    expect(details.resolutionNote).toBe('New axle installed by Tata Workshop');
  });

  it('detects explicit status=RESOLVED', () => {
    expect(isRecordResolved({ status: 'RESOLVED', notes: 'Done' })).toBe(true);
  });
});

describe('formatCurrencyINR', () => {
  it('formats numbers to rupee strings', () => {
    expect(formatCurrencyINR(50000)).toBe('₹50,000');
    expect(formatCurrencyINR(0)).toBe('₹0');
    expect(formatCurrencyINR(null)).toBe('₹0');
  });
});
