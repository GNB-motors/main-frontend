import { CircleAlert } from 'lucide-react';

export default function Empty({ icon = CircleAlert, title, body, action }) {
  const Icon = icon;
  return (
    <div className="ph-empty">
      <span className="ph-empty-icon">
        <Icon size={20} />
      </span>
      <strong>{title}</strong>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}
