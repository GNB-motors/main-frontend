import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlaceName from './PlaceName';

describe('PlaceName', () => {
  it('shows the place name', () => {
    render(<PlaceName place={{ id: 'p1', name: 'JK BUXAR', category: 'PLANT', kind: 'SITE' }} />);
    expect(screen.getByText('JK BUXAR')).toBeInTheDocument();
  });

  it('shows the category with a colour dot when asked', () => {
    render(<PlaceName place={{ id: 'p1', name: 'JK BUXAR', category: 'PLANT' }} showCategory />);
    expect(screen.getByText('PLANT')).toBeInTheDocument();
  });

  it('never prints Unknown site', () => {
    render(<PlaceName place={{ id: 'p1', name: 'Near Sasaram', category: null }} />);
    expect(screen.queryByText('Unknown site')).not.toBeInTheDocument();
  });

  it('says the location is not known when there is no place', () => {
    render(<PlaceName place={null} />);
    expect(screen.getByText('Location not known')).toBeInTheDocument();
  });
});
