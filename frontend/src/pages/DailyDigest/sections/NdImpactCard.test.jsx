import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import NdImpactCard from './NdImpactCard';

const money = (over = {}) => ({
  idlingWasteInr: null,
  detourWasteInr: null,
  theftLossInr: null,
  billFraudSuspectInr: null,
  speedingLossInr: null,
  lowMileageLossInr: null,
  ...over,
});

const renderCard = (props = {}) =>
  render(
    <NdImpactCard
      money={money()}
      atRisk={{ complianceFineInr: null, adblueUnreconciledInr: null, offPumpRefuelInr: null }}
      utilization={{ fleet: { emptyKmWasteInr: null } }}
      downtime={{ totalExposureInr: null }}
      {...props}
    />,
  );

describe("today's ₹ impact", () => {
  // OLD response: every channel carries a number.
  it('adds the channels it measured', () => {
    const { container } = renderCard({
      money: money({
        idlingWasteInr: 100,
        detourWasteInr: 200,
        theftLossInr: 0,
        billFraudSuspectInr: 0,
        speedingLossInr: 0,
        lowMileageLossInr: 0,
      }),
      utilization: { fleet: { emptyKmWasteInr: 0 } },
    });
    expect(container.querySelector('.nd-v').textContent).toBe('₹300');
    expect(container.textContent).toContain('2 active categories');
  });

  it('says all nominal only when every channel was measured', () => {
    const { container } = renderCard({
      money: money({
        idlingWasteInr: 0,
        detourWasteInr: 0,
        theftLossInr: 0,
        billFraudSuspectInr: 0,
        speedingLossInr: 0,
        lowMileageLossInr: 0,
      }),
      utilization: { fleet: { emptyKmWasteInr: 0 } },
    });
    expect(container.textContent).toContain('All nominal');
  });

  // NEW response: no channel was measured, so the headline is not a ₹0.
  it('never reads as a zero loss when nothing was measured', () => {
    const { container } = renderCard();
    expect(container.querySelector('.nd-v').textContent).toBe('—');
    expect(container.textContent).toContain('Not measured');
    expect(container.textContent).not.toContain('₹0');
    expect(container.textContent).not.toContain('All nominal');
  });

  it('sums the measured channels and says how many it measured', () => {
    const { container } = renderCard({ money: money({ idlingWasteInr: 100 }) });
    expect(container.querySelector('.nd-v').textContent).toBe('₹100');
    expect(container.textContent).toContain('1 of 7 channels measured');
  });

  it('says how many trucks the empty-running waste covers', () => {
    const { container } = renderCard({
      utilization: {
        fleet: { emptyKmWasteInr: 3200, trucksAttributed: 42, kmPartial: true },
        vehicles: Array.from({ length: 51 }, (_, i) => ({ registrationNumber: `T${i}` })),
      },
    });
    expect(container.textContent).toContain('over 42 of 51 trucks');
    expect(container.textContent).toContain('Partly measured');
  });
});
