import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import AttachmentPicker from './AttachmentPicker';
import './support.css';

const MAX_BODY = 5000;

/**
 * Reply box for a ticket thread. `onSend(body, files)` returns a promise; the
 * box clears only when it resolves, so a failed send keeps what was typed.
 * `extra` slots controls next to the send button (the support desk's status picker).
 */
export default function ReplyComposer({
  onSend,
  sending = false,
  error = null,
  placeholder = 'Write a reply…',
  submitLabel = 'Send reply',
  extra = null,
}) {
  const [body, setBody] = useState('');
  const [files, setFiles] = useState([]);
  const canSend = body.trim().length > 0 && !sending;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSend) return;
    try {
      await onSend(body, files);
      setBody('');
      setFiles([]);
    } catch {
      // `error` (from the caller's useMutation) renders below; keep the draft.
    }
  };

  return (
    <form className="sp-composer" onSubmit={submit}>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
        placeholder={placeholder}
        aria-label="Reply"
        rows={4}
        disabled={sending}
      />
      <AttachmentPicker files={files} onChange={setFiles} disabled={sending} />
      {error ? (
        <p className="sp-field-errors" role="alert">
          {error.displayMessage || 'Could not send the reply. Try again.'}
        </p>
      ) : null}
      <div className="sp-composer-actions">
        {extra}
        <Button type="submit" disabled={!canSend}>
          <Send size={15} aria-hidden="true" />
          {sending ? 'Sending…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
