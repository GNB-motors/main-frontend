import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrackLegend from './TrackLegend';
import { defaultLayerSelection, defaultStatusSelection } from './trackLegendModel';

const statusRows = [
  { key: 'moving', label: 'Moving', color: 'var(--rd-moving)', count: 20 },
  { key: 'idling', label: 'Idling', color: 'var(--rd-idling)', count: 2 },
  { key: 'stopped', label: 'Stopped', color: 'var(--rd-stopped)', count: 65 },
  { key: 'offline', label: 'Offline', color: 'var(--rd-offline)', count: 37 },
];

const makeRows = [{ key: 'Tata', label: 'Tata', count: 98 }];

function renderLegend(overrides = {}) {
  const props = {
    statusRows,
    makeRows,
    statusSelection: defaultStatusSelection(),
    makeSelection: { Tata: true },
    layerSelection: defaultLayerSelection(),
    onToggleStatus: vi.fn(),
    onOnlyStatus: vi.fn(),
    onAllStatus: vi.fn(),
    onToggleMake: vi.fn(),
    onOnlyMake: vi.fn(),
    onAllMake: vi.fn(),
    onToggleLayer: vi.fn(),
    onRefresh: vi.fn(),
    zoom: 12,
    ...overrides,
  };
  render(<TrackLegend {...props} />);
  if (!overrides.closed) fireEvent.click(screen.getByRole('button', { name: /moving|Layers/ }));
  return props;
}

describe('TrackLegend', () => {
  it('groups only confirmed-empty categories and retains unknown coverage', () => {
    renderLegend({ layerAvailability: { hospitals: { count: 0 }, police: { count: 0 }, pumps: { count: null, failed: true } } });
    const expand = screen.queryByRole('button', { name: 'Expand Places' });
    if (expand) fireEvent.click(expand);
    expect(screen.queryByRole('button', { name: /Hospitals/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pumps/ })).not.toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /2 categories without mapped data/ }));
    expect(screen.getByRole('button', { name: /Hospitals/ })).toBeDisabled();
  });
  it('offers the All tolls switch independently of other category layers', () => {
    const change = vi.fn();
    renderLegend({ onToggleAllTolls: change, showAllTolls: true, layerSelection: { ...defaultLayerSelection(), tolls: true }, tollInfo: { visitedCount: 56, allCount: 19 } });
    const expand = screen.queryByRole('button', { name: 'Expand Places' });
    if (expand) fireEvent.click(expand);
    const toggle = screen.getByRole('switch', { name: 'Show all tolls in view' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(toggle);
    expect(change).toHaveBeenCalled();
    expect(screen.getByText('19 toll plazas in this view')).toBeInTheDocument();
  });
  it('is a labelled region of map filters', () => {
    renderLegend();
    expect(screen.getByRole('region', { name: 'Map filters' })).toBeInTheDocument();
  });

  it('shows every status with the full fleet count', () => {
    renderLegend();
    expect(screen.getByText('Moving')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('marks a row as pressed when it is on', () => {
    renderLegend();
    expect(screen.getByRole('button', { name: /Moving/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls back when a status row is clicked', () => {
    const props = renderLegend();
    fireEvent.click(screen.getByRole('button', { name: /Moving/ }));
    expect(props.onToggleStatus).toHaveBeenCalledWith('moving');
  });

  it('calls back with only-this when a row is double-clicked', () => {
    const props = renderLegend();
    fireEvent.doubleClick(screen.getByRole('button', { name: /Idling/ }));
    expect(props.onOnlyStatus).toHaveBeenCalledWith('idling');
  });

  it('offers All only when something is off', () => {
    renderLegend();
    expect(screen.queryByRole('button', { name: 'All' })).not.toBeInTheDocument();
  });

  it('offers All when a row is off', () => {
    const props = renderLegend({
      statusSelection: { ...defaultStatusSelection(), moving: false },
    });
    const all = screen.getAllByRole('button', { name: 'All' })[0];
    fireEvent.click(all);
    expect(props.onAllStatus).toHaveBeenCalled();
  });

  it('lists the make of the fleet and no other', () => {
    renderLegend();
    expect(screen.getByText('Tata')).toBeInTheDocument();
    expect(screen.queryByText('Ashok Leyland')).not.toBeInTheDocument();
  });

  it('shows local counts and empty states instead of blocking pins by zoom', () => {
    renderLegend({ zoom: 7, layerSelection: { ...defaultLayerSelection(), dhabas: true }, nearbyInfo: { loaded: true, counts: { pumps: 6, dhabas: 0 } } });
    const expand = screen.queryByRole('button', { name: 'Expand Places' });
    if (expand) fireEvent.click(expand);
    expect(screen.queryByText('Zoom in to see nearby places.')).not.toBeInTheDocument();
    expect(screen.getByText('6 in this view')).toBeInTheDocument();
    expect(screen.getByText('None in this view')).toBeInTheDocument();
  });

  it('does not ask for a zoom when the map is close enough', () => {
    renderLegend({ zoom: 13 });
    const expand = screen.queryByRole('button', { name: 'Expand Places' });
    if (expand) fireEvent.click(expand);
    expect(screen.queryByText('Zoom in to see')).not.toBeInTheDocument();
  });

  it('says a layer is coming soon when the endpoint is not deployed', () => {
    renderLegend({ placesNotAvailable: true });
    const expand = screen.queryByRole('button', { name: 'Expand Places' });
    if (expand) fireEvent.click(expand);
    expect(screen.getAllByRole('button', { name: 'What is this?' }).length).toBeGreaterThan(0);
    const rows = screen.getAllByRole('button', { name: /Pumps/ });
    expect(rows[0]).toBeDisabled();
  });

  it('refreshes the fleet on demand', () => {
    const props = renderLegend();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh fleet data' }));
    expect(props.onRefresh).toHaveBeenCalled();
  });

  it('collapses to a pill and remembers it', () => {
    renderLegend();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse filters' }));
    expect(screen.getByRole('button', { name: /moving/ })).toBeInTheDocument();
  });

  it('shows the real moving count on the collapsed pill, not zero', () => {
    localStorage.setItem('track.legend.open', 'false');
    renderLegend({ closed: true });
    expect(screen.getByRole('button', { name: /20\s*moving/ })).toBeInTheDocument();
  });

  // The top toolbar owns Trucks and Make now; the legend keeps only Places.
  it('is a Places-only panel when given no status or make rows', () => {
    // An earlier test collapses the legend via localStorage; force it open so
    // the "Places" heading (only shown when expanded) is present.
    localStorage.setItem('track.legend.open', 'true');
    renderLegend({ statusRows: [], makeRows: [] });
    expect(screen.queryByText('Trucks')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Places', level: 2 })).toBeInTheDocument();
  });

  it('collapses to a Places pill, not a moving count, in Places-only mode', () => {
    localStorage.setItem('track.legend.open', 'false');
    renderLegend({ statusRows: [], makeRows: [], closed: true });
    const pill = screen.getByRole('button', { name: /Layers/ });
    expect(pill).toBeInTheDocument();
    expect(pill).not.toHaveTextContent('moving');
  });
});
