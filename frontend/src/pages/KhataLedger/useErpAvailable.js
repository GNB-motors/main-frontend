import { useEffect, useState } from 'react';
import { getErpAvailability } from './KhataLedgerService';

/** true once the location has an ERP trip, false when it has none, undefined while asking. */
export default function useErpAvailable() {
  const [available, setAvailable] = useState(undefined);
  useEffect(() => {
    let live = true;
    getErpAvailability().then((value) => {
      if (live) setAvailable(value);
    });
    return () => {
      live = false;
    };
  }, []);
  return available;
}
