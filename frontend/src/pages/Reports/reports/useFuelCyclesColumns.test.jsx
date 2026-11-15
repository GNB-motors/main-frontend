import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useFuelCyclesColumns } from './useFuelCyclesColumns';

/** A fuel cycle as the new backend sends it. */
const newCycle = {
  registrationNumber: 'WB11L8862',
  fullBasis: 'SLIP',
  flags: ['GAP_NOT_ASSESSED'],
  km: { odo: 1200, tolerance: { scope: 'MODEL', modelKey: 'LPT 4830' } },
  tripSummary: { ladenKm: 900, otherKm: 180, cycleKm: 1200, count: 2 },
  mileage: { tankToTank: 3.1 },
};

/** A fuel cycle as the old backend sends it: no basis, no tolerance, no flags. */
const oldCycle = {
  registrationNumber: 'WB11L8862',
  km: { odo: 1200 },
  tripSummary: { ladenKm: 900, otherKm: 180, cycleKm: 1200, count: 2 },
  mileage: { tankToTank: 3.1 },
};

const columns = () => renderHook(() => useFuelCyclesColumns()).result.current;
const column = (key) => columns().find((c) => c.key === key);

describe('the fuel cycles report — the km/L cell', () => {
  it('says where the km/L came from', () => {
    render(column('mileage').render(newCycle));

    expect(screen.getByText('3.10')).toBeInTheDocument();
    expect(screen.getByText('from slips')).toBeInTheDocument();
  });

  it('says the register rows were the basis', () => {
    render(column('mileage').render({ ...newCycle, fullBasis: 'REGISTER_MAIN' }));

    expect(screen.getByText('from register rows')).toBeInTheDocument();
  });

  it('says nothing about the basis on the old backend', () => {
    const { container } = render(column('mileage').render(oldCycle));

    expect(screen.getByText('3.10')).toBeInTheDocument();
    expect(container.textContent).not.toContain('from slips');
    expect(container.textContent).not.toContain('from register rows');
    expect(container.textContent).not.toContain('undefined');
  });

  it('says why there is no km/L when the fill type was not recorded', () => {
    const { container } = render(
      column('mileage').render({
        ...newCycle,
        flags: ['FILL_TYPE_UNKNOWN'],
        mileage: { tankToTank: null },
      }),
    );

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('fill type not recorded')).toBeInTheDocument();
    expect(container.textContent).not.toContain('undefined');
  });
});

describe('the fuel cycles report — the flags cell', () => {
  it('says what was not measured, in plain words', () => {
    render(column('flags').render(newCycle));

    expect(screen.getByText('not assessed yet')).toBeInTheDocument();
    expect(screen.queryByText('GAP_NOT_ASSESSED')).not.toBeInTheDocument();
  });

  it('keeps the code of a flag it does not know', () => {
    render(column('flags').render({ ...newCycle, flags: ['RECONCILE_GAP'] }));

    expect(screen.getByText('RECONCILE_GAP')).toBeInTheDocument();
  });

  it('does not say the fill-type flag twice on one row', () => {
    const row = { ...newCycle, flags: ['FILL_TYPE_UNKNOWN', 'LEDGER_PARTIAL'] };
    render(column('mileage').render(row));

    // The km/L cell owns that flag's words; the flags list leaves it out.
    expect(screen.getByText('fill type not recorded')).toBeInTheDocument();
    expect(column('flags').render(row)).toBeTruthy();
    const { container } = render(column('flags').render(row));
    expect(container.textContent).not.toContain('fill type not recorded');
    expect(container.textContent).toContain('ledger covers part of this cycle');
  });

  it('shows no flag at all when the cycle carries none', () => {
    render(column('flags').render(oldCycle));

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('the fuel cycles report — the gap tooltip', () => {
  it('says what the truck was judged against', () => {
    render(column('notInTrips').render(newCycle));

    expect(
      screen.getByTitle(/compared with other LPT 4830 trucks/),
    ).toBeInTheDocument();
  });

  it('says nothing about a limit on the old backend', () => {
    const { container } = render(column('notInTrips').render(oldCycle));

    expect(container.textContent).not.toContain('compared with');
  });
});
