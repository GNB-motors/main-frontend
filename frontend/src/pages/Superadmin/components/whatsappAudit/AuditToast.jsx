import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const AuditToast = ({ setToastMessage, toastMessage }) => (
  <aside
    aria-live="polite"
    style={{
      position: 'fixed',
      top: 24,
      right: 24,
      zIndex: 10001,
      padding: '12px 18px',
      borderRadius: 8,
      backgroundColor: toastMessage.type === 'error' ? '#991b1b' : '#166534',
      color: '#fff',
      fontSize: 13,
      fontWeight: 500,
      boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}
  >
    {toastMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
    {toastMessage.text}
    <button
      onClick={() => setToastMessage(null)}
      style={{
        background: 'none',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        marginLeft: 8,
      }}
    >
      <X size={14} />
    </button>
  </aside>
);

export default AuditToast;
