/**
 * Small presentational pieces shared by the Profile page's cards: a labelled
 * field row, a section header, and the active/inactive status pill.
 */

export const Field = (props) => {
  const { icon: Icon, label, value } = props;
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3.5 shadow-[0_1px_4px_rgba(41,64,211,0.06)] transition-shadow hover:shadow-[0_2px_10px_rgba(41,64,211,0.1)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-slate-800">
          {value || <span className="font-normal italic text-slate-300">Not provided</span>}
        </p>
      </div>
    </div>
  );
};

export const SectionHeader = (props) => {
  const { icon: Icon, title } = props;
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-500">
        <Icon size={13} />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
    </div>
  );
};

export const StatusBadge = ({ status }) => {
  const active = status?.toLowerCase() === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide
            ${active ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-600 ring-1 ring-amber-200'}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-amber-400'}`} />
      {status || 'Unknown'}
    </span>
  );
};
