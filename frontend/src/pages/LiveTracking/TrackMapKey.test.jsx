import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
