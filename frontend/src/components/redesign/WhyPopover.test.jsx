import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WhyPopover from './WhyPopover';

describe('WhyPopover', () => {
  it('prints the plain sentence and its evidence', () => {
    render(<WhyPopover why={{ text: 'Fuel went down while parked.', basis: '4 fills checked' }} />);
    expect(screen.getByText('Fuel went down while parked.')).toBeInTheDocument();
    expect(screen.getByText('4 fills checked')).toBeInTheDocument();
  });

  it('links to the evidence when there is one', () => {
    render(
      <MemoryRouter>
        <WhyPopover why={{ text: 'x' }} link={{ label: 'See the 6 times', to: '/intelligence?tab=idling' }} />
      </MemoryRouter>,
    );
    expect(screen.getByText('→ See the 6 times')).toBeInTheDocument();
  });

  it('renders nothing when there is nothing to say', () => {
    const { container } = render(<WhyPopover />);
    expect(container).toBeEmptyDOMElement();
  });
});
