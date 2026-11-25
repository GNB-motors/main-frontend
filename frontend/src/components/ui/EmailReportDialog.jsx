import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { toast } from 'react-toastify';
import NewButton from './NewButton/NewButton';
import { getUserEmail } from '../../utils/session';
import { parseRecipients, isEmail, MAX_RECIPIENTS } from './recipients';
import { ReportEmailService } from '../../services/ReportEmailService';
import './EmailReportDialog.css';

/**
 * Email a report.
 *
 * Two modes, one dialog:
 *  - `server` = { report, params } — the server builds the file, from the same
 *    filters the on-screen download used;
 *  - `buildFile()` → { blob, filename } — the browser builds the file and
 *    uploads it.
 *
 * The dialog is mounted when it opens, so its state starts from the props it
 * was opened with (the viewer's own address, an empty note) — a setter-only
 * effect would leave the previous send's recipients in the box.
 *
 * Nothing is dropped silently: an address that is not an address, and a list
 * longer than the maximum, are shown and block the send.
 */
export default function EmailReportDialog({
  label,
  server = null,
  buildFile = null,
  onClose,
}) {
  const [list, setList] = useState(() => {
    const me = getUserEmail();
    return me && isEmail(me) ? [me.trim().toLowerCase()] : [];
  });
  const [draft, setDraft] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const addDraft = () => {
    const { valid, invalid } = parseRecipients(draft);
    if (invalid.length) {
      setError(`Not an email address: ${invalid.join(', ')}`);
      return;
    }
    const next = [...new Set([...list, ...valid])];
    if (next.length > MAX_RECIPIENTS) {
      // The addresses stay in the box: the user sees what did not fit.
      setError(`At most ${MAX_RECIPIENTS} addresses.`);
      return;
    }
    setList(next);
    setDraft('');
    setError('');
  };

  const remove = (email) => setList(list.filter((e) => e !== email));

  const send = async () => {
    if (busy) return;
    const { valid, invalid } = parseRecipients(draft);
    if (invalid.length) {
      setError(`Not an email address: ${invalid.join(', ')}`);
      return;
    }
    const to = [...new Set([...list, ...valid])];
    if (!to.length) {
      setError('Add at least one email address.');
      return;
    }
    if (to.length > MAX_RECIPIENTS) {
      setError(`At most ${MAX_RECIPIENTS} addresses.`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (server) {
        await ReportEmailService.sendServerReport({
          report: server.report,
          params: server.params,
          to,
          note: note.trim() || undefined,
        });
      } else {
        const file = await buildFile();
        await ReportEmailService.sendFile({
          blob: file.blob,
          filename: file.filename,
          to,
          reportLabel: label,
          note: note.trim() || undefined,
        });
      }
      toast.success(
        `Sending ${label} to ${to.length} ${to.length === 1 ? 'person' : 'people'}`,
      );
      onClose();
    } catch (err) {
      // The recipients and the note survive a failed send, so the user can try
      // again without typing them again.
      setError(
        err?.status === 429
          ? 'Too many report emails this hour. Try again later.'
          : err?.message || 'Could not send the report.',
      );
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    if (busy) return;
    onClose();
  };

  return (
    <div
      className="erd-overlay"
      role="button"
      tabIndex={-1}
      aria-label="Close dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          close();
          return;
        }
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          close();
        }
      }}
    >
      <div
        className="erd-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="erd-title"
      >
        <div className="erd-header">
          <h4 id="erd-title" className="erd-title">
            <Mail size={16} aria-hidden="true" /> Email {label}
          </h4>
          <button
            type="button"
            className="erd-close"
            onClick={close}
            disabled={busy}
            aria-label="Close"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <p className="erd-hint">
          The Excel file goes as an attachment, with the filters you have on screen. Big files
          arrive as a download link that works for 7 days.
        </p>

        <label htmlFor="erd-to" id="erd-to-label" className="erd-label">
          To
        </label>
        <div className="erd-chips">
          {list.map((email) => (
            <span key={email} className="erd-chip">
              {email}
              <button
                type="button"
                className="erd-chip-remove"
                onClick={() => remove(email)}
                disabled={busy}
                aria-label={`Remove ${email}`}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))}
          <input
            id="erd-to"
            aria-labelledby="erd-to-label"
            className="erd-input"
            value={draft}
            placeholder={list.length ? 'Add another…' : 'name@company.com'}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (['Enter', ',', ';'].includes(e.key)) {
                e.preventDefault();
                addDraft();
              }
            }}
            onBlur={() => draft.trim() && addDraft()}
            disabled={busy}
          />
        </div>

        <label htmlFor="erd-note" id="erd-note-label" className="erd-label">
          Note (optional)
        </label>
        <textarea
          id="erd-note"
          aria-labelledby="erd-note-label"
          className="erd-note"
          maxLength={500}
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Shown at the top of the email"
          disabled={busy}
        />

        {error ? (
          <p className="erd-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="erd-actions">
          <NewButton
            variant="secondary"
            size="md"
            type="button"
            text="Cancel"
            onClick={close}
            disabled={busy}
          />
          <NewButton
            variant="primary"
            size="md"
            type="button"
            text={busy ? 'Sending…' : 'Send'}
            onClick={send}
            disabled={busy}
            loading={busy}
          />
        </div>
      </div>
    </div>
  );
}
