import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Breadcrumbs } from './vehicle360Header';

vi.mock('./VehicleModel3D', () => ({ default: () => null }));
vi.mock('./VehicleMiniMap', () => ({ default: () => null }));

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

const renderAt = (entries, index) =>
  render(
    <MemoryRouter initialEntries={entries} initialIndex={index}>
      <Routes>
        <Route path="/vehicles/:reg" element={<Breadcrumbs reg="WB11S1962" />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );

describe('truck page back button', () => {
  it('goes back to the page the owner came from', () => {
    window.history.replaceState({ idx: 1 }, '');
    renderAt(['/digest', '/vehicles/WB11S1962'], 1);
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/digest');
  });

  it('opens the vehicle list when the page was opened directly', () => {
    window.history.replaceState({ idx: 0 }, '');
    renderAt(['/vehicles/WB11S1962'], 0);
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/vehicles');
  });
});
