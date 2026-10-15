import { Suspense, lazy, useState } from 'react';
import { toast } from 'react-toastify';
import FleetLinkContext from './fleetLinkContext';
import { useActiveBranch } from './BranchContext.jsx';
import useFleetLinkHealth from '../hooks/useFleetLinkHealth';
import { canRelink, indexLinkHealth } from '../lib/fleetLink';
import { getUserRole } from '../utils/session.js';

const FleetLinkSheet = lazy(() => import('../components/FleetLinkSheet.jsx'));

const announceRecovered = (accounts) => {
  const names = accounts.map((a) => a.friendlyName || a.fleetId).join(', ');
  toast.success(`${names} reconnected — FleetEdge data resumes within a minute.`);
};

/**
 * Holds FleetEdge link health for the dashboard shell and renders the relink
 * panel, so the header icon, banner, vehicles table and Vehicle 360 all read
 * one payload and open one panel. Only roles that can sign in to the GNB Edge
 * extension fetch anything — nobody else can act on it.
 */
export default function FleetLinkProvider({ children }) {
  const { branchId } = useActiveBranch();
  const enabled = canRelink(getUserRole());
  const health = useFleetLinkHealth(enabled, branchId, { onRecovered: announceRecovered });
  // The panel stays mounted after its first open so it can animate closed.
  const [panel, setPanel] = useState({ mounted: false, open: false, accountId: null });

  const value = {
    enabled,
    ...health,
    index: indexLinkHealth(health.data),
    openPanel: (accountId = null) => setPanel({ mounted: true, open: true, accountId }),
  };

  return (
    <FleetLinkContext.Provider value={value}>
      {children}
      {panel.mounted ? (
        <Suspense fallback={null}>
          <FleetLinkSheet
            open={panel.open}
            focusAccountId={panel.accountId}
            onOpenChange={(open) => setPanel((p) => ({ ...p, open }))}
          />
        </Suspense>
      ) : null}
    </FleetLinkContext.Provider>
  );
}
