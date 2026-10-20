import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../services/PlaceService', () => ({ resolvePlace: vi.fn() }));

import { resolvePlace } from '../../services/PlaceService';
import PlaceLabel from './PlaceLabel.jsx';

describe('PlaceLabel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('names the place once resolved', async () => {
    resolvePlace.mockResolvedValue({ label: 'Howrah', sub: 'West Bengal' });
    render(<PlaceLabel lat={22.58} lng={88.34} />);
    expect(await screen.findByText('Howrah')).toBeInTheDocument();
    expect(screen.getByText('West Bengal')).toBeInTheDocument();
  });

  it('does not spin forever when the lookup finds nothing', async () => {
    resolvePlace.mockResolvedValue(null);
    render(<PlaceLabel lat={22.58} lng={88.34} />);
    expect(screen.getByText('Finding location…')).toBeInTheDocument();
    const link = await screen.findByText('View on map');
    expect(link.closest('a')).toHaveAttribute('href', 'https://www.google.com/maps?q=22.58,88.34');
    expect(screen.queryByText('Finding location…')).not.toBeInTheDocument();
  });

  it('shows a dash without coordinates and never looks them up', () => {
    render(<PlaceLabel lat={null} lng={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(resolvePlace).not.toHaveBeenCalled();
  });
});
