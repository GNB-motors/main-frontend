import { formatDateIST, formatDateTimeIST } from '../../../../utils/dateUtils';
import { formatINR } from '../../../../utils/formatters';

import { priceReason } from './fuelPricingLabels';

export default function FuelPricingNote({ quote }) {
  if (!quote) return null;
  return (
    <details className="cr-price-detail">
      <summary>
        {quote.inrPerL == null
          ? priceReason(quote.reason)
          : `${formatINR(quote.inrPerL, { decimals: 2 })}/L · ${quote.regionCode || 'State history'}${quote.stale ? ' · earlier quote' : ''}`}
      </summary>
      <p>
        Same valuation as Daily Digest: the last refuelling state and the reporting day’s stored
        diesel price.
      </p>
      {quote.priceDate && (
        <p>
          Price date: {formatDateIST(quote.priceDate)}
          {quote.stale ? ' · latest earlier stored quote' : ''}.
        </p>
      )}
      {quote.refuelAt && (
        <p>
          Refuelling evidence: {formatDateTimeIST(quote.refuelAt)} ·{' '}
          {{
            FUEL_SLIP: 'Diesel slip',
            DETECTED_FILL: 'Detected refill',
            REFUEL_ALERT: 'Provider refuel alert',
          }[quote.refuelSource] || 'Last refuelling'}
          .
        </p>
      )}
    </details>
  );
}
