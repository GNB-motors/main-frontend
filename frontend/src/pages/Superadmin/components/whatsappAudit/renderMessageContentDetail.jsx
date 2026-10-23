import { CheckCircle2, Copy, FileText, ImageIcon, MapPin, MousePointerClick } from 'lucide-react';
import { relativeTime } from './waAuditFormat';

// Render rich message content inside the trace inspection view
const renderMessageContentDetail = (req, draft, copiedId, copyToClipboard) => {
  if (!req)
    return <div style={{ color: 'var(--wa-text-muted)', fontSize: 12 }}>No message content</div>;
  const type = req.messageType || 'text';
  const payload = req.payload || {};

  let textBody = '';
  if (typeof payload === 'string') {
    textBody = payload;
  } else if (payload?.text?.body) {
    textBody = payload.text.body;
  } else if (payload?.body) {
    textBody = payload.body;
  } else if (payload?.caption) {
    textBody = payload.caption;
  }

  const buttonReply = payload?.interactive?.button_reply;
  const listReply = payload?.interactive?.list_reply;
  const image = payload?.image;
  const document = payload?.document;
  const location = payload?.location;

  return (
    <div className="wa-msg-content-box">
      {/* WhatsApp Chat Speech Bubble */}
      <div className="wa-chat-bubble">
        {type === 'text' && (
          <div className="wa-chat-bubble__text">
            {textBody || (
              <span style={{ fontStyle: 'italic', color: 'var(--wa-text-muted)' }}>
                Empty text message
              </span>
            )}
          </div>
        )}

        {type === 'interactive' && (
          <div className="wa-chat-bubble__interactive">
            {buttonReply && (
              <div>
                <div className="wa-bubble-badge">
                  <MousePointerClick size={12} />
                  <span>Quick Reply Selected</span>
                </div>
                <div className="wa-bubble-choice-title">&quot;{buttonReply.title}&quot;</div>
                <div className="wa-bubble-choice-id">
                  Button ID: <code>{buttonReply.id}</code>
                </div>
              </div>
            )}
            {listReply && (
              <div>
                <div className="wa-bubble-badge">
                  <MousePointerClick size={12} />
                  <span>List Option Chosen</span>
                </div>
                <div className="wa-bubble-choice-title">&quot;{listReply.title}&quot;</div>
                {listReply.description && (
                  <div className="wa-bubble-choice-desc">{listReply.description}</div>
                )}
                <div className="wa-bubble-choice-id">
                  Item ID: <code>{listReply.id}</code>
                </div>
              </div>
            )}
            {!buttonReply && !listReply && (
              <div className="wa-chat-bubble__text">
                Interactive Response (
                {typeof payload.interactive === 'object'
                  ? JSON.stringify(payload.interactive)
                  : 'Action'}
                )
              </div>
            )}
          </div>
        )}

        {type === 'image' && (
          <div className="wa-chat-bubble__media">
            <div className="wa-media-head">
              <ImageIcon size={20} color="#059669" />
              <div>
                <strong>Fuel Receipt / Bill Image</strong>
                <div className="wa-media-sub">
                  {image?.mime_type || 'image/jpeg'}
                  {image?.id ? ` • ID: ${image.id.slice(-8)}` : ''}
                </div>
              </div>
            </div>
            {(image?.caption || draft?.extractedText) && (
              <div className="wa-media-caption">
                &quot;{image?.caption || draft?.extractedText}&quot;
              </div>
            )}
            {draft && (
              <div className="wa-media-draft-badge">
                <span>Draft Extracted: </span>
                <strong>{draft.vehicleReg || 'Pending'}</strong>
                {draft.amount ? ` • ₹${draft.amount.toLocaleString()}` : ''}
                {draft.litres ? ` • ${draft.litres}L` : ''}
              </div>
            )}
          </div>
        )}

        {type === 'location' && (
          <div className="wa-chat-bubble__media">
            <div className="wa-media-head">
              <MapPin size={20} color="#2563eb" />
              <div>
                <strong>{location?.name || 'GPS Location Coordinate'}</strong>
                <div className="wa-media-sub">{location?.address || 'Geolocation coordinate'}</div>
              </div>
            </div>
            {location?.latitude && location?.longitude && (
              <div className="wa-media-caption">
                📍 Latitude: {location.latitude}, Longitude: {location.longitude}
              </div>
            )}
          </div>
        )}

        {type === 'document' && (
          <div className="wa-chat-bubble__media">
            <div className="wa-media-head">
              <FileText size={20} color="#d97706" />
              <div>
                <strong>{document?.filename || 'Document Attachment'}</strong>
                <div className="wa-media-sub">{document?.mime_type || 'application/pdf'}</div>
              </div>
            </div>
            {document?.caption && (
              <div className="wa-media-caption">&quot;{document.caption}&quot;</div>
            )}
          </div>
        )}

        <div className="wa-chat-bubble__meta">
          <span>{relativeTime(req.receivedAt)}</span>
          <CheckCircle2 size={11} color="#16a34a" />
        </div>
      </div>

      {/* WAMID Copy Row */}
      <div className="wa-wamid-row">
        <span className="wa-wamid-lbl">Meta Provider WAMID:</span>
        <code className="wa-wamid-code" title={req.wamid}>
          {req.wamid || '—'}
        </code>
        {req.wamid && (
          <button
            type="button"
            className="wa-copy-btn"
            onClick={() => copyToClipboard(req.wamid, 'drawer-wamid')}
            title="Copy WAMID"
          >
            {copiedId === 'drawer-wamid' ? (
              <CheckCircle2 size={12} color="#16a34a" />
            ) : (
              <Copy size={12} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default renderMessageContentDetail;
