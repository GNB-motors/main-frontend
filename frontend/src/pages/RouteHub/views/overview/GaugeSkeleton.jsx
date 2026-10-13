import { Skel } from '../../routeHubShared.jsx';

export default function GaugeSkeleton() {
  return (
    <div className="gauge" aria-busy="true">
      <Skel w={120} h={96} r={14} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skel w={64} h={20} />
        <Skel w={96} h={10} />
        <Skel w={56} h={20} />
        <Skel w={96} h={10} />
      </div>
    </div>
  );
}
