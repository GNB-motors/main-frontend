import OfficeBillRow from './office/OfficeBillRow';

/**
 * A confirmed bill, in the shared receipt table. The truck is changed and the
 * log is opened from the drawer this row opens.
 */
export function ConfirmedBillRow({ capture, index, onHistory, onOpen }) {
  return (
    <OfficeBillRow
      capture={capture}
      index={index}
      confirmed
      onOpen={onOpen}
      onHistory={onHistory}
    />
  );
}

