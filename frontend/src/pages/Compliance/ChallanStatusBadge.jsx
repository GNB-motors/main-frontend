import { statusMeta, TONE } from './challanStatus';

export default function ChallanStatusBadge({ status }) {
  const meta = statusMeta(status);
  const { Icon } = meta;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${TONE[meta.tone]}`}
    >
      <Icon className="w-3 h-3" />
      <span>{meta.label}</span>
    </span>
  );
}
