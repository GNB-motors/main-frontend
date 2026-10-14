import renderIconSvg from './renderIconSvg.jsx';
import copyText from './copyText.js';

export default function ShareLinkDialog({
  shareDialog,
  setShareDialog,
  showToast,
  shareCreating,
  submitShareLink,
}) {
  return (
    <div className="sharedlg-scrim">
      <button
        type="button"
        className="sharedlg-scrimbtn"
        aria-label="Close share dialog"
        onClick={() => setShareDialog(null)}
      />
      <div className="sharedlg" role="dialog" aria-label="Share vehicle location">
        <div className="sharedlg-head">
          <div>
            <div className="sharedlg-title">Share live location</div>
            <div className="sharedlg-sub">{shareDialog.plate} · anyone with the link</div>
          </div>
          <button className="sharedlg-x" aria-label="Close" onClick={() => setShareDialog(null)}>
            {renderIconSvg('x', 16)}
          </button>
        </div>

        <div className="sharedlg-field">
          <span className="sharedlg-label">Link works for</span>
          <div className="sharedlg-opts">
            {[
              { k: 1, label: '24 hours' },
              { k: 7, label: '7 days' },
              { k: 30, label: '30 days' },
            ].map((o) => (
              <button
                key={o.k}
                aria-pressed={shareDialog.ttlDays === o.k}
                disabled={!!shareDialog.url}
                onClick={() => setShareDialog((p) => ({ ...p, ttlDays: o.k }))}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sharedlg-field">
          <span className="sharedlg-label">Show recorded trail</span>
          <div className="sharedlg-opts">
            {[
              { k: 0, label: 'Off' },
              { k: 6, label: 'Last 6h' },
              { k: 24, label: 'Last 24h' },
            ].map((o) => (
              <button
                key={o.k}
                aria-pressed={shareDialog.trailHours === o.k}
                disabled={!!shareDialog.url}
                onClick={() => setShareDialog((p) => ({ ...p, trailHours: o.k }))}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {shareDialog.url ? (
          <div className="sharedlg-result">
            <input
              className="sharedlg-url"
              aria-label="Shareable tracking link"
              readOnly
              value={shareDialog.url}
            />
            <button
              className="sharedlg-copy"
              onClick={() => {
                copyText(shareDialog.url).then(
                  () => showToast('Link copied'),
                  () => showToast('Could not copy — select the link and copy it'),
                );
              }}
            >
              {renderIconSvg('share', 15)}
              Copy
            </button>
          </div>
        ) : (
          <button className="sharedlg-create" disabled={shareCreating} onClick={submitShareLink}>
            {shareCreating ? 'Creating…' : 'Create link'}
          </button>
        )}
      </div>
    </div>
  );
}
