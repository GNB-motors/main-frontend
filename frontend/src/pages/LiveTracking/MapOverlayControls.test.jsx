import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MapOverlayControls from './MapOverlayControls.jsx';

it('shows the date filter only while a selected vehicle has Trail open', () => {
  const props = {
    selectedVehicle: { plate: 'BR44GB1162' },
    replayState: { on: false },
    trailSelection: { period: 'today' },
    loadTrail: vi.fn(),
    isTrailVisible: false,
  };
  const view = render(<MapOverlayControls {...props} />);
  expect(screen.queryByRole('group', { name: 'Trail day' })).not.toBeInTheDocument();

  view.rerender(<MapOverlayControls {...props} isTrailVisible trailLoading />);
  expect(screen.getByRole('group', { name: 'Trail day' })).toBeVisible();

  view.rerender(<MapOverlayControls {...props} isTrailVisible trailNotice="No recorded trail." />);
  expect(screen.getByRole('group', { name: 'Trail day' })).toBeVisible();

  view.rerender(<MapOverlayControls {...props} isTrailVisible replayState={{ on: true }} />);
  expect(screen.queryByRole('group', { name: 'Trail day' })).not.toBeInTheDocument();

  view.rerender(<MapOverlayControls {...props} />);
  expect(screen.queryByRole('group', { name: 'Trail day' })).not.toBeInTheDocument();
});
