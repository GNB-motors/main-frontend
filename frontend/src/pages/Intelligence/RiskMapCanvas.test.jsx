import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import RiskMapCanvas from './RiskMapCanvas.jsx';

vi.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: true }),
  GoogleMap: ({ children }) => <div>{children}</div>,
  OverlayViewF: ({ children }) => <div>{children}</div>,
  MarkerF: ({ title, onMouseOver, onMouseOut, onClick }) => (
    <button
      aria-label={title}
      onMouseOver={onMouseOver}
      onFocus={onMouseOver}
      onMouseOut={onMouseOut}
      onBlur={onMouseOut}
      onClick={onClick}
    />
  ),
  CircleF: () => null,
}));
vi.mock('../PlaceHub/map/mapIcons.js', () => ({ dotIcon: () => ({}), diamondIcon: () => ({}) }));

const cell = {
  id: 'drain:one',
  lat: 22,
  lng: 87,
  events: 3,
  litres: 42.5,
  rupees: 4037,
  vehicles: ['WB11L8862', 'WB11T0662'],
};

describe('RiskMapCanvas fuel hover', () => {
  it('shows live truck and clustered idle details on hover, then closes', () => {
    const onSelect = vi.fn();
    render(
      <RiskMapCanvas
        type="idling"
        onSelect={onSelect}
        idleLive={[
          {
            _id: 'live-one',
            registrationNumber: 'WB11T0662',
            lat: 22,
            lng: 87,
            durationMin: 25,
            rupees: 100,
            legitimacy: 'excess',
          },
        ]}
        idleSpots={[
          {
            id: 'idle:one',
            lat: 23,
            lng: 88,
            events: 4,
            hours: 2,
            rupees: 200,
            excessShare: 1,
            trucks: ['WB11L8862'],
          },
        ]}
      />,
    );
    const truck = screen.getByRole('button', { name: /WB11T0662/ });
    fireEvent.mouseOver(truck);
    expect(screen.getByRole('tooltip')).toHaveTextContent('25 min idling');
    expect(screen.getByRole('tooltip')).toHaveTextContent('₹100 estimated cost');
    fireEvent.click(truck);
    expect(onSelect).toHaveBeenCalledWith('live:live-one');
    fireEvent.mouseOut(truck);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    const spot = screen.getByRole('button', { name: /4 idles/ });
    fireEvent.mouseOver(spot);
    expect(screen.getByRole('tooltip')).toHaveTextContent('4 idle events');
    expect(screen.getByRole('tooltip')).toHaveTextContent('WB11L8862');
    fireEvent.mouseOut(spot);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows recorded drop data only on hover and preserves marker selection', () => {
    const onSelect = vi.fn();
    render(<RiskMapCanvas type="fuel" drainCells={[cell]} onSelect={onSelect} />);
    const marker = screen.getByRole('button', { name: /3 fuel drops/ });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.mouseOver(marker);
    const tooltip = screen.getByRole('tooltip');
    expect(within(tooltip).getByText('42.5 L recorded')).toBeInTheDocument();
    expect(within(tooltip).getByText('2 trucks')).toBeInTheDocument();
    expect(within(tooltip).getByText(/estimated value/)).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(marker);
    expect(onSelect).toHaveBeenCalledWith(cell.id);
    fireEvent.mouseOut(marker);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows network hotspot data without inventing missing measurements', () => {
    render(
      <RiskMapCanvas
        type="fuel"
        hotspots={[
          {
            id: 'hotspot:one',
            name: 'Depot',
            lat: 22,
            lng: 87,
            active: true,
            provenance: 'network',
            radiusM: 300,
          },
        ]}
      />,
    );
    fireEvent.mouseOver(screen.getByRole('button', { name: 'Depot' }));
    const tooltip = screen.getByRole('tooltip');
    expect(within(tooltip).getByText('Network hotspot')).toBeInTheDocument();
    expect(within(tooltip).getByText('300 m radius')).toBeInTheDocument();
    expect(within(tooltip).queryByText(/incidents|estimated value/)).not.toBeInTheDocument();
    fireEvent.mouseOut(screen.getByRole('button', { name: 'Depot' }));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
