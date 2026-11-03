import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DeepLink from './DeepLink';

describe('DeepLink', () => {
  it('links to the destination the API chose', () => {
    render(
      <MemoryRouter>
        <DeepLink link={{ label: 'See all in Intelligence', to: '/intelligence?tab=runs' }} />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/intelligence?tab=runs');
    expect(link).toHaveTextContent('See all in Intelligence →');
  });

  it('renders nothing without a destination', () => {
    const { container } = render(
      <MemoryRouter>
        <DeepLink link={null} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
