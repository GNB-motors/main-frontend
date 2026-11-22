import { Video } from 'lucide-react';

export default function FollowCameraToggle({ on = false, disabled = false, onToggle }) {
  return (
    <button
      type="button"
      className={`mbtn lt-follow-toggle${on ? ' is-active' : ''}`}
      aria-label="3D follow"
      aria-pressed={on}
      disabled={disabled}
      onClick={onToggle}
      title={
        disabled
          ? 'Select a vehicle with a recorded location to use 3D follow'
          : on
            ? 'Return to the previous map view'
            : 'Tilt the map and follow the truck'
      }
    >
      <Video size={15} aria-hidden="true" />
      3D follow
    </button>
  );
}
