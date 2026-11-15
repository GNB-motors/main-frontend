import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrackReviewPanel from './TrackReviewPanel';

const answer = vi.hoisted(() => ({ busyId: null, accept: vi.fn(), reject: vi.fn() }));
vi.mock('../PlaceHub/intelligence/useSiteAnswer.js', () => ({ default: () => answer }));
vi.mock('../../utils/session', () => ({ getUserRole: () => 'OWNER' }));

describe('place confirmation navigation', () => {
  it('offers explicit back and close actions without making a declaration', () => {
    const onClose = vi.fn();
    render(
      <TrackReviewPanel
        site={{ _id: 's', status: 'CONFIRMED', siteType: 'UNLOADING_POINT' }}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('This place has been confirmed.')).toBeInTheDocument();
    expect(screen.queryByText('This place has not been confirmed yet.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to places' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close place confirmation' }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(answer.accept).not.toHaveBeenCalled();
    expect(answer.reject).not.toHaveBeenCalled();
  });
});
