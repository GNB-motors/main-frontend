import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import MergeJobStatus from './MergeJobStatus';

it('shows recalculation progress without an early completion message', () => {
  render(<MergeJobStatus job={{ jobId: 'one', status: 'RUNNING', stage: 'trips' }} />);
  expect(screen.getByText('Recalculating trips')).toBeInTheDocument();
  expect(screen.queryByText('Places merged and results recalculated')).not.toBeInTheDocument();
});
it('shows a safe retry on partial failure and preserves the error', () => {
  const retry = vi.fn();
  render(<MergeJobStatus job={{ jobId: 'one', status: 'FAILED', active: true, error: 'A route failed' }} onRetry={retry} />);
  expect(screen.getByRole('alert')).toHaveTextContent('A route failed');
  fireEvent.click(screen.getByRole('button', { name: 'Retry recalculation' })); expect(retry).toHaveBeenCalledOnce();
});
it('reports manual or historical review honestly after completion', () => {
  render(<MergeJobStatus job={{ jobId: 'one', status: 'COMPLETE', stage: 'complete', stages: { validate: { result: { reviewRequired: 2 } } } }} />);
  expect(screen.getByText(/2 historical trip results need review/)).toBeInTheDocument();
});
