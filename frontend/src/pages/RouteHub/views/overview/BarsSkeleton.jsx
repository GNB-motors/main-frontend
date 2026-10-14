import { Skel } from '../../routeHubShared.jsx';

/** Margin bars while the routes load: name, figure and a track per row. */
export default function BarsSkeleton({ n = 4 }) {
  return (
    <div className="bars" aria-busy="true">
      {Array.from({ length: n }, (_, i) => (
        <div className="bar" key={i}>
          <span className="n">
            <Skel w={['62%', '48%', '70%', '55%'][i % 4]} h={12} />
          </span>
          <span className="a">
            <Skel w={42} h={12} />
          </span>
          <Skel w={58} h={20} r={999} />
          <span className="track">
            <Skel w="100%" h="100%" />
          </span>
        </div>
      ))}
    </div>
  );
}
