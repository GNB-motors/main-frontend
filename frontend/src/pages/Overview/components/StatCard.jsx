import React from "react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Flat console KPI tile.
 * No pastel icon chip, no trend arrow — a quiet display-font label over a
 * big tabular-mono number, with a thin teal accent rule. The number is the
 * subject; the chrome stays out of its way.
 */
export const StatCard = ({ label, value, sub, icon }) => (
  <Card className="relative overflow-hidden">
    <span
      aria-hidden="true"
      className="absolute left-0 top-0 h-full w-[3px]"
      style={{ background: "var(--accent)" }}
    />
    <CardContent className="p-4 pl-5">
      <div className="flex items-start justify-between">
        <p className="console-eyebrow">{label}</p>
        {icon && <span className="text-slate-300">{icon}</span>}
      </div>
      <p
        className="num mt-3 text-[26px] font-semibold leading-none"
        style={{ color: "var(--ink)" }}
      >
        {value}
      </p>
      {sub && <p className="num mt-2 text-[11px] font-medium text-slate-400">{sub}</p>}
    </CardContent>
  </Card>
);

export default StatCard;
