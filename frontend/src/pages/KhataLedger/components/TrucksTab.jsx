import LedgerListTab from './LedgerListTab';

export default function TrucksTab({ vehicles, drivers }) {
  return <LedgerListTab kind="vehicle" vehicles={vehicles} drivers={drivers} />;
}
