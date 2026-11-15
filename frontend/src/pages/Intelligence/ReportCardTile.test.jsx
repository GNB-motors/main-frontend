import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReportCardTile from './ReportCardTile';

const card = {
  id: 'WB11F6762',
  subject: 'vehicle',
  name: 'WB11F6762',
  make: 'Tata',
  model: '4830TC',
  grade: 'EXCELLENT',
  trend: 'UP',
  score: 88,
  headline: 'Best km/L in the fleet this week',
  strengths: [
    {
      key: 'cruise',
      tone: 'good',
      label: 'Steady cruise',
      why: { text: 'Held 60 km/h for 3.2 h.', basis: 'From 1,240 km' },
      link: null,
    },
  ],
  problems: [],
  kmInPeriod: 1240,
  basis: { text: 'From the truck\'s own reports.', basis: '1,240 km · 9 trips' },
};

describe('ReportCardTile', () => {
  it('says who it is about and how it is doing', () => {
    render(
      <MemoryRouter>
        <ReportCardTile card={card} onOpen={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /WB11F6762/ })).toBeInTheDocument();
    expect(screen.getByText(/Best km\/L in the fleet/)).toBeInTheDocument();
    expect(screen.getByText('Score 88')).toBeInTheDocument();
    expect(screen.getByText('1,240 km · 9 trips')).toBeInTheDocument();
  });

  it('opens the whole card when the name is clicked', async () => {
    const onOpen = vi.fn();
    render(
      <MemoryRouter>
        <ReportCardTile card={card} onOpen={onOpen} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /WB11F6762/ }));

    expect(onOpen).toHaveBeenCalledWith(card);
  });

  it('shows the advice of a slipping card', () => {
    render(
      <MemoryRouter>
        <ReportCardTile
          card={{
            ...card,
            grade: 'FALLING',
            trend: 'DOWN',
            strengths: [],
            problems: [
              {
                key: 'idle',
                tone: 'bad',
                label: 'Idles 2.1 h a day',
                why: { text: 'About 1 h more than similar trucks.' },
                link: null,
                advice: 'Ask the driver to switch off at plant queues.',
              },
            ],
          }}
          onOpen={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Idles 2.1 h a day')).toBeInTheDocument();
    expect(screen.getByText('Ask the driver to switch off at plant queues.')).toBeInTheDocument();
  });
});
