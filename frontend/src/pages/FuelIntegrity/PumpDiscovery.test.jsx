import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import PumpHonestyPanel from './PumpHonestyPanel.jsx';
import PumpsWatchCard from './PumpsWatchCard.jsx';
import { normalisePumpLedger } from './pumpHonestyModel.js';

it('shows known pumps on both surfaces without claiming zero shortage or loss', () => {
  const data = normalisePumpLedger({
    pumps: [
      {
        pump: 'GABRU',
        fills: 0,
        auditStatus: 'NOT_AUDITED',
        sourceCounts: { register: 2, sensor: 1, alert: 1 },
        registeredLitres: 300,
        claimedLitres: null,
        actualLitres: null,
        shortfallLitres: null,
        shortfallPct: null,
        estimatedLossInr: null,
      },
    ],
  });
  render(
    <>
      <PumpsWatchCard ledger={{ data }} />
      <PumpHonestyPanel ledger={{ data }} />
    </>,
  );
  expect(screen.getAllByText('GABRU')).toHaveLength(2);
  expect(screen.getAllByText('Not yet audited')).toHaveLength(2);
  expect(screen.getAllByText('2 register entries · 1 sensor fills · 1 refuel alerts')).toHaveLength(
    2,
  );
  expect(screen.getByText('Loss unknown')).toBeInTheDocument();
  expect(screen.queryByText('₹0 Shortfall')).not.toBeInTheDocument();
  expect(screen.queryByText('Audited Refuels')).not.toBeInTheDocument();
  expect(screen.queryByText(/short ·.*lost/)).not.toBeInTheDocument();
});
