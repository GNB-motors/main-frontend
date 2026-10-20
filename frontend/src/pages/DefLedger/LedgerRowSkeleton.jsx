import Skel from './Skel';

// Same cells and alignment as a real row, so the table doesn't jump when data lands.
function LedgerRowSkeleton() {
  return (
    <tr aria-hidden="true">
      <td className="py-3 px-4">
        <Skel className="h-5 w-24" />
      </td>
      {['w-14', 'w-14', 'w-14', 'w-12'].map((width, i) => (
        <td key={i} className="py-3 px-4 text-right">
          <Skel className={`h-3.5 ${width}`} />
        </td>
      ))}
      <td className="py-3 px-4 text-center">
        <Skel className="h-5 w-12" />
      </td>
      <td className="py-3 px-4 text-center">
        <Skel className="h-5 w-28 rounded-full" />
      </td>
      <td className="py-3 px-4 text-center">
        <Skel className="h-3.5 w-10" />
      </td>
      <td className="py-3 px-4 text-center">
        <Skel className="h-6 w-24" />
      </td>
    </tr>
  );
}

export default LedgerRowSkeleton;
