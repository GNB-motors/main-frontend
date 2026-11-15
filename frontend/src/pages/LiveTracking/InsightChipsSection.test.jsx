import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InsightChipsSection from './InsightChipsSection';

const chip = {
  key: 'CRUISE',
  tone: 'good',
  label: 'Steady cruise',
  why: { text: 'This truck held 60 km/h for 6 h a day this week.', basis: 'From 1,240 km' },
  link: { label: 'See the 6 times', to: '/intelligence?tab=cruise&vehicle=WB11L8862' },
};

describe('InsightChipsSection', () => {
  it('shows what is going well', () => {
    render(
      <MemoryRouter>
        <InsightChipsSection chips={[chip]} registrationNumber="WB11L8862" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Steady cruise')).toBeInTheDocument();
  });

  it('draws nothing when there are no chips, rather than a sentence a moving truck contradicts', () => {
    const { container } = render(
      <MemoryRouter>
        <InsightChipsSection chips={[]} registrationNumber="WB11L8862" />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/Not enough driving/)).not.toBeInTheDocument();
  });

  it('links to the full report', () => {
    render(
      <MemoryRouter>
        <InsightChipsSection chips={[chip]} registrationNumber="WB11L8862" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /See full report/ }).getAttribute('href')).toBe(
      '/intelligence?tab=vehicles&vehicle=WB11L8862',
    );
  });
});
