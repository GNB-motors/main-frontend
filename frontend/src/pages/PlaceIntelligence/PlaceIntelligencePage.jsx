import { useState } from 'react';
import { ListChecks, MapPin, Coffee, Route, ShieldCheck } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { getUserRole } from '../../utils/session.js';
import ReviewQueueTab from './ReviewQueueTab';
import PlacesTab from './PlacesTab';
import BreaksTab from './BreaksTab';
import RoutesTab from './RoutesTab';
import ShadowReportTab from './ShadowReportTab';
import '../OwnerAlerts/OwnerAlerts.css';

const TAB_CLASS =
  'flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-600 hover:text-slate-900';

const TABS = [
  { key: 'queue', label: 'To review', Icon: ListChecks, Panel: ReviewQueueTab },
  { key: 'places', label: 'All places', Icon: MapPin, Panel: PlacesTab },
  { key: 'breaks', label: 'Unproductive breaks', Icon: Coffee, Panel: BreaksTab },
  { key: 'routes', label: 'Routes', Icon: Route, Panel: RoutesTab },
  {
    key: 'shadow',
    label: 'Shadow report',
    Icon: ShieldCheck,
    Panel: ShadowReportTab,
    superAdminOnly: true,
  },
];

/**
 * Place Intelligence — every place the org's trucks stop at, what it is and
 * how sure the system is. Only the active tab mounts, so a tab fetches when
 * it is opened, not when the page loads.
 */
export default function PlaceIntelligencePage() {
  const [tab, setTab] = useState('queue');
  const isSuperAdmin = getUserRole() === 'SUPER_ADMIN';
  const tabs = TABS.filter((t) => !t.superAdminOnly || isSuperAdmin);
  return (
    <PageShell
      title="Place Intelligence"
      subtitle="Every place your trucks stop, what it is, and how sure we are. Your answers teach the system."
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-300 rounded-xl shadow-sm w-full md:w-auto overflow-x-auto">
          {tabs.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className={TAB_CLASS}>
              <t.Icon size={14} /> <span>{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.key} value={t.key} className="mt-4">
            <PanelErrorBoundary name={`place-intelligence-${t.key}`}>
              {tab === t.key ? <t.Panel /> : null}
            </PanelErrorBoundary>
          </TabsContent>
        ))}
      </Tabs>
    </PageShell>
  );
}
