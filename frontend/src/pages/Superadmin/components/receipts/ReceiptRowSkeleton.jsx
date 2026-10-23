import Skel from './Skel';

// Same cells and wrappers as a receipt row, so the table keeps its shape when drafts land.
function ReceiptRowSkeleton() {
  return (
    <tr aria-hidden="true">
      <td className="ra-table__td-select">
        <Skel w={16} h={16} />
      </td>
      <td className="ra-table__td-slip">
        <Skel w={42} h={42} radius={8} />
      </td>
      {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- skeleton cell; the whole row is aria-hidden */}
      <td>
        <div className="ra-veh-cell">
          <span className="ra-veh">
            <Skel w={28} h={28} radius={7} />
            <Skel w={86} h={13} />
          </span>
        </div>
      </td>
      <td>
        <div className="ra-driver-cell">
          <Skel w={96} h={13} />
          <Skel w={84} h={10} />
        </div>
      </td>
      <td>
        <div className="ra-station-cell">
          <Skel w={118} h={13} />
          <Skel w={44} h={10} />
        </div>
      </td>
      <td className="ra-right">
        <Skel w={46} />
      </td>
      <td className="ra-right">
        <Skel w={62} />
      </td>
      <td className="ra-center">
        <div className="ra-odo-cell">
          <Skel w={58} />
          <Skel w={66} h={17} radius={6} />
        </div>
      </td>
      <td className="ra-center">
        <div className="ra-ocr-cell">
          <Skel w={50} h={19} radius={6} />
          <Skel w={58} h={10} />
        </div>
      </td>
      <td className="ra-center">
        <Skel w={72} h={23} round />
      </td>
      <td>
        <div className="ra-skel-stack">
          <Skel w={96} />
          <Skel w={58} h={10} />
        </div>
      </td>
      <td className="ra-center">
        <div className="ra-row-actions">
          <Skel w={30} h={30} radius={8} />
        </div>
      </td>
    </tr>
  );
}

export default ReceiptRowSkeleton;
