import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotYetAvailable } from '@/components/redesign/NotYetAvailable';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { INTELLIGENCE_TABS, resolveIntelligenceTab } from './intelligenceTabs';

/**
 * Intelligence — the page that says what we worked out about the fleet,
 * good and bad, with the reason for every claim.
 *
 * This is the F0 shell: the tab bar and the routing are here, and each tab's
 * content arrives with its own work package.
 */
export default function IntelligencePage() {
  const [searchParams] = useSearchParams();
  const requested = searchParams.get('tab');
  const active = useMemo(() => resolveIntelligenceTab(requested), [requested]);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-5">
      <header className="mb-4 flex flex-col gap-1">
        <h1 className="m-0 text-[20px] font-semibold text-[var(--rd-ink)]">Intelligence</h1>
        <p className="m-0 text-[13px] text-[var(--rd-ink-2)]">
          Everything we worked out about your trucks and drivers, good and bad, with the reasons.
        </p>
      </header>

      <Tabs value={active}>
        <TabsList className="flex-wrap">
          {INTELLIGENCE_TABS.map((tab) => (
            <Tooltip key={tab.id} delay={300}>
              <TooltipTrigger
                render={
                  <TabsTrigger value={tab.id} className="normal-case">
                    {tab.label}
                  </TabsTrigger>
                }
              />
              <TooltipContent side="top">{tab.hint}</TooltipContent>
            </Tooltip>
          ))}
        </TabsList>
        <NotYetAvailable what={INTELLIGENCE_TABS.find((tab) => tab.id === active)?.label} />
      </Tabs>
    </div>
  );
}
