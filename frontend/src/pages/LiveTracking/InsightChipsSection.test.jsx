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

  it('says it cannot judge when there is no driving to judge', () => {
    render(
      <MemoryRouter>
        <InsightChipsSection chips={[]} registrationNumber="WB11L8862" />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Not enough driving in the last 7 days/)).toBeInTheDocument();
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
