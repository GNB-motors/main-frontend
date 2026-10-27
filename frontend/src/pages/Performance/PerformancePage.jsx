import PageShell from '../../components/ui/PageShell';

/**
 * Wave 5 — the Performance section.
 *
 * Placeholder shell for item 1 (flag + route + nav). The tabs, the API client
 * and the source-aware cells land in item 2; nothing here reads data yet.
 */
export default function PerformancePage() {
  return (
    <div className="cluster-page">
      <PageShell
        title="Performance"
        subtitle="Every number says where it came from — and anything we cannot compare says so instead of showing a zero."
      >
        <div className="text-dim p-4 text-sm">
          The performance section is behind the `performanceSection` flag for your organisation.
        </div>
      </PageShell>
    </div>
  );
}
