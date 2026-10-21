import { lazy, Suspense } from 'react';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import RoutesTab from '../intelligence/RoutesTab.jsx';
import FacilitiesView from '../intelligence/FacilitiesView.jsx';
import RegionsView from '../intelligence/RegionsView.jsx';
import DriverHomesView from '../intelligence/DriverHomesView.jsx';
import ShadowReportTab from '../intelligence/ShadowReportTab.jsx';
import AutoTripCoverage from '../../AutoTrips/AutoTripCoverage.jsx';

const DuplicatesTab = lazy(() => import('../intelligence/DuplicatesTab'));

export default function PlaceHubTableTab({ tab, tabs, version, isEnabled, onLearned, openSite }) {
  return (
    <section className="ph-insight" aria-label={tabs.find((t) => t.id === tab)?.label}>
      <PanelErrorBoundary name={`place-hub-${tab}`}>
        {tab === 'duplicates' && isEnabled('placesHygiene') && (
          <Suspense fallback={<p>Loading review…</p>}>
            <DuplicatesTab version={version} onChanged={onLearned} />
          </Suspense>
        )}
        {tab === 'routes' && <RoutesTab version={version} />}
        {/* Trucks with no trips need their plant marked a pickup — this tab's job. */}
        {tab === 'facilities' && isEnabled('autoTrips') && <AutoTripCoverage />}
        {tab === 'facilities' && (
          <FacilitiesView version={version} onChanged={onLearned} onOpenPlace={openSite} />
        )}
        {tab === 'regions' && <RegionsView version={version} onChanged={onLearned} />}
        {tab === 'homes' && <DriverHomesView version={version} onChanged={onLearned} />}
        {tab === 'shadow' && <ShadowReportTab />}
      </PanelErrorBoundary>
    </section>
  );
}
