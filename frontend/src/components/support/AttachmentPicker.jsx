import { useId, useRef, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILES,
  formatBytes,
  mergeFiles,
  selectedFileKey,
} from '../../lib/supportTicket';
import './support.css';

/**
 * Click-or-drop file picker for ticket attachments. Rejected files are named
 * with the reason inline (type, size, count) rather than in a toast, because a
 * toast sits under the full-screen support dialog.
 */
export default function AttachmentPicker({ files, onChange, disabled = false }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState([]);

  const add = (picked) => {
    const result = mergeFiles(files, Array.from(picked || []));
    setErrors(result.errors);
    onChange(result.files);
  };

  const remove = (file) => {
    setErrors([]);
    onChange(files.filter((f) => selectedFileKey(f) !== selectedFileKey(file)));
  };

  return (
    <div>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={ACCEPTED_FILE_TYPES.join(',')}
        aria-label="Attach files"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        className={`sp-drop${dragging ? ' sp-drop--active' : ''}`}
        disabled={disabled || files.length >= MAX_FILES}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) add(e.dataTransfer.files);
        }}
      >
        <Paperclip size={15} aria-hidden="true" />
        <span>
          <span className="sp-drop-cta">Click to add files</span> or drag them here · images or PDF,
          up to 10 MB each, {MAX_FILES} max
        </span>
      </button>

      {files.length > 0 ? (
        <div className="sp-picked">
          {files.map((file) => (
            <span key={selectedFileKey(file)} className="sp-picked-chip">
              <span title={file.name}>{file.name}</span>
              <span className="sp-attachment-size">{formatBytes(file.size)}</span>
              <button
                type="button"
                className="sp-picked-remove"
                aria-label={`Remove ${file.name}`}
                onClick={() => remove(file)}
                disabled={disabled}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {errors.length > 0 ? (
        <ul className="sp-field-errors" role="alert">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
