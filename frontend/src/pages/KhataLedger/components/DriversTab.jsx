import LedgerListTab from './LedgerListTab';

export default function DriversTab({ vehicles, drivers }) {
  return <LedgerListTab kind="driver" vehicles={vehicles} drivers={drivers} />;
}
