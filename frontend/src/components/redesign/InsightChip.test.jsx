import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InsightChip from './InsightChip';

const goodChip = {
  key: 'CRUISE',
  tone: 'good',
  label: 'Steady cruise',
  why: { text: 'Held 60 km/h for 6 h a day.', basis: 'From 1,240 km' },
  link: { label: 'See the 6 times', to: '/intelligence?tab=cruise' },
};

const badChip = {
  key: 'IDLE',
  tone: 'bad',
  label: 'Idles 2.1 h/day',
  why: { text: 'Engine on, not moving.', basis: null },
  link: { label: 'See the 12 times', to: '/intelligence?tab=idling' },
};

describe('InsightChip', () => {
  it('shows the label of a good insight', () => {
    render(
      <MemoryRouter>
        <InsightChip chip={goodChip} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Steady cruise')).toBeInTheDocument();
  });

  it('shows the label of a bad insight', () => {
    render(
      <MemoryRouter>
        <InsightChip chip={badChip} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Idles 2.1 h/day')).toBeInTheDocument();
  });

  it('renders nothing without a chip', () => {
    const { container } = render(
      <MemoryRouter>
        <InsightChip chip={null} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
