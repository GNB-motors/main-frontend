import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VehiclePanelActions from './VehiclePanelActions';

describe('VehiclePanelActions', () => {
  it('offers Track as the main action', () => {
    render(
      <MemoryRouter>
        <VehiclePanelActions registrationNumber="WB11L8862" />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /Track/ });
    expect(link.getAttribute('href')).toContain('v=WB11L8862');
    expect(link.getAttribute('href')).toContain('from=');
    expect(link.getAttribute('href')).toContain('to=');
  });

  it('offers Share as the second action', () => {
    const onShare = vi.fn();
    render(
      <MemoryRouter>
        <VehiclePanelActions registrationNumber="WB11L8862" onShare={onShare} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Share/ }));
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('has no separate Replay button any more', () => {
    render(
      <MemoryRouter>
        <VehiclePanelActions registrationNumber="WB11L8862" />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('button', { name: /Replay/ })).not.toBeInTheDocument();
  });
});
