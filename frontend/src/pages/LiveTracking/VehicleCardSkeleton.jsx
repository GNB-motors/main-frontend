import Skel from './Skel.jsx';

// Same frame as a real .vcard so the list doesn't jump when positions land.
const VehicleCardSkeleton = () => (
  <div className="vcard vcard--skel" aria-hidden="true">
    <div className="vc-top">
      <div className="vc-id">
        <div className="vc-plate">
          <Skel w={96} h={14} />
          <Skel w={52} h={14} />
        </div>
        <div className="vc-vin">
          <Skel w={128} h={10} />
        </div>
      </div>
      <span className="vc-state">
        <Skel w={56} h={12} />
      </span>
    </div>
    <div className="vc-loc">
      <Skel w="70%" h={12} />
    </div>
    <div className="vc-meta">
      <Skel w={44} h={11} />
      <Skel w={36} h={11} />
      <Skel w={40} h={11} />
      <span className="sp" />
      <Skel w={48} h={11} />
    </div>
  </div>
);

export default VehicleCardSkeleton;
