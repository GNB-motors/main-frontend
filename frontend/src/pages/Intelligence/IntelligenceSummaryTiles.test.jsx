import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
];

describe('IntelligenceSummaryTiles', () => {
  it('shows every tile the API sent, in order', () => {
    render(
      <MemoryRouter>
        <IntelligenceSummaryTiles tiles={tiles} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Kilometres driven')).toBeInTheDocument();
    expect(screen.getByText('42,180 km')).toBeInTheDocument();
    expect(screen.getByText('Idling')).toBeInTheDocument();
  });

  it('makes a tile a link when the API knows where the evidence is', () => {
    render(
      <MemoryRouter>
        <IntelligenceSummaryTiles tiles={tiles} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Kilometres driven/ })).toHaveAttribute(
      'href',
      '/intelligence?tab=runs',
    );
  });

  it('shows nothing when there are no tiles', () => {
    const { container } = render(<IntelligenceSummaryTiles tiles={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
