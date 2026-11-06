import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import TripEvidence from './TripEvidence';
afterEach(cleanup);
it('explains incomplete boundary evidence without calling it a delivery', () => {
  render(
    <TripEvidence
      trip={{
        boundaryDecision: {
          result: 'UNRESOLVED',
          reason: 'UNKNOWN_COVERAGE',
          ruleRevision: 'internal-2',
        },
      }}
    />,
  );
  expect(screen.getByText(/Coverage is insufficient/)).toBeInTheDocument();
  expect(screen.queryByText('internal-2')).not.toBeInTheDocument();
});
it('distinguishes register association from observed delivery', () => {
  render(<TripEvidence trip={{ drop: { source: 'REGISTER' } }} />);
  expect(
    screen.getByText(/does not provide an observed unloading time or proof of delivery/),
  ).toBeInTheDocument();
});
it('does not invent a decision for an older result', () => {
  const { container } = render(<TripEvidence trip={{ status: 'COMPLETE' }} />);
  expect(container).toBeEmptyDOMElement();
});
