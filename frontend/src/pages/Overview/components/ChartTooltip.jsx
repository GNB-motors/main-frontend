const ChartTooltip = ({ active, payload, label, formatter, labelFormatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border bg-background p-3 shadow-lg"
      style={{ borderColor: 'var(--hairline)', background: 'var(--cluster-panel)' }}
    >
      <p className="mb-1.5 text-xs font-medium text-dim">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-dim">{entry.name}:</span>
          <span className="num font-semibold">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ChartTooltip;
