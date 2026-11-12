import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Loader2, X } from 'lucide-react';
import { getUserRole } from '../utils/session';
import {
  attachActiveJob,
  dismiss,
  openDialog,
  pillTitleOf,
  summarise,
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
  const navigate = useNavigate();
  // What was said last, so every import is told about once.
  const told = useRef('');

  // On app load: an import that is still running is picked up again.
  useEffect(() => {
    if (!CAN_UPLOAD.includes(getUserRole())) return;
    attachActiveJob();
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

  const running = state.stage === 'uploading' || state.stage === 'reading';
  let title = '';
  let detail = '';
  if (state.stage === 'uploading') {
    title = `Uploading chat ${state.percent}%`;
  } else if (state.stage === 'reading') {
    title =
      state.progress.total > 0
        ? `Reading photos ${state.progress.read} / ${state.progress.total}`
        : 'Reading the photos…';
  } else if (state.stage === 'done') {
    const summary = summarise(state.result);
    title = pillTitleOf(summary);
    detail = summary.line;
  } else {
    title = state.failureHeading;
    detail = state.error || '';
  }

  const show = () => {
    openDialog();
    navigate('/mileage?chatUpload=open');
  };

  return (
    <div className="cui-pill" role="status">
      <button type="button" className="cui-main" onClick={show}>
        {running ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
        <span className="cui-title">{title}</span>
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
