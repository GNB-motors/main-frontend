import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import ChatUploadIndicator from './ChatUploadIndicator';
import PhotoImportService from '../services/PhotoImportService';
import * as chatUpload from '../pages/Mileage/chatUploadStore';

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('../services/PhotoImportService', () => ({
  default: {
    uploadWhatsappExport: vi.fn(),
    getChatExportJob: vi.fn(),
    getActiveChatExportJob: vi.fn(),
  },
}));

vi.mock('../utils/session', async (importOriginal) => ({
  ...(await importOriginal()),
  getUserRole: vi.fn(() => 'OWNER'),
}));

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

vi.mock('../pages/Mileage/chatExportStream', () => ({
  MAX_PHOTO_ROWS: 200,
  openChatExportStream: (...args) => streamMock.open(...args),
}));

const zipFile = () => new File(['zip'], 'mehfuz-chat.zip', { type: 'application/zip' });

const Where = () => {
  const location = useLocation();
  return <span data-testid="where">{`${location.pathname}${location.search}`}</span>;
};

const renderPill = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <ChatUploadIndicator />
              <Where />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

// Send a chat and let the store follow it. A chat that is still on its way
// (pending) never finishes, so the progress of the bytes can be shown.
const sendChat = async ({ pending = false } = {}) => {
  let progress = null;
  PhotoImportService.uploadWhatsappExport.mockImplementation((_file, options) => {
    progress = options.onUploadProgress;
    return pending ? new Promise(() => {}) : Promise.resolve({ jobId: 'job-1' });
  });
  await act(async () => {
    chatUpload.startUpload(zipFile());
    await Promise.resolve();
  });
  return progress;
};

describe('the pill of the chat upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    streamMock.calls.length = 0;
    chatUpload.reset();
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'running',
      progress: { read: 120, total: 589 },
    });
    PhotoImportService.getActiveChatExportJob.mockResolvedValue({ jobId: null });
  });

  it('is hidden when there is no upload', () => {
    renderPill();
    expect(screen.queryByText(/Uploading chat/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Reading photos/)).not.toBeInTheDocument();
  });

  it('says how much of the chat is on its way', async () => {
    renderPill();
    const progress = await sendChat({ pending: true });

    act(() => progress({ loaded: 45, total: 100 }));
    expect(screen.getByText('Uploading chat 45%')).toBeInTheDocument();
  });

  it('says how many photos are being read', async () => {
    renderPill();
    await sendChat();

    await waitFor(() => expect(screen.getByText('Reading photos 120 / 589')).toBeInTheDocument());
  });

  it('turns into the end of the import when it is over', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'done',
      progress: { read: 589, total: 589 },
      result: {
        photos: 589,
        photoBuckets: { saved: 40, waiting: 12, alreadyReceived: 537 },
        fills: { saved: 12, waiting: 40, alreadyReceived: 0 },
        failed: [],
      },
    });
    renderPill();
    await sendChat();

    await waitFor(() =>
      expect(screen.getByText('Chat imported: 12 saved, 40 waiting')).toBeInTheDocument(),
    );
    // The end of it can be looked at, or put away.
    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Put the chat upload away' }),
    ).toBeInTheDocument();
  });

  it('says nothing new when the chat brings nothing new', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'done',
      progress: { read: 5, total: 5 },
      result: {
        photos: 5,
        photoBuckets: { alreadyReceived: 5 },
        fills: { saved: 0, waiting: 0, alreadyReceived: 5 },
        failed: [],
      },
    });
    renderPill();
    await sendChat();

    await waitFor(() =>
      expect(screen.getByText('Nothing new in this chat')).toBeInTheDocument(),
    );
  });

  it('says the failure in plain words', async () => {
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'failed',
      progress: { read: 0, total: 0 },
      errorCode: 'READER_DOWN',
      error:
        'The photo reader is not running, so nothing was imported. Start it and upload the chat again.',
    });
    renderPill();
    await sendChat();

    await waitFor(() => expect(screen.getByText('Nothing was imported')).toBeInTheDocument());
  });

  it('tells the owner when the import is over', async () => {
    const { toast } = await import('react-toastify');
    PhotoImportService.getChatExportJob.mockResolvedValue({
      state: 'done',
      progress: { read: 2, total: 2 },
      result: {
        photos: 2,
        photoBuckets: { saved: 2 },
        fills: { saved: 2, waiting: 0 },
        failed: [],
      },
    });
    renderPill();
    await sendChat();

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Chat imported: 2 saved');
  });

  it('opens the dialog when it is clicked', async () => {
    renderPill();
    await sendChat();

    await waitFor(() => expect(screen.getByText('Reading photos 120 / 589')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Reading photos 120 / 589'));

    expect(chatUpload.getState().dialogOpen).toBe(true);
    expect(screen.getByTestId('where').textContent).toBe('/mileage?chatUpload=open');
  });

  it('picks the import that is running up again after a reload', async () => {
    PhotoImportService.getActiveChatExportJob.mockResolvedValue({
      jobId: 'job-9',
      state: 'running',
      progress: { read: 12, total: 589 },
    });
    renderPill();

    await waitFor(() => expect(chatUpload.getState().jobId).toBe('job-9'));
    expect(streamMock.calls[0].jobId).toBe('job-9');
  });
});
