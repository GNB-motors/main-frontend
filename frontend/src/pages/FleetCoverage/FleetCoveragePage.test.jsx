import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import FleetCoveragePage from './FleetCoveragePage';

vi.mock('../../services/FleetDataService', () => ({
  default: { getFleetCoverage: vi.fn(() => new Promise(() => {})) },
}));

const renderFrom = (entries) =>
  render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
      <Routes>
        <Route path="/fleet-coverage" element={<FleetCoveragePage />} />
        <Route path="/profile" element={<p>Profile page</p>} />
        <Route path="/vehicles/:reg" element={<p>Vehicle 360</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('FleetCoveragePage back button', () => {
  it('returns to the page it was opened from', () => {
    renderFrom(['/vehicles/WB25V8040', '/fleet-coverage']);
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByText('Vehicle 360')).toBeInTheDocument();
  });

  it('falls back to Profile when opened directly', () => {
    renderFrom(['/fleet-coverage']);
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByText('Profile page')).toBeInTheDocument();
  });
});
