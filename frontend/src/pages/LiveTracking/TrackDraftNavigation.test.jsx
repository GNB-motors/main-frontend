import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrackPlaceDraft from './TrackPlaceDraft';
import TrackZoneDraft from './TrackZoneDraft';
import { newDraft } from '../PlaceHub/model/placeDraft';

describe('map draft navigation', () => {
  it('allows leaving a place declaration from its header without saving', () => {
    const cancel = vi.fn(),
      save = vi.fn();
    const view = render(
      <TrackPlaceDraft
        draft={{ name: '', radiusM: 100 }}
        onCancel={cancel}
        onSave={save}
        onChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back to map' }));
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
    view.rerender(
      <TrackPlaceDraft
        draft={{ name: '', radiusM: 100 }}
        saving
        onCancel={cancel}
        onSave={save}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Back to map' })).toBeDisabled();
  });
  it('supports returning from the zone editor to its originating place', () => {
    const cancel = vi.fn(),
      save = vi.fn();
    const view = render(
      <TrackZoneDraft
        draft={newDraft('ZONE')}
        backLabel="Back to place"
        onCancel={cancel}
        onSave={save}
        onChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back to place' }));
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
    view.rerender(
      <TrackZoneDraft
        draft={newDraft('ZONE')}
        saving
        backLabel="Back to place"
        onCancel={cancel}
        onSave={save}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Back to place' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
  });
});
