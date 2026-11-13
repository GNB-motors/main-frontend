import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Loader2, X } from 'lucide-react';
import { getUserRole } from '../utils/session';
import {
  attachActiveJob,
  dismiss,
  openDialog,
  pillTitleOf,
  readingProgressPercent,
  readingProgressText,
  summarise,
  uploadProgressText,
  useChatUpload,
} from '../pages/Mileage/chatUploadStore';
import './ChatUploadIndicator.css';

// The roles that may send a chat: the same ones the server lets upload.
const CAN_UPLOAD = ['OWNER', 'MANAGER'];

/**
 * The little pill at the bottom of the page.
 *
 * It says what the chat upload is doing while it is doing it, so the owner
 * can go on working in another part of the site: the upload belongs to the
 * session, not to the page. Clicking the pill opens the dialog, which shows
 * the import as it is.
 */
export default function ChatUploadIndicator() {
  const state = useChatUpload();
  // What was said last, so every import is told about once.
  const told = useRef('');

  // On app load: an import that is still running is picked up again.
  useEffect(() => {
    if (!CAN_UPLOAD.includes(getUserRole())) return undefined;
    const controller = new AbortController();
    attachActiveJob(controller.signal);
    return () => controller.abort();
  }, []);

  // The word when the import is over.
  useEffect(() => {
    if (state.stage === 'done' && state.result) {
      const key = `done:${state.runId}`;
      if (told.current === key) return;
      told.current = key;
      toast.success(pillTitleOf(summarise(state.result)));
      return;
    }
    if (state.stage === 'failed' || state.stage === 'unreachable') {
      const key = `failed:${state.runId}`;
      if (told.current === key) return;
      told.current = key;
      toast.error(state.error || state.failureHeading);
    }
  }, [state.stage, state.result, state.error, state.failureHeading, state.runId]);

  if (state.dismissed || !state.stage || state.stage === 'idle') return null;

  const running = state.stage === 'uploading' || state.stage === 'queued' || state.stage === 'reading';
  let title = '';
  let detail = '';
  if (state.stage === 'checking') {
    title = 'Checking upload…';
  } else if (state.stage === 'uploading') {
    title = uploadProgressText(state.percent);
  } else if (state.stage === 'queued') {
    title = 'Waiting to start…';
  } else if (state.stage === 'reading') {
    title = readingProgressText(state.progress);
  } else if (state.stage === 'done') {
    const summary = summarise(state.result);
    title = pillTitleOf(summary);
    detail = summary.line;
  } else {
    title = state.failureHeading;
    detail = state.error || '';
  }

  const readingPercent =
    state.stage === 'reading' ? readingProgressPercent(state.progress) : null;
  const uploadPercent =
    state.stage === 'uploading' &&
    state.percent !== null &&
    state.percent !== undefined &&
    Number.isFinite(Number(state.percent))
      ? Math.min(100, Math.max(0, Number(state.percent)))
      : null;
  const barPercent = readingPercent ?? uploadPercent;
  const indeterminate = state.stage === 'reading' && readingPercent === null;
  const show = () => openDialog();

  return (
    <div className="cui-pill" role="status">
      <button
        type="button"
        className={`cui-main${barPercent !== null || indeterminate ? ' cui-main--progress' : ''}`}
        onClick={show}
      >
        <span className="cui-main-line">
          {running ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
          <span className="cui-title">{title}</span>
        </span>
        {barPercent !== null || indeterminate ? (
          <span className={`cui-bar${indeterminate ? ' cui-bar--indeterminate' : ''}`} aria-hidden="true">
            <span
              className="cui-bar-fill"
              style={barPercent !== null ? { width: `${barPercent}%` } : undefined}
            />
          </span>
        ) : null}
      </button>
      {detail ? <span className="cui-detail">{detail}</span> : null}
      {running ? null : (
        <>
          <button type="button" className="cui-view" onClick={show}>
            View
          </button>
          <button
            type="button"
            className="cui-close"
            aria-label="Put the chat upload away"
            onClick={dismiss}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
