import React from "react";
import { Link } from "react-router-dom";
import { FileWarning, Gauge, ChevronRight, ShieldCheck, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const TYPE_META = {
  FUEL_REVIEW: { label: "Slip needs review", Icon: FileWarning },
  FUEL_OUTLIER: { label: "Abnormal fuel efficiency", Icon: Gauge },
};

const SEV_COLOR = {
  HIGH: "var(--signal-high)",
  MEDIUM: "var(--signal-med)",
  LOW: "var(--signal-low)",
};

const relativeTime = (ts) => {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(ts).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};

const RailRow = ({ item }) => {
  const meta = TYPE_META[item.type] || { label: item.title, Icon: AlertTriangle };
  const Icon = meta.Icon;
  const sev = SEV_COLOR[item.severity] || SEV_COLOR.LOW;
  return (
    <Link
      to={item.link || "#"}
      className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5
                 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
    >
      <span
        aria-hidden="true"
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{ background: sev }}
      />
      <span
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `color-mix(in srgb, ${sev} 12%, transparent)`, color: sev }}
      >
        <Icon size={15} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[13px] font-semibold leading-tight" style={{ color: "var(--ink)" }}>
            {meta.label}
          </span>
          {item.vehicleNumber && <span className="reg-plate">{item.vehicleNumber}</span>}
        </div>
        {item.subtitle && (
          <p className="num mt-0.5 truncate text-[11px] font-medium text-slate-500">{item.subtitle}</p>
        )}
        {item.driverName && (
          <p className="mt-0.5 truncate text-[11px] text-slate-400">{item.driverName}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 pl-1">
        {item.metric && (
          <span className="num text-[13px] font-bold leading-none" style={{ color: sev }}>
            {item.metric.value}
          </span>
        )}
        <span className="num text-[10px] font-medium text-slate-400">{relativeTime(item.timestamp)}</span>
      </div>
      <ChevronRight
        size={16}
        className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
      />
    </Link>
  );
};

const HeaderChip = ({ counts }) => {
  const high = counts?.high || 0;
  const total = counts?.total || 0;
  if (total === 0) {
    return (
      <span
        className="num flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
        style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent-dark)" }}
      >
        <ShieldCheck size={13} /> Clear
      </span>
    );
  }
  const color = high > 0 ? "var(--signal-high)" : "var(--signal-med)";
  return (
    <span
      className="num rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
    >
      {total} open{high > 0 ? ` · ${high} high` : ""}
    </span>
  );
};

const ExceptionsRail = ({ data, loading, error }) => {
  const items = data?.items || [];
  const counts = data?.counts;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} style={{ color: "var(--signal-med)" }} strokeWidth={2.4} />
          <span className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
            Needs Attention
          </span>
        </div>
        {!loading && !error && <HeaderChip counts={counts} />}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 pt-0" style={{ maxHeight: 512 }}>
        {loading ? (
          <div className="space-y-2.5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-slate-400">
            <AlertTriangle size={28} className="opacity-40" />
            <p className="text-xs font-medium">Couldn't load exceptions</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 py-10 text-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }}
            >
              <ShieldCheck size={26} />
            </span>
            <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              All clear
            </p>
            <p className="max-w-[220px] text-xs font-medium text-slate-400">
              Every fuel slip checks out — nothing needs your review.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => (
              <RailRow key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExceptionsRail;
