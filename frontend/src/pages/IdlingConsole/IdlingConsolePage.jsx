import { useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import LiveIdlingPanel from './LiveIdlingPanel';
import IdlingHistoryPanel from './IdlingHistoryPanel';
import useApi from '../../hooks/useApi';
import IdlingConsoleService from './IdlingConsoleService';

export default function IdlingConsolePage() {
  const [tab, setTab] = useState('live');
  const { data: liveData } = useApi((signal) => IdlingConsoleService.getLive({ signal }), []);
  const liveCount = liveData?.length ?? 0;

  return (
    <div className="cluster-page idling-console-page">
      <PageShell
        title="Idling Console"
        subtitle="Vehicles idling right now, and a history of past idle segments with an estimated ₹ cost."
      >
        <PanelErrorBoundary name="idling-console">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="live" className="flex items-center gap-2">
                <span>Live</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1px 7px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: liveCount > 0 ? '#2563eb' : '#e2e8f0',
                    color: liveCount > 0 ? '#ffffff' : '#64748b',
                  }}
                >
                  {liveCount}
                </span>
              </TabsTrigger>
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
