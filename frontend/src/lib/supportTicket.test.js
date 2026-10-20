import { describe, it, expect } from 'vitest';
import {
  MAX_FILES,
  buildReplyForm,
  buildTicketForm,
  cleanParams,
  followUpSubject,
  formatBytes,
  mergeFiles,
  priorityTone,
  purgeState,
  rangeFor,
  relativeTime,
  statusTone,
} from './supportTicket';

const fakeFile = (name, { type = 'image/png', size = 2048, lastModified = 1 } = {}) => ({
  name,
  type,
  size,
  lastModified,
});

describe('tones', () => {
  it('maps status and priority to the reserved tones, inert for anything unknown', () => {
    expect(statusTone('AWAITING_CUSTOMER')).toBe('caution');
    expect(statusTone('SOLVED')).toBe('ok');
    expect(statusTone('OPEN')).toBe('inert');
    expect(priorityTone('URGENT')).toBe('critical');
    expect(priorityTone('HIGH')).toBe('caution');
    expect(priorityTone('NOPE')).toBe('inert');
  });
});

describe('rangeFor', () => {
  it('returns no bounds for all time', () => {
    expect(rangeFor('all', '2026-10-19')).toEqual({});
  });

  it('covers N IST days ending today', () => {
    expect(rangeFor('7d', '2026-10-19')).toEqual({
      from: '2026-10-12T18:30:00.000Z',
      to: '2026-10-19T18:29:59.999Z',
    });
  });
});

describe('cleanParams', () => {
  it('drops blank values so the API never sees an empty param', () => {
    expect(cleanParams({ status: '', q: 'fuel', page: 1, orgId: null, x: undefined })).toEqual({
      q: 'fuel',
      page: 1,
    });
  });
});

describe('mergeFiles', () => {
  it('accepts images and PDFs and de-duplicates the same file', () => {
    const a = fakeFile('a.png');
    const { files, errors } = mergeFiles([a], [a, fakeFile('b.pdf', { type: 'application/pdf' })]);
    expect(files.map((f) => f.name)).toEqual(['a.png', 'b.pdf']);
    expect(errors).toEqual([]);
  });

  it('says why each rejected file was refused', () => {
    const { files, errors } = mergeFiles(
      [],
      [
        fakeFile('virus.exe', { type: 'application/x-msdownload' }),
        fakeFile('huge.png', { size: 11 * 1024 * 1024 }),
      ],
    );
    expect(files).toEqual([]);
    expect(errors).toEqual([
      'virus.exe: only images and PDFs can be attached',
      'huge.png: larger than 10 MB',
    ]);
  });

  it('stops at the per-message cap', () => {
    const picked = Array.from({ length: MAX_FILES + 1 }, (_, i) =>
      fakeFile(`f${i}.png`, { lastModified: i }),
    );
    const { files, errors } = mergeFiles([], picked);
    expect(files).toHaveLength(MAX_FILES);
    expect(errors).toEqual([`f${MAX_FILES}.png: at most ${MAX_FILES} files per message`]);
  });
});

describe('form builders', () => {
  it('builds the ticket form with trimmed text, context and files', () => {
    const form = buildTicketForm(
      {
        subject: '  Fuel log  ',
        description: ' broken save ',
        category: 'FUEL',
        priority: 'HIGH',
        vehicleId: '',
      },
      [new Blob(['x'], { type: 'image/png' })],
      { pageUrl: '/fuel', userAgent: 'jsdom' },
    );
    expect(form.get('subject')).toBe('Fuel log');
    expect(form.get('description')).toBe('broken save');
    expect(form.has('vehicleId')).toBe(false);
    expect(form.get('pageUrl')).toBe('/fuel');
    expect(form.getAll('files')).toHaveLength(1);
  });

  it('builds a reply form, skipping empty extras', () => {
    const form = buildReplyForm(' thanks ', [], { status: 'SOLVED', other: '' });
    expect(form.get('body')).toBe('thanks');
    expect(form.get('status')).toBe('SOLVED');
    expect(form.has('other')).toBe(false);
  });
});

describe('purgeState', () => {
  it('distinguishes nothing pending, scheduled and purged', () => {
    expect(purgeState({ status: 'OPEN' })).toEqual({ kind: 'none' });
    expect(purgeState({ status: 'SOLVED', purgeAt: '2026-10-26T00:00:00Z' })).toEqual({
      kind: 'scheduled',
      purgeAt: '2026-10-26T00:00:00Z',
    });
    expect(purgeState({ status: 'SOLVED', solvedAt: 'a', purgeAt: 'b', purgedAt: 'c' })).toEqual({
      kind: 'purged',
      solvedAt: 'a',
      purgedAt: 'c',
    });
  });
});

describe('small formatters', () => {
  it('formats sizes, relative times and follow-up subjects', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(3.5 * 1024 * 1024)).toBe('3.5 MB');

    const now = Date.parse('2026-10-19T12:00:00Z');
    expect(relativeTime('2026-10-19T11:59:40Z', now)).toBe('just now');
    expect(relativeTime('2026-10-19T11:15:00Z', now)).toBe('45m ago');
    expect(relativeTime('2026-10-19T07:00:00Z', now)).toBe('5h ago');
    expect(relativeTime('2026-10-16T12:00:00Z', now)).toBe('3d ago');

    expect(followUpSubject({ ticketNumber: 'TKT-1042', subject: 'Fuel log' })).toBe(
      'Follow-up to TKT-1042: Fuel log',
    );
  });
});
