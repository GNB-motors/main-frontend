import PageShell from '../../components/ui/PageShell';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
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
  const { data, loading, error } = useApi(
    (signal) => DailyBriefService.getBrief({}, signal).then((d) => dailyBriefSchema.parse(d)),
    [],
  );

  const sections = data?.sections ?? [];

  return (
    <div className="cluster-page">
      <PageShell
        title="Morning Brief"
        subtitle="The day's most economically-significant events, each with a ₹ impact and a suggested action."
      >
        <PanelErrorBoundary name="daily-brief">
          {loading && !data ? (
            <div className="text-dim p-6 text-sm">Loading today&apos;s brief…</div>
          ) : error ? (
            <div className="p-6 text-sm" style={{ color: 'var(--critical)' }}>
              Could not load the brief. {error.detail || error.message || ''}
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
                <div className="text-dim p-4 text-sm">Nothing to report today.</div>
              )}
            </div>
          )}
        </PanelErrorBoundary>
      </PageShell>
    </div>
  );
}
