import StatTile from '@/components/redesign/StatTile';
import { formatNumber } from '@/utils/redesign/format';

export default function IntelligenceOverview({ summary, issues }) {
  return (
    <section aria-label="Fleet assessment overview" className="intelligence-overview">
      <div className="intelligence-overview-label">Fleet summary · selected period</div>
      <div className="intelligence-overview-grid">
        <StatTile
          label="Fleet trucks"
          value={formatNumber(summary?.fleet?.trucks)}
          link={{ to: '/vehicles/dashboard' }}
          sub="Registered fleet"
        />
        <StatTile
          label="Reporting trucks"
          value={formatNumber(summary?.fleet?.reporting)}
          tone="good"
          why={{ text: 'Based on account connectivity. This is not a live GPS coverage check.' }}
          sub="Based on account connectivity"
        />
        <StatTile
          label="Critical issues"
          value={formatNumber(issues?.counts?.act)}
          tone={issues?.counts?.act > 0 ? 'act' : 'info'}
          link={{ to: '/intelligence?tab=issues' }}
          sub="Open issues needing attention"
        />
        <StatTile
          label="Warnings"
          value={formatNumber(issues?.counts?.watch)}
          tone={issues?.counts?.watch > 0 ? 'watch' : 'info'}
          link={{ to: '/intelligence?tab=issues' }}
          sub="Open issues to review"
        />
      </div>
    </section>
  );
}
