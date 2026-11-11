import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import PlaceRecentVisits from './PlaceRecentVisits.jsx';

vi.mock('../../hooks/useApi', () => ({ useApi: vi.fn() }));
const place = { id: 'site:s1' };
const visits = Array.from({ length: 10 }, (_, i) => ({
  registrationNumber: `WB01AB${1000 + i}`,
  arrivedAt: '2026-11-11T04:30:00Z',
  dwellMin: i === 0 ? null : i === 1 ? 0 : 139,
}));
const show = () =>
  render(
    <MemoryRouter>
      <PlaceRecentVisits place={place} />
    </MemoryRouter>,
  );

beforeEach(() => useApi.mockReturnValue({ data: { items: visits }, loading: false }));

describe('place visit history', () => {
  it('shows five visits initially, expands the rest, and preserves the site history link', () => {
    show();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.queryByText('WB01AB1009')).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('0m')).toBeInTheDocument();
    expect(screen.getAllByText('2h 19m')).toHaveLength(3);
    const link = screen.getByRole('link', { name: 'All visits' });
    expect(new URL(link.getAttribute('href'), 'https://local.test').searchParams.get('site')).toBe(
      's1',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show 5 more visits' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    fireEvent.click(screen.getByRole('button', { name: 'Show fewer visits' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it.each([
    [{ loading: true }, 'Loading visits…'],
    [
      { loading: false, error: new Error('unavailable') },
      'Visit history could not be loaded. Reopen this place to try again.',
    ],
    [{ loading: false, data: { items: [] } }, 'No recorded visits to this place yet.'],
  ])('distinguishes loading, unavailable history and no visits', (response, text) => {
    useApi.mockReturnValue(response);
    show();
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
