import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { DailyBriefService } from './DailyBriefService';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import PageShell from '../../components/ui/PageShell';
import { formatDateLongIST, toISTDateString } from '../../utils/dateUtils';
import { TotalImpactTile, BriefSectionCard } from './dailyBriefCards';

/**
 * DailyBrief — feature #17 (Morning Intelligence Brief), a thin shell today:
 * only "idling ₹" is backed by a real number (idlingConsole's IdleEvent
 * collection); drain ₹ (#8) and efficiency drift (#1/#10) render as honest
 * "coming soon" cards until those features land. Dark-launch: reachable only
 * by direct URL, no sidebar entry yet, gated server-side by the `dailyBrief`
 * feature flag + OWNER/MANAGER role.
 */
export default function DailyBriefPage() {
  const [date, setDate] = useState(() => toISTDateString(new Date().toISOString()));

  const brief$ = useApi((signal) => DailyBriefService.getBrief({ date }, signal), [date]);
  const { data: brief, loading } = brief$;

  const sections = brief?.sections || [];

  return (
    <div className="mx-auto" style={{ maxWidth: 1000 }}>
      <PageShell
        title="Daily Brief"
        subtitle={
          date
            ? `${formatDateLongIST(date)} · Top ₹-significant events`
            : 'Top ₹-significant events'
        }
        actions={
          <div className="flex items-center gap-3">
            <input
              type="date"
              className="rounded-lg px-2.5 py-1.5 text-xs"
              style={{
                border: '1px solid var(--hairline)',
                background: 'var(--cluster-raised)',
                color: 'var(--cluster-text)',
              }}
              value={date}
              max={toISTDateString(new Date().toISOString())}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Brief date"
            />
            <button
              className="text-dim flex items-center gap-1.5 self-start text-xs sm:self-auto"
              onClick={() => brief$.refetch()}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        }
      >
        {loading && !brief ? (
          <div className="space-y-4">
            <div className="ov-inset h-20 animate-pulse rounded-2xl" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="ov-inset h-24 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <PanelErrorBoundary name="daily-brief">
            <TotalImpactTile totalRupees={brief?.totalRupees || 0} />
            <div className="mt-6 flex flex-col gap-3">
              {sections.map((section) => (
                <BriefSectionCard key={section.key} section={section} />
              ))}
            </div>
          </PanelErrorBoundary>
        )}
      </PageShell>
    </div>
  );
}
