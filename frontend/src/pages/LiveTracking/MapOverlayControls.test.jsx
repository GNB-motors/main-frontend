import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MapOverlayControls from './MapOverlayControls.jsx';
import FollowCameraToggle from './FollowCameraToggle.jsx';
import TrafficToggle from './TrafficToggle.jsx';

it('places the 3D follow toggle beside Traffic and exposes its state', () => {
  const onToggle = vi.fn();
  const { rerender } = render(
    <MapOverlayControls
      trafficToggle={<TrafficToggle />}
      followCameraToggle={<FollowCameraToggle onToggle={onToggle} />}
    />,
  );
  const follow = screen.getByRole('button', { name: '3D follow' });
  expect(follow.closest('.ov-right-row')).toBe(
    screen.getByRole('button', { name: 'Traffic' }).closest('.ov-right-row'),
  );
  expect(follow).toHaveAttribute('aria-pressed', 'false');
  fireEvent.click(follow);
  expect(onToggle).toHaveBeenCalledOnce();
  rerender(<MapOverlayControls followCameraToggle={<FollowCameraToggle on disabled />} />);
  expect(screen.getByRole('button', { name: '3D follow' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '3D follow' })).toHaveAttribute('aria-pressed', 'true');
});

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
