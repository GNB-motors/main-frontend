/** Emission-norm cell: the vendor text, plus a BS-VI badge when known. */
export default function EmissionNorm({ norm, bs6 }) {
  if (!bs6) return norm || null;
  return (
    <span className="flex items-center gap-1">
      {norm}
      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
        BS-VI
      </span>
    </span>
  );
}
