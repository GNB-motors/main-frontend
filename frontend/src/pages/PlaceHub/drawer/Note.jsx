import { Info, ShieldAlert } from 'lucide-react';

export default function Note({ children, tone = 'info' }) {
  const Icon = tone === 'crit' ? ShieldAlert : Info;
  return (
    <p className={`ph-callout ph-callout--${tone}`}>
      <Icon size={14} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
