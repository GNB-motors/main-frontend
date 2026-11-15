import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Activity } from 'lucide-react';
import SectionCard from './SectionCard';

describe('SectionCard', () => {
  it('shows the title and the body', () => {
    render(
      <SectionCard icon={Activity} title="Now" tone="good">
        <p>Loading at JK BUXAR</p>
      </SectionCard>,
    );
    expect(screen.getByRole('heading', { name: 'Now' })).toBeInTheDocument();
    expect(screen.getByText('Loading at JK BUXAR')).toBeInTheDocument();
  });

  it('shows an action on the right of the header', () => {
    render(
      <SectionCard
        icon={Activity}
        title="Where next"
        action={<button type="button">Refresh</button>}
      >
        <p>body</p>
      </SectionCard>,
    );
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });

  it('works without an icon', () => {
    render(<SectionCard title="Plain">body</SectionCard>);
    expect(screen.getByRole('heading', { name: 'Plain' })).toBeInTheDocument();
  });
});
