import { FileText, Paperclip } from 'lucide-react';
import { formatBytes } from '../../lib/supportTicket';
import './support.css';

/**
 * Server-side attachments (presigned, short-lived URLs). A file whose URL could
 * not be signed renders as a plain chip instead of a broken link.
 */
export default function AttachmentList({ attachments = [] }) {
  if (attachments.length === 0) return null;
  return (
    <div className="sp-attachments">
      {attachments.map((file) => {
        const isImage = file.mimeType?.startsWith('image/');
        const inner = (
          <>
            {isImage && file.url ? (
              <img className="sp-attachment-thumb" src={file.url} alt={file.name || 'Attachment'} />
            ) : (
              <span className="sp-attachment-icon" aria-hidden="true">
                {isImage ? <Paperclip size={16} /> : <FileText size={16} />}
              </span>
            )}
            <span className="sp-attachment-name">{file.name || 'Attachment'}</span>
            {file.size ? (
              <span className="sp-attachment-size">{formatBytes(file.size)}</span>
            ) : null}
          </>
        );
        return file.url ? (
          <a
            key={file.id}
            className="sp-attachment"
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {inner}
          </a>
        ) : (
          <span key={file.id} className="sp-attachment">
            {inner}
          </span>
        );
      })}
    </div>
  );
}
