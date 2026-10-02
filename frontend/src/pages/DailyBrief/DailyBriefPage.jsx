import { useState } from 'react';
import { RotateCw, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import EmptyState from '../../components/cluster/EmptyState';
import { useApi } from '../../hooks/useApi';
import { DailyBriefService } from './DailyBriefService';
import { dailyBriefSchema } from '../../schemas/dailyBrief.schema';
import { TotalImpactTile, BriefSectionCard } from './dailyBriefCards';

/**
 * Morning Intelligence Brief (feature #17) — the day's economically-significant
 * events (idling ₹, fuel-vs-expected ₹, …), each with a ₹ impact and a
 * suggested action. Sections are rendered generically, so a section flips from
 * "Coming soon" to a real number the moment its backing feature lands.
 */
export default function DailyBriefPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, loading, error, refetch } = useApi(
    (signal) =>
      DailyBriefService.getBrief({ date: selectedDate }, signal).then((d) =>
        dailyBriefSchema.parse(d),
      ),
    [selectedDate],
  );

  const sections = data?.sections ?? [];

  const changeDay = (delta) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + delta);
    setSelectedDate(cur.toISOString().slice(0, 10));
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="cluster-page">
      <PageShell
        title="Morning Brief"
        subtitle="The day's most economically-significant events, each with a ₹ impact and a suggested action."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '3px 6px',
              }}
            >
              <button
                type="button"
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#475569',
                }}
                onClick={() => changeDay(-1)}
                title="Previous Day"
              >
                <ChevronLeft size={16} />
              </button>
              <input
                type="date"
                value={selectedDate}
                max={todayStr}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#0f172a',
                  padding: '2px 6px',
                  outline: 'none',
                  cursor: 'pointer',
                  background: 'transparent',
                }}
              />
              <button
                type="button"
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: selectedDate >= todayStr ? 'not-allowed' : 'pointer',
                  opacity: selectedDate >= todayStr ? 0.35 : 1,
                  padding: '2px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#475569',
                }}
                onClick={() => changeDay(1)}
                disabled={selectedDate >= todayStr}
                title="Next Day"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <button
              type="button"
              className="pshell-btn"
              onClick={() => refetch()}
              disabled={loading}
              title="Refresh morning brief"
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        }
      >
        <PanelErrorBoundary name="daily-brief">
          {loading && !data ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="dt-skel mb-2 w-32" />
                <div className="dt-skel h-8 w-48" />
              </div>
              <div className="grid gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="dt-skel mb-3 w-40" />
                  <div className="dt-skel mb-2 h-4 w-full" />
                  <div className="dt-skel h-4 w-3/4" />
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="dt-skel mb-3 w-40" />
                  <div className="dt-skel mb-2 h-4 w-full" />
                  <div className="dt-skel h-4 w-2/3" />
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-6 text-center text-sm text-red-700">
              <div className="mb-2 flex items-center justify-center gap-2 font-semibold text-red-800">
                <AlertTriangle size={18} />
                <span>Could not load the morning brief</span>
              </div>
              <p className="mb-4 text-xs text-red-600">
                {error.detail || error.message || 'Server request failed'}
              </p>
              <button
                type="button"
                className="pshell-btn pshell-btn--primary"
                onClick={() => refetch()}
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <TotalImpactTile totalRupees={data?.totalRupees ?? 0} />
              <div className="grid gap-3">
                {sections.map((section) => (
                  <BriefSectionCard key={section.key} section={section} />
                ))}
              </div>
              {sections.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                  <EmptyState
                    title="Nothing to report today"
                    hint="No significant operational anomalies, excessive idling, or fuel variance detected across the fleet."
                  />
                </div>
              )}
            </div>
          )}
        </PanelErrorBoundary>
      </PageShell>
    </div>
  );
}
