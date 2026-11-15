import { describe, expect, it } from 'vitest';
import {
  ackAllConfirmText,
  assignmentNameError,
  filterIncidents,
  incidentSeverity,
  resolutionNoteError,
} from './incidentsModel';

describe('closing an incident', () => {
  it('will not close in silence — the note says what happened', () => {
    expect(resolutionNoteError('')).toBeTruthy();
    expect(resolutionNoteError('   ')).toBeTruthy();
    expect(resolutionNoteError('x')).toBeTruthy();
    expect(
      resolutionNoteError('Tyre burst on NH-42; wheel changed at Kolar service centre.'),
    ).toBeNull();
  });

  it('will not send anyone without naming them', () => {
    expect(assignmentNameError('')).toBeTruthy();
    expect(assignmentNameError('R')).toBeTruthy();
    expect(assignmentNameError('Ramesh Kumar')).toBeNull();
  });
});

describe('acknowledging everything at once', () => {
  it('says how many open alerts it is about to mark as seen', () => {
    expect(ackAllConfirmText(3)).toBe('Mark all 3 open alerts as seen?');
    expect(ackAllConfirmText(1)).toBe('Mark all 1 open alert as seen?');
    expect(ackAllConfirmText(0)).toBe('Mark all 0 open alerts as seen?');
  });
});

describe('incident severity', () => {
  it('never invents a severity the incident did not carry', () => {
    expect(incidentSeverity({})).toBe('');
    expect(incidentSeverity({ severity: '  High ' })).toBe('high');
    const rows = [{ _id: 'a', severity: 'high' }, { _id: 'b' }];
    expect(filterIncidents(rows, { severity: 'unspecified' })).toEqual([{ _id: 'b' }]);
    expect(filterIncidents(rows, { severity: 'high' })).toEqual([{ _id: 'a', severity: 'high' }]);
  });
});
