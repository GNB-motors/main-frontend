import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TrackMapKey from './TrackMapKey';

describe('TrackMapKey', () => {
  it('names only the place layers that are drawn', () => {
    render(<TrackMapKey tab="places" places={[{ type: 'PLANT' }]} reviewCount={2} tollCount={0} />);
    const key = screen.getByRole('note', { name: 'Map key' });
    expect(key).toHaveTextContent('Place to review');
    expect(key).not.toHaveTextContent('Toll plaza');
    expect(key).not.toHaveTextContent('Idling now');
  });
  it('explains route line styles for the route kind on screen', () => {
    render(
      <TrackMapKey
        tab="routes"
        routeKind="delivery"
        routeLines={[{ source: 'DRIVEN' }, { source: 'ENGINE' }]}
      />,
    );
    const key = screen.getByRole('note', { name: 'Map key' });
    expect(key).toHaveTextContent('Delivery routes · thicker = more trips');
    expect(key).toHaveTextContent('Road our trucks drove');
    expect(key).not.toHaveTextContent('Straight-line link');
  });
  it('renders nothing when nothing is drawn', () => {
    const { container } = render(<TrackMapKey tab="routes" routeLines={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
  it('shows shaded areas under the pin symbols and keeps the explanation behind an info button', () => {
    render(
      <TrackMapKey
        tab="places"
        places={[
          { type: 'PLANT', polygon: [{}], purpose: 'general' },
          { type: 'FUEL_PUMP', polygonParts: [[[]]], purpose: 'pump' },
          { type: 'UNLOADING', coreParts: [[[]]], risk: true, purpose: 'general' },
        ]}
      />,
    );
    const areas = within(screen.getByRole('group', { name: 'Place areas' }));
    expect(areas.getByText('Fuel-risk area')).toBeInTheDocument();
    expect(areas.getByText('Fuel-pump area')).toBeInTheDocument();
    expect(areas.getByText('Other place area')).toBeInTheDocument();
    expect(areas.getByRole('button', { name: 'About place area shading' })).toBeInTheDocument();
    expect(screen.queryByText(/Darker shading marks/)).not.toBeInTheDocument();
  });

  it('leaves area shading out when only pins or routes are drawn', () => {
    const { rerender } = render(<TrackMapKey tab="places" places={[{ type: 'FUEL_PUMP' }]} />);
    expect(screen.queryByRole('group', { name: 'Place areas' })).not.toBeInTheDocument();
    rerender(
      <TrackMapKey
        tab="routes"
        routeLines={[{ source: 'DRIVEN' }]}
        places={[{ type: 'PLANT', polygon: [{}] }]}
      />,
    );
    expect(screen.queryByRole('group', { name: 'Place areas' })).not.toBeInTheDocument();
  });

  it('collapses for a narrow map, opens on demand and expands again when the map has space', () => {
    let resize;
    const disconnect = vi.fn();
    const observer = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      constructor(callback) {
        resize = callback;
      }
      observe() {}
      disconnect() {
        disconnect();
      }
    };
    try {
      const { unmount } = render(<TrackMapKey tab="places" places={[{ type: 'PLANT' }]} />);
      act(() => resize([{ contentRect: { width: 700, height: 600 } }]));
      expect(screen.queryByRole('note', { name: 'Map key' })).not.toBeInTheDocument();
      const toggle = screen.getByRole('button', { name: 'Map legend' });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(toggle);
      expect(screen.getByRole('note', { name: 'Map key' })).toBeInTheDocument();
      fireEvent.click(toggle);
      act(() => resize([{ contentRect: { width: 1200, height: 700 } }]));
      expect(screen.getByRole('note', { name: 'Map key' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Map legend' })).not.toBeInTheDocument();
      unmount();
      expect(disconnect).toHaveBeenCalledOnce();
    } finally {
      globalThis.ResizeObserver = observer;
    }
  });
});
