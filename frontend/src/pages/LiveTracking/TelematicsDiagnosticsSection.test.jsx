import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import TelematicsDiagnosticsSection from './TelematicsDiagnosticsSection';

const vehicle = {
  hasFix: true,
  lat: 22.5726,
  lng: 88.3639,
  live: true,
  odo: 1200,
  courseDegrees: 90,
};

const withClipboard = (writeText) =>
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

describe('TelematicsDiagnosticsSection', () => {
  afterEach(() => {
    delete navigator.clipboard;
  });

  it('copies the coordinates and says so', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    withClipboard(writeText);
    const showToast = vi.fn();
    render(<TelematicsDiagnosticsSection selectedVehicle={vehicle} showToast={showToast} />);
    fireEvent.click(screen.getByRole('button', { name: /22\.5726, 88\.3639/ }));
    expect(writeText).toHaveBeenCalledWith('22.5726, 88.3639');
    await waitFor(() => expect(showToast).toHaveBeenCalledWith('Coordinates copied to clipboard'));
  });

  // It used to toast "copied" even when the browser refused the write.
  it('says the copy failed when the clipboard refuses', async () => {
    withClipboard(vi.fn(() => Promise.reject(new Error('denied'))));
    const showToast = vi.fn();
    render(<TelematicsDiagnosticsSection selectedVehicle={vehicle} showToast={showToast} />);
    fireEvent.click(screen.getByRole('button', { name: /22\.5726/ }));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith('Could not copy the coordinates'));
    expect(showToast).not.toHaveBeenCalledWith('Coordinates copied to clipboard');
  });
});
