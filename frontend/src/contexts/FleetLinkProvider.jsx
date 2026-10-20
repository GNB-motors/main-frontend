import { Suspense, lazy, useState } from 'react';
import { toast } from 'react-toastify';
import FleetLinkContext from './fleetLinkContext';
import { useActiveBranch } from './BranchContext.jsx';
import useFleetLinkHealth from '../hooks/useFleetLinkHealth';
import { indexLinkHealth } from '../lib/fleetLink';

const FleetLinkSheet = lazy(() => import('../components/FleetLinkSheet.jsx'));

const announceRecovered = (accounts) => {
  const names = accounts.map((a) => a.friendlyName || a.fleetId).join(', ');
  toast.success(`${names} reconnected — FleetEdge data resumes within a minute.`);
};

/**
 * Holds FleetEdge link health for the dashboard shell and renders the relink
 * panel, so the header icon, vehicles table, Vehicle 360 and Settings all read
 * one payload and open one panel. Every role sees the link state, whoever can
 * act on it.
 */
export default function FleetLinkProvider({ children }) {
  const { branchId } = useActiveBranch();
  const enabled = true;
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
