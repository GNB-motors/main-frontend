import { beforeEach, describe, expect, it, vi } from 'vitest';

const { post, get } = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));
vi.mock('../utils/axiosConfig', () => ({
  default: { post, get },
  REPORT_TIMEOUT: 120000,
}));

const { ReportEmailService } = await import('./ReportEmailService');

const queued = { id: 'r1', status: 'queued', to: ['a@x.com'] };

describe('ReportEmailService.sendFile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('spec 5: uploads the file as multipart form data', async () => {
    post.mockResolvedValue({ data: { data: queued } });
    const blob = new Blob(['a file'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const result = await ReportEmailService.sendFile({
      blob,
      filename: 'oil_report_2026-09-06.xlsx',
      to: ['a@x.com', 'b@x.com'],
      reportLabel: 'Oil report',
      note: 'for the office',
    });

    expect(result.id).toBe('r1');
    expect(post).toHaveBeenCalledTimes(1);
    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe('/api/report-email/send-file');
    expect(body).toBeInstanceOf(FormData);
    // The file rides along under "file", with its own name.
    expect(body.get('file')).toBeInstanceOf(Blob);
    expect(body.get('file').name).toBe('oil_report_2026-09-06.xlsx');
    // The recipients travel as a JSON list, the way the API reads them.
    expect(JSON.parse(body.get('to'))).toEqual(['a@x.com', 'b@x.com']);
    expect(body.get('reportLabel')).toBe('Oil report');
    expect(body.get('note')).toBe('for the office');
    // No Content-Type of our own: the browser has to set the multipart boundary.
    expect(config?.headers).toBeUndefined();
  });

  it('spec 5: leaves out the label and the note when there are none', async () => {
    post.mockResolvedValue({ data: { data: queued } });

    await ReportEmailService.sendFile({
      blob: new Blob(['x']),
      filename: 'employees.xlsx',
      to: ['a@x.com'],
    });

    const body = post.mock.calls[0][1];
    expect(body.get('reportLabel')).toBeNull();
    expect(body.get('note')).toBeNull();
  });
});

describe('ReportEmailService.sendServerReport', () => {
  beforeEach(() => vi.clearAllMocks());

  it('spec 5: posts the report, its filters and the recipients as JSON', async () => {
    post.mockResolvedValue({ data: { data: queued } });

    await ReportEmailService.sendServerReport({
      report: 'fuel-cycles',
      params: { from: '2026-09-01', format: 'xlsx' },
      to: ['a@x.com'],
      note: 'hello',
    });

    expect(post).toHaveBeenCalledWith(
      '/api/report-email/send',
      {
        report: 'fuel-cycles',
        params: { from: '2026-09-01', format: 'xlsx' },
        to: ['a@x.com'],
        note: 'hello',
      },
    );
  });

  it('spec 5: reads the delivery status of one queued e-mail', async () => {
    get.mockResolvedValue({ data: { data: { ...queued, status: 'sent' } } });

    const result = await ReportEmailService.getStatus('r1');

    expect(get).toHaveBeenCalledWith('/api/report-email/r1');
    expect(result.status).toBe('sent');
  });
});
