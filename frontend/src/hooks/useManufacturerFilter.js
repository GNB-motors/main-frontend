import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** A page scope, persisted across supported tabs and shareable links. */
export default function useManufacturerFilter() {
  const [params, setParams] = useSearchParams();
  const manufacturer = params.get('manufacturer') || '';
  const setManufacturer = useCallback(
    (value) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (value) next.set('manufacturer', value);
          else next.delete('manufacturer');
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );
  return { manufacturer, setManufacturer };
}
