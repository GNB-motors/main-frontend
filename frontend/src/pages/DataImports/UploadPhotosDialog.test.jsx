import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UploadPhotosDialog from './UploadPhotosDialog';
import PhotoImportService from '@/services/PhotoImportService';

vi.mock('@/services/PhotoImportService', () => ({
  default: {
    start: vi.fn(),
    reupload: vi.fn(),
    getBatch: vi.fn(),
    getDriverPeriods: vi.fn(),
    confirmDriverPeriods: vi.fn(),
    listBatches: vi.fn(),
    listDrivers: vi.fn(),
  },
}));

const SENSITIVE = /aadhaar\s*\d|\d{4}\s?\d{4}\s?\d{4}/i;

// What the operator actually reads: every rendered run of text, checked on its
// own, so a phone number next to a date is not mistaken for an identity number.
function sensitiveText() {
  const found = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (SENSITIVE.test(node.textContent || '')) found.push(node.textContent);
    node = walker.nextNode();
  }
  return found;
}

const photo = (name) => new File(['x'], name, { type: 'image/jpeg' });

const BATCH = {
  status: 'done',
  counts: { total: 3, done: 2, reupload: 1, filedElsewhere: 1 },
  rows: [
    { rowId: 'r1', fileName: 'register.jpg', status: 'read' },
    {
      rowId: 'r2',
      fileName: 'fuel-slip.jpg',
      status: 'reupload',
      reason: 'The photo is too dark to read the number.',
    },
    {
      rowId: 'r3',
      fileName: 'pump.jpg',
      status: 'filed_elsewhere',
      notice: {
        code: 'filed_elsewhere',
        uploadedAs: 'fuel_slip',
        filedAs: 'odometer',
      },
    },
  ],
};

function open(props = {}) {
  return render(<UploadPhotosDialog open onOpenChange={vi.fn()} {...props} />);
}

async function upload(names = ['register.jpg', 'fuel-slip.jpg', 'pump.jpg']) {
  fireEvent.change(screen.getByLabelText('Photos'), {
    target: { files: names.map((name) => photo(name)) },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Upload photos' }));
  return screen.findByText('2 photos read');
}

describe('bulk photo import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    PhotoImportService.start.mockResolvedValue({ batchId: 'b1' });
    PhotoImportService.getBatch.mockResolvedValue(BATCH);
    PhotoImportService.reupload.mockResolvedValue({ batchId: 'b1' });
  });

  it('takes a pile of photos in one go', async () => {
    open();
    fireEvent.change(screen.getByLabelText('Photos'), {
      target: { files: [photo('a.jpg'), photo('b.jpg')] },
    });
    expect(screen.getByText('a.jpg')).toBeInTheDocument();
    expect(screen.getByText('b.jpg')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Upload photos' }));
    await waitFor(() => expect(PhotoImportService.start).toHaveBeenCalledTimes(1));
    const body = PhotoImportService.start.mock.calls[0][0];
    expect(body.files).toHaveLength(2);
  });

  it('says how many photos it read, which to retake and why', async () => {
    open();
    await upload();
    expect(screen.getByText('2 photos read')).toBeInTheDocument();
    expect(screen.getByText('Please retake these photos')).toBeInTheDocument();
    expect(screen.getByText('The photo is too dark to read the number.')).toBeInTheDocument();
  });

  it('says where a photo that was something else was filed', async () => {
    open();
    await upload();
    expect(
      screen.getByText(
        "This looks like an odometer photo, not a fuel slip. We've saved it as an odometer reading.",
      ),
    ).toBeInTheDocument();
  });

  it('re-uploads one photo without starting the batch again', async () => {
    open();
    await upload();
    fireEvent.click(screen.getByRole('button', { name: /Re-upload fuel-slip\.jpg/ }));
    fireEvent.change(screen.getByLabelText('Retaken photo'), {
      target: { files: [photo('fuel-slip-2.jpg')] },
    });
    await waitFor(() => expect(PhotoImportService.reupload).toHaveBeenCalledTimes(1));
    expect(PhotoImportService.reupload.mock.calls[0][0].batchId).toBe('b1');
    expect(PhotoImportService.start).toHaveBeenCalledTimes(1);
  });

  it('hands the finished batch to the driver chart', async () => {
    const onBatchReady = vi.fn();
    const onOpenChart = vi.fn();
    open({ onBatchReady, onOpenChart });
    await upload();
    expect(onBatchReady).toHaveBeenCalledWith('b1');
    fireEvent.click(screen.getByRole('button', { name: 'Open driver chart' }));
    expect(onOpenChart).toHaveBeenCalledWith('b1');
  });

  it('never puts an identity number on the screen', async () => {
    open();
    await upload();
    expect(sensitiveText()).toEqual([]);
  });
});
