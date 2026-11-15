import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import MapLayerPills from './MapLayerPills.jsx';

describe('Top-bar map layer pills', () => {
  afterEach(cleanup);
  it('shows only Places and Congestion, both off by default', () => {
    const togglePlaces = vi.fn();
    const toggleCongestion = vi.fn();
    render(
      <MapLayerPills
        isPlacesVisible={false}
        togglePlaces={togglePlaces}
        isCongestionVisible={false}
        toggleCongestion={toggleCongestion}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Places', 'Congestion']);
    buttons.forEach((b) => expect(b).toHaveAttribute('aria-pressed', 'false'));
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    expect(togglePlaces).toHaveBeenCalled();
    expect(toggleCongestion).toHaveBeenCalledWith(true);
  });

  it('keeps the congestion explanation out of the way until its ⓘ is clicked', () => {
    const { rerender } = render(
      <MapLayerPills
        isPlacesVisible={false}
        togglePlaces={() => {}}
        isCongestionVisible={false}
        toggleCongestion={() => {}}
        congestionDetails={<p>What the colours mean</p>}
      />,
    );
    expect(screen.queryByLabelText('What the congestion colours mean')).toBeNull();
    rerender(
      <MapLayerPills
        isPlacesVisible={false}
        togglePlaces={() => {}}
        isCongestionVisible
        toggleCongestion={() => {}}
        congestionDetails={<p>What the colours mean</p>}
      />,
    );
    expect(screen.queryByText('What the colours mean')).toBeNull();
    fireEvent.click(screen.getByLabelText('What the congestion colours mean'));
    expect(screen.getByText('What the colours mean')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('What the colours mean')).toBeNull();
    fireEvent.click(screen.getByLabelText('What the congestion colours mean'));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('What the colours mean')).toBeNull();
  });
});
