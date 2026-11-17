import Skel from './Skel.jsx';

/** Non-interactive placeholders with the same spacing as the sidebar's cards. */
export default function PlaceRouteSkeletons({
  kind = 'place',
  count = 6,
  label = 'Loading places',
}) {
  return (
    <div className="lt-sidebar-skeletons" role="status" aria-label={label}>
      <span className="sr-only">{label}…</span>
      <div aria-hidden="true" className="lt-sidebar-skeleton-cards">
        {Array.from({ length: count }, (_, index) => (
          <div className="pcard lt-sidebar-skeleton-card" key={index}>
            <Skel w={kind === 'route' ? 24 : 12} h={kind === 'route' ? 24 : 12} />
            <div className="lt-sidebar-skeleton-copy">
              <Skel w={index % 2 ? '82%' : '68%'} h={13} />
              <Skel w={index % 2 ? '58%' : '76%'} h={10} />
            </div>
            {kind === 'place' ? <Skel w={38} h={11} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
