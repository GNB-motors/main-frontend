import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { C } from '../../utils/erpChartTheme';
import { num, pct } from '../../utils/formatMoney';

/**
 * CommandCenterPrimitives — the presentational atoms of the command center
 * (WS0.10 split). Extracted unchanged from the monolithic
 * CommandCenterPage; every visual decision documented inline is kept
 * verbatim. All data arrives via props; nothing here fetches.
 */

export const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-3 pb-3">
    <h2 className="console-eyebrow shrink-0">{children}</h2>
    <div className="h-px flex-1" style={{ background: C.grid }} />
  </div>
);

/**
 * Header bar *inside* a panel card.
 *
 * The two body columns previously carried their headings outside the cards, as
 * grid siblings — so the rules and the corner links ran together into one line
 * ("ORDER TO CASH — ERP Home  FLEET — Fleet Operations") and it was impossible
 * to tell which link belonged to which column. Bounding each heading inside its
 * own card makes the ownership obvious.
 */
export const PanelHeader = ({ title, to, linkLabel }) => (
  <div
    className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5"
    style={{ borderColor: C.grid }}
  >
    <h2 className="console-eyebrow">{title}</h2>
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold hover:underline"
      style={{ color: C.cat[0] }}
    >
      {linkLabel}
      <ArrowRight size={13} />
    </Link>
  </div>
);

/**
 * One trip stage.
 *
 * This replaced a horizontal bar chart. At real ERP volumes the counts are 0–3,
 * and a bar chart fails badly there: a zero-count stage draws no mark at all
 * (so four of six stages looked like empty rows), while a max of 1 makes the
 * surviving bars span the full width, reading as "everything is placed". A
 * count this small is a number, not a length — so show the number, and keep the
 * sequential ramp as a stage-order cue on the rule above it.
 */
export const StageCell = ({ label, count, color }) => (
  <div
    className="rounded-lg border px-3 py-2.5"
    style={{ borderColor: C.grid, background: count > 0 ? '#fff' : '#fafbfd' }}
  >
    <div className="h-[3px] w-7 rounded-full" style={{ background: count > 0 ? color : C.grid }} />
    <div
      className="num pt-2 text-[22px] font-semibold leading-none"
      style={{ color: count > 0 ? C.ink : '#c3cad8' }}
    >
      {count}
    </div>
    <div className="whitespace-nowrap pt-1 text-[11.5px] font-medium" style={{ color: C.muted }}>
      {label}
    </div>
  </div>
);

/**
 * Headline metric.
 *
 * Prominence comes from the type scale and a thin status accent, not from a
 * heavy filled panel — a near-black slab dominated the page and fought the
 * white cards below it. `tone` is only set when the metric actually carries a
 * status (money overdue, approvals waiting); otherwise the accent stays the
 * neutral house teal so colour keeps meaning something.
 */
export const HeroMetric = ({ icon: Icon, label, value, sub, tone }) => (
  <div className="relative flex-1 px-5 py-4 sm:px-6">
    <span
      className="absolute left-5 top-0 h-[3px] w-8 rounded-b sm:left-6"
      style={{ background: tone || C.cat[0] }}
      aria-hidden="true"
    />
    <div className="flex items-center gap-2 pb-2 pt-1">
      {Icon && <Icon size={14} strokeWidth={2.5} style={{ color: tone || C.cat[0] }} />}
      <span
        className="font-display text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: C.muted }}
      >
        {label}
      </span>
    </div>
    <div
      className="num text-[26px] font-semibold leading-none sm:text-[30px]"
      style={{ color: C.ink }}
    >
      {value}
    </div>
    {sub && (
      <div className="num pt-1.5 text-[12px]" style={{ color: tone || C.muted }}>
        {sub}
      </div>
    )}
  </div>
);

/** Small stat tile on a white surface. */
export const Tile = ({ icon: Icon, label, value, sub }) => (
  <div className="rounded-xl border p-3.5" style={{ borderColor: C.grid, background: '#fff' }}>
    <div className="flex items-center gap-1.5 pb-1.5">
      {Icon && <Icon size={13} strokeWidth={2.5} style={{ color: C.muted }} />}
      <span
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: C.muted }}
      >
        {label}
      </span>
    </div>
    <div className="num text-[20px] font-semibold leading-none" style={{ color: C.ink }}>
      {value}
    </div>
    {sub && (
      <div className="num pt-1 text-[11.5px]" style={{ color: C.muted }}>
        {sub}
      </div>
    )}
  </div>
);

/**
 * Segmented proportion bar + legend.
 *
 * Segments are separated by a 2px surface gap rather than sitting flush, so
 * adjacent fills stay readable. Each legend row states its own label and value,
 * so the split is never communicated by colour alone.
 */
export const ProportionBar = ({
  segments,
  total,
  formatValue = num,
  emptyLabel = 'Nothing outstanding',
}) => {
  const sum = total ?? segments.reduce((a, s) => a + (s.value || 0), 0);

  if (!sum) {
    return (
      <div className="py-2">
        <div className="h-2.5 w-full rounded-full" style={{ background: C.grid }} />
        <p className="pt-3 text-[12.5px]" style={{ color: C.muted }}>
          {emptyLabel}
        </p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full">
        {segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.label}
              title={`${s.label}: ${formatValue(s.value)}`}
              style={{ width: `${pct(s.value, sum)}%`, background: s.color, minWidth: 3 }}
            />
          ) : null,
        )}
      </div>
      <ul className="flex flex-col gap-1.5 pt-3">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-[12.5px]">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: s.color }}
              aria-hidden="true"
            />
            <span style={{ color: C.inkSoft }}>{s.label}</span>
            <span className="num ml-auto font-semibold" style={{ color: C.ink }}>
              {formatValue(s.value)}
            </span>
            <span className="num w-11 text-right" style={{ color: C.muted }}>
              {pct(s.value, sum).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Action-queue row: a count that links to where the work gets done. */
export const QueueChip = ({ label, count, to, urgent }) => (
  <Link
    to={to}
    className="group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-slate-50"
    style={{ borderColor: C.grid }}
  >
    <span
      className="num inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md px-1.5 text-[13px] font-bold"
      style={{
        // A pending count is not a "good" outcome, so it wears the brand hue,
        // not the status-green. Green here is reserved for genuine good state.
        background: count > 0 ? (urgent ? '#fdecec' : C.catSoft) : '#f1f3f7',
        color: count > 0 ? (urgent ? C.signal.critical : C.cat[0]) : C.muted,
      }}
    >
      {num(count)}
    </span>
    <span className="text-[13px] font-medium" style={{ color: C.inkSoft }}>
      {label}
    </span>
    <ArrowRight
      size={14}
      className="ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
      style={{ color: C.muted }}
    />
  </Link>
);

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
export const PageSkeleton = () => (
  <div className="space-y-6 p-3 sm:p-5">
    <Skeleton className="h-9 w-64" />
    <Skeleton className="h-28 w-full rounded-2xl" />
    <div className="grid gap-5 xl:grid-cols-2">
      <Skeleton className="h-80 w-full rounded-2xl" />
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
    <div className="grid gap-5 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-52 w-full rounded-2xl" />
      ))}
    </div>
  </div>
);
