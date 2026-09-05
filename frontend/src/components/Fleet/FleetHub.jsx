import React, { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import FleetPageHeader from './FleetPageHeader.jsx';

/**
 * FleetHub — the tab host every Fleet hub page is built on.
 *
 * Why not reuse ERP's tab markup: styles/erp.css hardcodes its colours and the
 * tabs are bare <button>s with no roving focus. components/ui/tabs.jsx (base-ui)
 * themes through tokens and handles arrow keys, so that's what this wraps —
 * the same choice KhataLedgerPage already made.
 *
 * Two bugs in the existing tab implementations are fixed here:
 *
 *  1. Khata calls setSearchParams({tab}) with no `replace`, so every tab click
 *     pushes a history entry and Back walks through tabs instead of leaving the
 *     page. We pass { replace: true }.
 *  2. Khata seeds activeTab from the URL once via useState, and never reads it
 *     again — so browser Back/Forward changes the URL without moving the tab.
 *     Here the URL *is* the state, so navigation and UI can't drift apart.
 *
 * Tabs render lazily: only the active tab's render() is called. Without that,
 * folding seven screens into one hub would fire all seven sets of fetch effects
 * on mount and pay for seven screens to show one.
 *
 * tabs: [{
 *   id, label,
 *   facets?: [{ id, label }],   // optional sub-selection within the tab
 *   defaultFacet?: string,
 *   toolbar?: (ctx) => node,     // rendered right of the facet row
 *   render: (ctx) => node,       // ctx = { facet, setFacet }
 * }]
 */
const FleetHub = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions = null,
  tabs = [],
  defaultTab,
}) => {
  const [params, setParams] = useSearchParams();

  const fallbackTab = defaultTab || tabs[0]?.id;
  const requested = params.get('tab');
  // An unknown ?tab= (stale bookmark, typo) must not render an empty hub.
  const activeTab = tabs.some((t) => t.id === requested) ? requested : fallbackTab;
  const tab = useMemo(() => tabs.find((t) => t.id === activeTab), [tabs, activeTab]);

  const fallbackFacet = tab?.defaultFacet || tab?.facets?.[0]?.id;
  const requestedFacet = params.get('view');
  const activeFacet = tab?.facets?.some((f) => f.id === requestedFacet)
    ? requestedFacet
    : fallbackFacet;

  const selectTab = useCallback(
    (next) => {
      // Drop `view` on tab change — a facet from the previous tab is meaningless
      // here, and carrying it over would resolve to that tab's fallback anyway.
      setParams({ tab: next }, { replace: true });
    },
    [setParams],
  );

  const selectFacet = useCallback(
    (next) => {
      setParams({ tab: activeTab, view: next }, { replace: true });
    },
    [setParams, activeTab],
  );

  const ctx = { facet: activeFacet, setFacet: selectFacet };

  // A `fill` tab (the live map) owns the remaining viewport height instead of
  // growing the page. .page-content is the app's scroll container, so it has to
  // stop scrolling while such a tab is active — otherwise a 100%-height map
  // resolves against a growing parent and the page ends up scrollable with a
  // squashed map. Reverted on unmount and whenever a normal tab is selected.
  const isFill = Boolean(tab?.fill);
  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (!el) return undefined;
    el.classList.toggle('fleet-fill', isFill);
    return () => el.classList.remove('fleet-fill');
  }, [isFill]);

  return (
    <div className={isFill ? 'fleet-hub fleet-hub--fill' : 'space-y-5 p-1'}>
      <FleetPageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        actions={actions}
      />

      <Tabs value={activeTab} onValueChange={selectTab}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((t) => (
          <TabsContent key={t.id} value={t.id} className={t.fill ? 'fleet-tabpanel--fill' : undefined}>
            {/* Mount the active tab only — see note above. */}
            {t.id === activeTab && (
              <div className={t.fill ? 'fleet-fillpane' : 'space-y-4'}>
                {(t.facets?.length > 0 || t.toolbar) && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {t.facets?.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {t.facets.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            className="fleet-facet"
                            aria-pressed={f.id === activeFacet}
                            data-active={f.id === activeFacet ? 'true' : undefined}
                            onClick={() => selectFacet(f.id)}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span />
                    )}
                    {t.toolbar?.(ctx)}
                  </div>
                )}
                {t.render(ctx)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default FleetHub;
