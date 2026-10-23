import React from 'react';

/**
 * The context object and its hook live in a plain .js file because a component
 * file may only export components (react-refresh): the provider and the hook
 * that reads it are two files on purpose.
 *
 * What the value means:
 *   profile — this organization's OWN learned usage profile, or null.
 *   ready   — the request came back. false means "not measured yet", which is a
 *             state in which NOTHING is cut.
 *
 * A null profile is the designed state for every org before it has been
 * measured, and also for every org whose request failed. In both cases the menu
 * is whole.
 */
export const UsageAnalyticsContext = React.createContext({ profile: null, ready: false });

export const useUsageAnalytics = () => React.useContext(UsageAnalyticsContext);

export default UsageAnalyticsContext;