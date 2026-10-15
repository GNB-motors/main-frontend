import { createContext, useContext } from 'react';
import { indexLinkHealth } from '../lib/fleetLink';

/**
 * fleetLinkContext — shared by FleetLinkProvider (host) and the header icon,
 * banner, vehicles table and relink panel. Lives in its own module so the
 * provider file keeps a single export (react-refresh/only-export-components).
 */
const FleetLinkContext = createContext(null);

const noop = () => {};

// Outside the provider (tests, public pages) every surface renders nothing.
const DISABLED = {
  enabled: false,
  data: null,
  error: null,
  checking: false,
  index: indexLinkHealth(null),
  refresh: noop,
  checkAgain: noop,
  openPanel: noop,
};

export function useFleetLink() {
  return useContext(FleetLinkContext) || DISABLED;
}

export default FleetLinkContext;
