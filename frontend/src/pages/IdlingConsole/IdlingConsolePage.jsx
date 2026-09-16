import { useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import LiveIdlingPanel from './LiveIdlingPanel';
import IdlingHistoryPanel from './IdlingHistoryPanel';

export default function IdlingConsolePage() {
  const [tab, setTab] = useState('live');

  return (
    <div className="cluster-page">
      <PageShell
        title="Idling Console"
        subtitle="Vehicles idling right now, and a history of past idle segments with an estimated ₹ cost."
      >
        <PanelErrorBoundary name="idling-console">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="live">Live</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="live">
              <LiveIdlingPanel />
            </TabsContent>
            <TabsContent value="history">
              <IdlingHistoryPanel />
            </TabsContent>
          </Tabs>
        </PanelErrorBoundary>
      </PageShell>
    </div>
  );
}
