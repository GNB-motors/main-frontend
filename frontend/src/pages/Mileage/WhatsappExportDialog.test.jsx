import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import WhatsappExportDialog from './WhatsappExportDialog';
import PhotoImportService from '../../services/PhotoImportService';
import * as chatUpload from './chatUploadStore';

vi.mock('../../services/PhotoImportService', () => ({
  default: {
    uploadWhatsappExport: vi.fn(),
    getChatExportJob: vi.fn(),
    getActiveChatExportJob: vi.fn(),
    getDriverSheetSuggestions: vi.fn(),
    confirmDriverSheetSuggestions: vi.fn(),
    dismissDriverSheetSuggestions: vi.fn(),
  },
}));

// The live line of the import is watched here, so the test can play the part
// of the server: it gives one photo at a time and says how the import ended.
const { streamMock } = vi.hoisted(() => {
  const calls = [];
  const open = vi.fn((jobId, options) => {
    const handle = { jobId, options, closed: false };
    handle.close = vi.fn(() => {
      handle.closed = true;
    });
    calls.push(handle);
    return handle;
  });
  return { streamMock: { calls, open } };
});

vi.mock('./chatExportStream', () => ({
  MAX_PHOTO_ROWS: 200,
  openChatExportStream: (...args) => streamMock.open(...args),
}));

const zipFile = () => new File(['zip'], 'mehfuz-chat.zip', { type: 'application/zip' });

// A 500 MB+ file cannot be built in memory, so its size is stated.
const bigZip = () => {
  const file = new File(['zip'], 'big-chat.zip', { type: 'application/zip' });
  Object.defineProperty(file, 'size', { value: 501 * 1024 * 1024 });
  return file;
};

// The answer of the server: every photo is in exactly one bucket, and the
// buckets add up to the number of photos.
const answer = {
  filename: 'mehfuz-chat.zip',
  messages: 120,
  photos: 96,
  photoBuckets: {
    saved: 40,
    waiting: 12,
    market: 3,
    alreadyReceived: 30,
    unreadable: 5,
    failed: 2,
    other: 4,
  },
  fills: {
    saved: 40,
    waiting: 12,
    market: 3,
    alreadyReceived: 30,
    failed: 2,
  },
  fillsConfirmed: 40,
  drafts: 12,
  market: 3,
  dutyRecords: 5,
  skippedAsAlreadyReceived: 7,
  captionOnly: 2,
  photosMissing: 0,
  skippedMedia: 4,
  failed: [],
};

const open = (props = {}) =>
  render(<WhatsappExportDialog open onOpenChange={vi.fn()} {...props} />);

const chooseFile = (file) =>
  fireEvent.change(screen.getByLabelText('WhatsApp chat export'), {
    target: { files: [file] },
  });

// The count of one row of one of the tables of the end state.
const cell = (caption, label) => {
  const table = screen.getByRole('table', { name: caption });
  const head = within(table).getByRole('rowheader', { name: label });
  return head.parentElement.querySelector('td').textContent;
};

// The questions and their answers travel through promises: let them land.
const flush = async (times = 4) => {
  for (let i = 0; i < times; i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

// Send a chat and wait until the live line is open.
const startImport = async (props = {}) => {
  open(props);
  chooseFile(zipFile());
  fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
  await waitFor(() => expect(streamMock.calls.length).toBe(1));
  return streamMock.calls[0].options;
};

const READER_DOWN =
  'The photo reader is not running, so nothing was imported. Start it and upload the chat again.';

describe('WhatsApp chat export dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    streamMock.calls.length = 0;
    // The store belongs to the session, not to one test.
    chatUpload.reset();
    // The server answers at once with a job id: the import runs in the
    // background and the session follows it.
    PhotoImportService.uploadWhatsappExport.mockResolvedValue({ jobId: 'job-1' });
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'done',
      progress: { read: 96, total: 96 },
      result: answer,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('refuses a file that is not a zip before anything is uploaded', () => {
    open();
    chooseFile(new File(['x'], 'photo.jpg', { type: 'image/jpeg' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose a WhatsApp chat export (.zip).',
    );
    expect(PhotoImportService.uploadWhatsappExport).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
  });

  it('refuses a chat export bigger than 500 MB before anything is uploaded', () => {
    open();
    chooseFile(bigZip());

    expect(screen.getByRole('alert')).toHaveTextContent('bigger than 500 MB');
    expect(PhotoImportService.uploadWhatsappExport).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
  });

  it('shows the upload progress while the chat is being sent', async () => {
    let progress = null;
    PhotoImportService.uploadWhatsappExport.mockImplementation((_file, options) => {
      progress = options.onUploadProgress;
      return new Promise(() => {});
    });
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    await waitFor(() => expect(progress).toBeTruthy());
    expect(screen.getByText('Sending chat…')).toBeInTheDocument();

    act(() => progress({ loaded: 50, total: 100 }));
    expect(screen.getByText('Sending chat: 50%')).toBeInTheDocument();
  });

  it('says how many photos have been read out of how many', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'reading',
      progress: { read: 120, total: 603 },
    });
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByText('Reading photos 120 / 603')).toBeInTheDocument();
    expect(PhotoImportService.getChatExportJob).toHaveBeenCalledWith('job-1');
  });

  it('waits without a bar when the server has queued the chat', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'queued',
      progress: { read: 0, total: 0 },
    });
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    const waiting = await screen.findByText('Waiting to start…');
    expect(waiting.parentElement.querySelector('.wxp-bar')).toBeNull();
  });

  it('shows every count after a successful import', async () => {
    const file = zipFile();
    open();
    chooseFile(file);
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByText('Chat imported')).toBeInTheDocument();
    // Every photo is in exactly one bucket, and the buckets add up.
    expect(cell('What happened to the photos', 'Saved to the mileage list')).toBe('40');
    expect(cell('What happened to the photos', 'Waiting for a person')).toBe('12');
    expect(cell('What happened to the photos', 'Market truck')).toBe('3');
    expect(cell('What happened to the photos', 'Already received')).toBe('30');
    expect(cell('What happened to the photos', 'Unreadable')).toBe('5');
    expect(cell('What happened to the photos', 'Failed')).toBe('2');
    expect(cell('What happened to the photos', 'Other')).toBe('4');
    expect(cell('What happened to the photos', 'Photos')).toBe('96');
    // The fills of the chat.
    expect(cell('The fills of the chat', 'Saved')).toBe('40');
    expect(cell('The fills of the chat', 'Waiting for a person')).toBe('12');
    expect(cell('The fills of the chat', 'Market truck')).toBe('3');
    expect(cell('The fills of the chat', 'Already received')).toBe('30');
    expect(cell('The fills of the chat', 'Failed')).toBe('2');
    // The chat itself.
    expect(cell('The chat itself', 'Messages')).toBe('120');
    expect(cell('The chat itself', 'Caption without photo')).toBe('2');
    expect(cell('The chat itself', 'Other files skipped')).toBe('4');
    expect(cell('The chat itself', 'Failed')).toBe('0');
    // Nothing was missing, so the line about missing photos is not shown.
    expect(screen.queryByText(/photos missing/)).not.toBeInTheDocument();
    expect(PhotoImportService.uploadWhatsappExport).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ onUploadProgress: expect.any(Function) }),
    );
  });

  it('keeps the driver-list result when the suggestion service is unavailable', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'done',
      progress: { read: 96, total: 96 },
      result: {
        ...answer,
        driverSheet: { rows: 43, agrees: 0, conflicts: 2, missing: 41, unknownTrucks: 0 },
      },
    });
    PhotoImportService.getDriverSheetSuggestions.mockRejectedValue(new Error('offline'));
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    const card = await screen.findByRole('button', {
      name: 'Driver list in the chat: 41 trucks have no driver, 2 differ from the app — Review',
    });
    fireEvent.click(card);

    expect(
      await screen.findByText('Could not load driver suggestions. Try again.'),
    ).toBeInTheDocument();
    expect(card).toBeInTheDocument();
  });

  it('says how many photos were missing, and lists each failure with its reason', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'done',
      progress: { read: 2, total: 2 },
      result: {
        ...answer,
        photosMissing: 12,
        failed: [{ seq: 4, sender: 'Mehfuz', reason: 'The photo could not be read.' }],
      },
    });
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(
      await screen.findByText(
        '12 photos missing: export the chat again with Include media.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('1 photo: The photo could not be read.')).toBeInTheDocument();
    expect(cell('The chat itself', 'Failed')).toBe('1');
  });

  it('shows a dash, never a zero, for a count the server did not send', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'done',
      progress: { read: 2, total: 2 },
      result: { filename: 'chat.zip', messages: 5, photos: 2 },
    });
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(
      await screen.findByText('Import finished — some counts not reported.'),
    ).toBeInTheDocument();
    expect(cell('The chat itself', 'Messages')).toBe('5');
    expect(cell('The chat itself', 'Caption without photo')).toBe('—');
    expect(cell('The chat itself', 'Other files skipped')).toBe('—');
    expect(cell('The chat itself', 'Failed')).toBe('—');
    // The photos the server never counted are not counted as zero.
    expect(cell('What happened to the photos', 'Saved to the mileage list')).toBe('—');
    expect(cell('What happened to the photos', 'Photos')).toBe('2');
  });

  it('shows the server’s own message when the chat cannot be sent', async () => {
    PhotoImportService.uploadWhatsappExport.mockRejectedValue({
      response: { data: { message: 'That file is not a WhatsApp chat export.' } },
    });
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That file is not a WhatsApp chat export.',
    );
  });

  it('shows an amber state with the failures grouped when something could not be read', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'done',
      progress: { read: 3, total: 3 },
      result: {
        ...answer,
        fillsConfirmed: 20,
        failed: [
          { seq: 1, sender: 'Mehfuz', reason: 'the photo could not be read' },
          { seq: 2, sender: 'Mehfuz', reason: 'the photo could not be read' },
          { seq: 3, sender: 'Mehfuz', reason: 'no truck, litres or time found on the photo' },
        ],
        failedGroups: [
          { reason: 'the photo could not be read', count: 2, seqs: [1, 2] },
          { reason: 'no truck, litres or time found on the photo', count: 1, seqs: [3] },
        ],
      },
    });
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByText('Imported, with 3 problems')).toBeInTheDocument();
    expect(screen.queryByText('Chat imported')).not.toBeInTheDocument();
    expect(screen.getByRole('status').className).toContain('bp-warning');
    expect(screen.getByText('2 photos: the photo could not be read')).toBeInTheDocument();
    expect(
      screen.getByText('1 photo: no truck, litres or time found on the photo'),
    ).toBeInTheDocument();
  });

  it('says nothing was imported when the photo reader is not running, and offers a retry', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'failed',
      progress: { read: 0, total: 0 },
      error:
        'The photo reader is not running, so nothing was imported. Start it and upload the chat again.',
    });
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not read the chat. Try again.');
    expect(alert).toHaveTextContent(
      'The photo reader is not running, so nothing was imported.',
    );
    // The chosen file is kept, so Try again sends the very same chat again.
    const again = screen.getByRole('button', { name: 'Try again' });
    expect(again).toBeEnabled();
    fireEvent.click(again);
    await waitFor(() => expect(PhotoImportService.uploadWhatsappExport).toHaveBeenCalledTimes(2));
  });

  it('says the import may still be running when the connection times out', async () => {
    PhotoImportService.uploadWhatsappExport.mockRejectedValue(
      Object.assign(new Error('timeout of 1800000ms exceeded'), { code: 'ECONNABORTED' }),
    );
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Connection lost. The import may still be running. Check before retrying.',
    );
    // The server may still be working: this is not "nothing was imported".
    expect(alert).not.toHaveTextContent('Could not read the chat. Try again.');
    expect(alert).not.toHaveTextContent('timeout of 1800000ms exceeded');
  });

  it('never shows the technical text of a failure', async () => {
    PhotoImportService.uploadWhatsappExport.mockRejectedValue(
      new Error('Request failed with status code 500 at /photo-imports/whatsapp-export'),
    );
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('The chat could not be uploaded. Please try again.');
    expect(alert).not.toHaveTextContent('status code 500');
    expect(alert).not.toHaveTextContent('/photo-imports/whatsapp-export');
  });

  it('can be closed while the chat is being sent, and the upload keeps going', async () => {
    let signal = null;
    PhotoImportService.uploadWhatsappExport.mockImplementation((_file, options) => {
      signal = options.signal;
      return new Promise(() => {});
    });
    const onOpenChange = vi.fn();
    open({ onOpenChange });
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
    await waitFor(() => expect(signal).toBeTruthy());

    // The close button is never disabled, and closing does not stop the bytes.
    const close = screen.getByLabelText('Close');
    expect(close).toBeEnabled();
    fireEvent.click(close);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(signal.aborted).toBe(false);
    expect(chatUpload.getState().stage).toBe('uploading');
  });

  it('can be closed while the photos are being read, and the import keeps going', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'reading',
      progress: { read: 120, total: 603 },
    });
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <WhatsappExportDialog open onOpenChange={onOpenChange} />,
    );
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByText('Reading photos 120 / 603')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Close'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    rerender(<WhatsappExportDialog open={false} onOpenChange={onOpenChange} />);
    expect(screen.queryByText('Reading photos 120 / 603')).not.toBeInTheDocument();

    // The import is still being followed: the session did not forget it.
    expect(chatUpload.getState().jobId).toBe('job-1');
    expect(streamMock.calls[0].closed).toBe(false);
  });

  it('stops the bytes only when the owner asks for it', async () => {
    let signal = null;
    PhotoImportService.uploadWhatsappExport.mockImplementation((_file, options) => {
      signal = options.signal;
      return new Promise(() => {});
    });
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
    await waitFor(() => expect(signal).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: 'Cancel upload' }));

    expect(signal.aborted).toBe(true);
    expect(chatUpload.getState().stage).toBe('idle');
  });

  it('closing the dialog does not cancel the job, and opening it again shows the running import', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'reading',
      progress: { read: 120, total: 603 },
    });
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <WhatsappExportDialog open onOpenChange={onOpenChange} />,
    );
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByText('Reading photos 120 / 603')).toBeInTheDocument();

    // Closing the dialog only hides it: the import keeps running.
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    rerender(<WhatsappExportDialog open={false} onOpenChange={onOpenChange} />);
    expect(screen.queryByText('Reading photos 120 / 603')).not.toBeInTheDocument();

    // Opening it again shows the import that is still running.
    rerender(<WhatsappExportDialog open onOpenChange={onOpenChange} />);
    expect(await screen.findByText('Reading photos 120 / 603')).toBeInTheDocument();
    // The chat was sent once, and the same job is being followed.
    expect(PhotoImportService.uploadWhatsappExport).toHaveBeenCalledTimes(1);
    expect(PhotoImportService.getChatExportJob).toHaveBeenCalledWith('job-1');
  });

  it('stops asking once the import is done', async () => {
    vi.useFakeTimers();
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
    await flush();

    expect(screen.getByText('Chat imported')).toBeInTheDocument();
    expect(PhotoImportService.getChatExportJob).toHaveBeenCalledTimes(1);

    // The asking stops: the minutes that pass bring no new question.
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(PhotoImportService.getChatExportJob).toHaveBeenCalledTimes(1);
  });

  it('stops asking once the import has failed', async () => {
    vi.useFakeTimers();
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'failed',
      progress: { read: 0, total: 0 },
      errorCode: 'READER_DOWN',
      error: READER_DOWN,
    });
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
    await flush();

    expect(screen.getByRole('alert')).toHaveTextContent('Could not read the chat. Try again.');

    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(PhotoImportService.getChatExportJob).toHaveBeenCalledTimes(1);
  });

  it('says the import is not found any more, and stops asking', async () => {
    vi.useFakeTimers();
    const gone = Object.assign(new Error('Not Found'), { response: { status: 404 } });
    PhotoImportService.getChatExportJob.mockRejectedValue(gone);
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
    await flush();
    await flush();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent("We can't find that import any more.");
    expect(alert).toHaveTextContent("Upload the chat again if it didn't finish.");

    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(PhotoImportService.getChatExportJob).toHaveBeenCalledTimes(1);
  });

  it('says the import stopped partway when something else went wrong', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'failed',
      progress: { read: 12, total: 40 },
      error: 'The disk filled up.',
    });
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('The import stopped partway');
    expect(alert).toHaveTextContent('Some photos may already be saved.');
    expect(alert).toHaveTextContent('The disk filled up.');
  });

  it('ignores the late answer of an import that was replaced', async () => {
    vi.useFakeTimers();
    let releaseSlow;
    const slow = new Promise((resolve) => {
      releaseSlow = resolve;
    });
    PhotoImportService.uploadWhatsappExport
      .mockResolvedValueOnce({ jobId: 'job-1' })
      .mockResolvedValueOnce({ jobId: 'job-2' });
    PhotoImportService.getChatExportJob
      .mockImplementationOnce(() => slow)
      .mockResolvedValueOnce({
        state: 'failed',
        progress: { read: 0, total: 0 },
        errorCode: 'READER_DOWN',
        error: READER_DOWN,
      })
      .mockResolvedValue({ state: 'reading', progress: { read: 1, total: 2 } });

    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
    await flush();

    // The second question says the import failed: the chat is sent again.
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    await flush();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not read the chat. Try again.');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await flush();
    expect(PhotoImportService.uploadWhatsappExport).toHaveBeenCalledTimes(2);

    // The slow answer of the first import arrives now: it is about an import
    // that is gone, so it changes nothing.
    await act(async () => {
      releaseSlow({ state: 'done', progress: { read: 9, total: 9 }, result: answer });
    });
    await flush();

    expect(screen.queryByText('Chat imported')).not.toBeInTheDocument();
    expect(screen.getByText('Reading photos 1 / 2')).toBeInTheDocument();
  });

  it('shows the photos as they are read, one row at a time', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'reading',
      progress: { read: 0, total: 100 },
    });
    const options = await startImport();

    act(() =>
      options.onEvent({
        type: 'photo',
        id: '1',
        data: { seq: 1, i: 1, total: 100, file: 'IMG-0001.jpg', result: 'read', kind: 'fuel' },
      }),
    );
    expect(await screen.findByText('IMG-0001.jpg — read (fuel)')).toBeInTheDocument();

    act(() =>
      options.onEvent({
        type: 'photo',
        id: '2',
        data: {
          seq: 2,
          i: 2,
          total: 100,
          file: 'IMG-0002.jpg',
          result: 'unreadable',
          reason: 'the photo is broken',
        },
      }),
    );
    expect(
      await screen.findByText('IMG-0002.jpg — could not be read: the photo is broken'),
    ).toBeInTheDocument();

    // The newest photo comes first.
    const list = screen.getByRole('list', { name: 'The photos as they are read' });
    const rows = list.querySelectorAll('li');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('IMG-0002.jpg');
    // The counter follows the photos.
    expect(screen.getByText('Reading photos 2 / 100')).toBeInTheDocument();
  });

  it('closes the live line when the import ends', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'reading',
      progress: { read: 1, total: 2 },
    });
    const options = await startImport();

    act(() => options.onEvent({ type: 'done', id: '2', data: { seq: 2, summary: answer } }));

    expect(await screen.findByText('Chat imported')).toBeInTheDocument();
    expect(streamMock.calls[0].closed).toBe(true);
  });

  it('closes the live line when the import fails', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'reading',
      progress: { read: 0, total: 2 },
    });
    const options = await startImport();

    act(() =>
      options.onEvent({
        type: 'failed',
        data: { message: READER_DOWN, errorCode: 'READER_DOWN' },
      }),
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not read the chat. Try again.');
    expect(streamMock.calls[0].closed).toBe(true);
  });

  it('keeps asking the server when the live line is not there', async () => {
    PhotoImportService.getChatExportJob
      .mockResolvedValueOnce({ state: 'reading', progress: { read: 120, total: 603 } })
      .mockResolvedValue({
        state: 'done',
        progress: { read: 96, total: 96 },
        result: answer,
      });
    const options = await startImport();

    // The line drops: nothing is said to the owner, the asking goes on.
    act(() => options.onError(new Error('no line')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Reading photos 120 / 603')).toBeInTheDocument();

    // The asking finds the end of the import.
    expect(await screen.findByText('Chat imported', undefined, { timeout: 6000 })).toBeInTheDocument();
  });

  it('keeps the live line open when the dialog is closed and opened again', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'reading',
      progress: { read: 5, total: 100 },
    });
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <WhatsappExportDialog open onOpenChange={onOpenChange} />,
    );
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
    await waitFor(() => expect(streamMock.calls.length).toBe(1));

    act(() =>
      streamMock.calls[0].options.onEvent({
        type: 'photo',
        id: '7',
        data: { seq: 7, i: 7, total: 100, file: 'IMG-0007.jpg', result: 'read' },
      }),
    );

    // Closing the dialog does not close the line: the session keeps following
    // the import.
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    rerender(<WhatsappExportDialog open={false} onOpenChange={onOpenChange} />);
    expect(streamMock.calls[0].closed).toBe(false);

    // Opening it again shows the same import and asks only for what is new.
    rerender(<WhatsappExportDialog open onOpenChange={onOpenChange} />);
    await waitFor(() => expect(streamMock.calls.length).toBe(1));
  });

  it('says nothing new when the chat brings nothing new', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'done',
      progress: { read: 5, total: 5 },
      result: {
        filename: 'chat.zip',
        messages: 12,
        photos: 5,
        photoBuckets: {
          saved: 0,
          waiting: 0,
          market: 0,
          alreadyReceived: 5,
          unreadable: 0,
          failed: 0,
          other: 0,
        },
        fills: { saved: 0, waiting: 0, market: 0, alreadyReceived: 3, failed: 0 },
        failed: [],
      },
    });
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByText('Nothing new in this chat')).toBeInTheDocument();
    expect(
      screen.getByText('Nothing new in this chat. All 5 photos were already imported.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('status').className).toContain('bp-neutral');
    // There is nothing to check, so there is nothing to review.
    expect(screen.queryByRole('button', { name: 'Review them' })).not.toBeInTheDocument();
  });

  it('lets the owner go and check the fills that are waiting', async () => {
    const onReview = vi.fn();
    const onOpenChange = vi.fn();
    render(<WhatsappExportDialog open onOpenChange={onOpenChange} onReview={onReview} />);
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByText('Chat imported')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Review them' }));

    expect(onReview).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('the plain words of the chat import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    streamMock.calls.length = 0;
    chatUpload.reset();
    PhotoImportService.uploadWhatsappExport.mockResolvedValue({ jobId: 'job-1' });
  });

  it('says a zip file is needed before anything is uploaded', () => {
    open();
    expect(screen.getByText('Choose a .zip file to upload.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
  });

  it('says when only some of the counts are known', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'done',
      progress: { read: 2, total: 2 },
      result: { photos: 2, fills: { saved: 1 } },
    });
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(
      await screen.findByText('Import finished — some counts not reported.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Some photos could not be read. Review the results below.'),
    ).toBeInTheDocument();
    expect(cell('What happened to the photos', 'Saved to the mileage list')).toBe('—');
  });

  it('hides a raw reason and says it in plain words', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'done',
      progress: { read: 1, total: 1 },
      result: {
        photos: 1,
        fills: { saved: 0, waiting: 0, market: 0, alreadyReceived: 0, failed: 1 },
        failed: [{ seq: 1, reason: 'HTTP 500 at /tmp/photo.jpg' }],
      },
    });
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(
      await screen.findByText('1 photo: Some details could not be read.'),
    ).toBeInTheDocument();
  });
});
