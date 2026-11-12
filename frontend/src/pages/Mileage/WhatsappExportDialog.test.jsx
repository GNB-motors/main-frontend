import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import WhatsappExportDialog from './WhatsappExportDialog';
import PhotoImportService from '../../services/PhotoImportService';

vi.mock('../../services/PhotoImportService', () => ({
  default: { uploadWhatsappExport: vi.fn(), getChatExportJob: vi.fn() },
}));

const zipFile = () => new File(['zip'], 'mehfuz-chat.zip', { type: 'application/zip' });

// A 500 MB+ file cannot be built in memory, so its size is stated.
const bigZip = () => {
  const file = new File(['zip'], 'big-chat.zip', { type: 'application/zip' });
  Object.defineProperty(file, 'size', { value: 501 * 1024 * 1024 });
  return file;
};

const answer = {
  filename: 'mehfuz-chat.zip',
  messages: 120,
  photos: 96,
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

const rowValue = (label) => {
  const head = screen.getByRole('rowheader', { name: label });
  return head.parentElement.querySelector('td').textContent;
};

describe('WhatsApp chat export dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The server answers at once with a job id: the import runs in the
    // background and the dialog follows it.
    PhotoImportService.uploadWhatsappExport.mockResolvedValue({ jobId: 'job-1' });
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'done',
      progress: { read: 96, total: 96 },
      result: answer,
    });
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
    expect(screen.getByText(/Sending the chat/)).toBeInTheDocument();

    act(() => progress({ loaded: 50, total: 100 }));
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  it('says how many photos have been read out of how many', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'running',
      progress: { read: 120, total: 603 },
    });
    open();
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByText('Reading photos 120 / 603')).toBeInTheDocument();
    expect(PhotoImportService.getChatExportJob).toHaveBeenCalledWith('job-1');
  });

  it('shows every count after a successful import', async () => {
    const file = zipFile();
    open();
    chooseFile(file);
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByText('Chat imported')).toBeInTheDocument();
    expect(rowValue('Messages')).toBe('120');
    expect(rowValue('Photos')).toBe('96');
    expect(rowValue('Fills saved')).toBe('40');
    expect(rowValue('Waiting for a person')).toBe('12');
    expect(rowValue('Market trucks')).toBe('3');
    expect(rowValue('Duty records')).toBe('5');
    expect(rowValue('Already received (skipped)')).toBe('7');
    expect(rowValue('Caption without photo')).toBe('2');
    expect(rowValue('Other files skipped')).toBe('4');
    expect(rowValue('Failed')).toBe('0');
    // Nothing was missing, so the line about missing photos is not shown.
    expect(screen.queryByText(/photos missing/)).not.toBeInTheDocument();
    expect(PhotoImportService.uploadWhatsappExport).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ onUploadProgress: expect.any(Function) }),
    );
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
    expect(rowValue('Failed')).toBe('1');
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

    expect(await screen.findByText('Chat imported')).toBeInTheDocument();
    expect(rowValue('Messages')).toBe('5');
    expect(rowValue('Market trucks')).toBe('—');
    expect(rowValue('Failed')).toBe('—');
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
    expect(alert).toHaveTextContent('Nothing was imported');
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

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'It may still be running — check the mileage list later',
    );
  });

  it('closing the dialog does not cancel the job, and opening it again shows the running import', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'running',
      progress: { read: 120, total: 603 },
    });
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <WhatsappExportDialog open onOpenChange={onOpenChange} />,
    );
    chooseFile(zipFile());
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    expect(await screen.findByText('Reading photos 120 / 603')).toBeInTheDocument();

    // Closing the dialog only stops the asking: the import keeps running.
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
});
