import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import IntelligenceSummaryTiles from './IntelligenceSummaryTiles';

const tiles = [
  {
    key: 'km',
    label: 'Kilometres driven',
    value: '42,180 km',
    severity: 'info',
    why: { text: 'From the odometer and the GPS.', basis: 'From 1,240 km of driving this week' },
    link: { label: 'See the runs', to: '/intelligence?tab=runs' },
  },
  {
    key: 'idle',
    label: 'Idling',
    value: '12.4 h',
    severity: 'watch',
    why: { text: 'Engine on, not moving.' },
    link: null,
  },
  {
    key: 'NO_DATA',
    label: 'No data from WB11F6562',
    value: '1 time',
    severity: 'act',
    why: { text: 'No reading for 8 days.', basis: 'First seen 2026-10-27T02:20:13.000Z' },
    link: { label: 'See the issues', to: '/intelligence?kind=NO_DATA' },
  },
  {
    key: 'REPORT_CARDS',
    label: 'Report cards',
    value: '126 trucks graded',
    severity: 'good',
    why: { text: '15 truck(s) excellent.' },
    link: { label: 'Open the report cards', to: '/intelligence?tab=report-cards' },
  },
];

describe('IntelligenceSummaryTiles', () => {
  it('shows every finding the API sent that the Issues tab does not already group', () => {
    render(
      <MemoryRouter>
        <IntelligenceSummaryTiles tiles={tiles} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Kilometres driven')).toBeInTheDocument();
    expect(screen.getByText('42,180 km')).toBeInTheDocument();
    expect(screen.getByText('Idling')).toBeInTheDocument();
    expect(screen.getByText('126 trucks graded')).toBeInTheDocument();
    expect(screen.queryByText('No data from WB11F6562')).not.toBeInTheDocument();
  });

  it('opens the tab an in-page link points at, mapping old tab names', () => {
    const onOpenTab = vi.fn();
    render(
      <MemoryRouter>
        <IntelligenceSummaryTiles tiles={tiles} onOpenTab={onOpenTab} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /^42,180 km/ }));
    expect(onOpenTab).toHaveBeenCalledWith('runs');
    fireEvent.click(screen.getByRole('button', { name: /^126 trucks graded/ }));
    expect(onOpenTab).toHaveBeenCalledWith('vehicles');
  });

  it('shows nothing when every tile is an issue the Issues tab already shows', () => {
    const { container } = render(
      <MemoryRouter>
        <IntelligenceSummaryTiles tiles={[tiles[2]]} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
