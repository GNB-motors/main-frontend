import { ExternalLink, Laptop } from 'lucide-react';
import { FLEETEDGE_URL, STORE_URL } from '../lib/gnbEdgeExtension';

const linkClass =
  'mt-1.5 inline-flex items-center gap-1 rounded-[var(--ds-radius-sm)] border border-[var(--ds-line)] px-2.5 py-1 text-xs font-semibold hover:bg-[var(--ds-sunk)]';

/**
 * How to re-link, in the order the customer does it. The extension reads the
 * FleetEdge sign-in from an open FleetEdge tab, so FleetEdge comes first.
 */
export default function FleetLinkSteps({ fleetIds, extension, desktop, title }) {
  const fleets = fleetIds.length ? fleetIds.join(', ') : null;
  return (
    <section className="rounded-[var(--ds-radius-md)] bg-[var(--ds-sunk)] p-4">
      <h3 className="text-sm font-semibold">{title || 'How to reconnect (about 2 minutes)'}</h3>
      {!desktop ? (
        <p className="mt-2 flex items-start gap-2 rounded-[var(--ds-radius-sm)] bg-[var(--ds-warn-tint)] p-2 text-xs text-[var(--ds-warn-ink)]">
          <Laptop size={14} className="mt-0.5 shrink-0" />
          Do this in Chrome on a laptop or desktop — the GNB Edge extension does not run on phones.
        </p>
      ) : null}
      <ol className="mt-3 list-decimal space-y-3 pl-5 text-xs text-[var(--ds-ink2)]">
        <li>
          Open FleetEdge in Chrome and sign in
          {fleets ? (
            <>
              {' '}
              with the login for fleet <strong>{fleets}</strong>
            </>
          ) : null}
          . Wait for the map to load.
          <br />
          <a href={FLEETEDGE_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Open FleetEdge <ExternalLink size={12} />
          </a>
        </li>
        <li>
          {extension === 'installed' ? (
            <>
              Click the GNB Edge extension icon in the Chrome toolbar and press{' '}
              <strong>Reconnect</strong> on the account. If it is not listed, press{' '}
              <strong>Connect</strong> instead.
            </>
          ) : (
            <>
              Open the GNB Edge extension (install it first if you don&apos;t have it), sign in with
              your GNB login, and press <strong>Reconnect</strong> on the account — or{' '}
              <strong>Connect</strong> if it is not listed.
              <br />
              <a href={STORE_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
                Get GNB Edge for Chrome <ExternalLink size={12} />
              </a>
            </>
          )}
        </li>
        <li>
          Come back here and press <strong>Check again</strong>. The account turns green as soon as
          the link is saved, and data resumes within a minute.
        </li>
      </ol>
    </section>
  );
}
