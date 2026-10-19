import { createContext, useContext } from 'react';

/**
 * supportPortalContext — shared by SupportPortalProvider (host) and the header
 * headset icon. Lives in its own module so the provider file keeps a single
 * export (react-refresh/only-export-components).
 */
const SupportPortalContext = createContext(null);

const noop = () => {};

// Outside the provider (tests, public pages, super admin) the icon renders nothing.
const DISABLED = { enabled: false, unread: 0, openPortal: noop, refreshUnread: noop };

export function useSupportPortal() {
  return useContext(SupportPortalContext) || DISABLED;
}

export default SupportPortalContext;
