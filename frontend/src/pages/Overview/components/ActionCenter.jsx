import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Wrench,
  TrendingDown,
  ShieldCheck,
  ReceiptText,
  ChevronRight,
} from 'lucide-react';
import { Panel } from './overview.primitives.jsx';
import { formatInrCompact, formatPct, formatNum } from '../../../utils/formatters';

const TONE_COLOR = {
  critical: 'var(--critical)',
  caution: 'var(--caution)',
  ok: 'var(--ok)',
};

const TARGET_UTIL_PCT = 75; // fleet utilization target — see UtilizationPanel

/**
 * Derive the attention list from the data we already have. Every item is real —
 * no invented issues. Positive "all clear" items are included so the panel reads
 * as a status board, not just a problem list.
 */
function buildItems({ utilization, downtime, money }) {
  const items = [];
  const fleet = utilization?.fleet;
  const emptyPct = fleet?.emptyKmPct ?? 0;

  // 1. Empty running
  if (fleet?.totalKm > 0 && emptyPct >= 15) {
    items.push({
      id: 'empty-running',
      tone: emptyPct >= 30 ? 'critical' : 'caution',
      icon: TrendingDown,
      title: 'High empty running',
      detail: `${formatPct(emptyPct, { decimals: 1 })} of distance empty · ${formatInrCompact(fleet.emptyKmWasteInr)} waste`,
      cta: 'View utilization',
      to: '/vehicles',
    });
  }

  // 2. Downtime risk — surface the single costliest at-risk vehicle
  const topDown = downtime?.vehicles?.[0];
  if (topDown) {
    items.push({
      id: 'downtime',
      tone: topDown.risk === 'OVERDUE' ? 'critical' : 'caution',
      icon: Wrench,
      title: 'Downtime risk',
      detail: `${topDown.registrationNumber} · exposure ${formatInrCompact(topDown.exposureInr)}`,
      cta: 'Review issue',
      to: `/vehicles/${encodeURIComponent(topDown.registrationNumber)}`,
    });
  }

  // 3. Low utilization count — vehicles below target
  const below = (utilization?.vehicles || []).filter(
    (v) => v.totalKm > 0 && 100 - v.emptyKmPct < TARGET_UTIL_PCT,
  ).length;
  if (below > 0) {
    items.push({
      id: 'low-util',
      tone: 'caution',
      icon: AlertTriangle,
      title: 'Low utilization',
      detail: `${formatNum(below)} vehicle${below > 1 ? 's' : ''} below ${TARGET_UTIL_PCT}% target`,
      cta: 'View vehicles',
      to: '/vehicles',
    });
  }

  // 4/5. Integrity all-clears (or warnings)
  const theft = money?.money?.theftLossInr ?? 0;
  const fraud = money?.money?.billFraudSuspectInr ?? 0;
  items.push(
    theft > 0
      ? {
          id: 'theft',
          tone: 'critical',
          icon: AlertTriangle,
          title: 'Suspected fuel theft',
          detail: `${formatInrCompact(theft)} estimated loss`,
          cta: 'Investigate',
          to: '/fuel-integrity',
        }
      : { id: 'theft', tone: 'ok', icon: ShieldCheck, title: 'No theft detected', detail: 'Fuel telemetry within expected bounds', cta: null },
  );
  items.push(
    fraud > 0
      ? {
          id: 'fraud',
          tone: 'critical',
          icon: ReceiptText,
          title: 'Suspected bill fraud',
          detail: `${formatInrCompact(fraud)} flagged`,
          cta: 'Review bills',
          to: '/fuel-integrity',
        }
      : { id: 'fraud', tone: 'ok', icon: ShieldCheck, title: 'No suspected bill fraud', detail: 'Fuel bills reconcile cleanly', cta: null },
  );

  // Warnings first, all-clears last
  const rank = { critical: 0, caution: 1, ok: 2 };
  return items.sort((a, b) => rank[a.tone] - rank[b.tone]);
}

function ActionRow({ item }) {
  const Icon = item.icon;
  const color = TONE_COLOR[item.tone];
  const inner = (
    <>
      <span className="ov-action-icon" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>
        <Icon size={17} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold" style={{ color: 'var(--cluster-text)' }}>
          {item.title}
        </div>
        <div className="num text-dim mt-0.5 text-xs">{item.detail}</div>
      </div>
      {item.cta && (
        <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold" style={{ color: 'var(--gnb-400)' }}>
          {item.cta}
          <ChevronRight size={14} />
        </span>
      )}
    </>
  );
  return item.to ? (
    <Link to={item.to} className="ov-action">
      {inner}
    </Link>
  ) : (
    <div className="ov-action">{inner}</div>
  );
}

/**
 * Action Center — "What needs my attention, and where do I go next?"
 * The redesign's headline improvement: the dashboard points somewhere, not just
 * reports numbers.
 */
export default function ActionCenter({ utilization, downtime, money, loading }) {
  const items = buildItems({ utilization, downtime, money });
  const openCount = items.filter((i) => i.tone !== 'ok').length;

  return (
    <Panel
      eyebrow="Needs Attention"
      question="What requires immediate action?"
      className="h-full"
      action={
        <span
          className="ov-pill"
          style={
            openCount > 0
              ? { color: 'var(--caution)', background: 'color-mix(in srgb, var(--caution) 14%, transparent)' }
              : { color: 'var(--ok)', background: 'color-mix(in srgb, var(--ok) 12%, transparent)' }
          }
        >
          {openCount > 0 ? `${openCount} open` : 'All clear'}
        </span>
      }
    >
      {loading && !utilization && !downtime && !money ? (
        <div className="flex flex-col gap-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="ov-inset h-14 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <ActionRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </Panel>
  );
}
