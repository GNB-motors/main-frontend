import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { getDigest } = vi.hoisted(() => ({ getDigest: vi.fn() }));

vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: { getDigest },
}));

import DailyDigestPage from './DailyDigestPage';
import digestFixture from '../../test/fixtures/redesign/digest.json';

const renderPage = () =>
  render(
    <MemoryRouter>
      <DailyDigestPage />
    </MemoryRouter>,
  );

describe('DailyDigestPage', () => {
  beforeEach(() => {
    getDigest.mockReset();
    getDigest.mockResolvedValue(digestFixture);
  });

  it('shows the headline the API sent', async () => {
    renderPage();
    expect(
      await screen.findByText('A good day: 41 loaded trips, 3 trucks need you.'),
    ).toBeInTheDocument();
  });

  it('renders the story cards in the order the API sent them', async () => {
    renderPage();
    await screen.findByText('Loaded runs');
    const headings = screen.getAllByRole('heading').map((h) => h.textContent);
    expect(headings.indexOf('Loaded runs')).toBeLessThan(headings.indexOf('Empty runs'));
    expect(headings.indexOf('Empty runs')).toBeLessThan(headings.indexOf('Who drove well'));
    expect(headings.indexOf('Who drove well')).toBeLessThan(headings.indexOf('Who needs a word'));
  });

  it('shows the card text exactly as the API sent it', async () => {
    renderPage();
    expect(
      await screen.findByText(/Most of your distance today carried cement and clinker/),
    ).toBeInTheDocument();
  });

  it('shows the big number of a card', async () => {
    renderPage();
    expect(await screen.findByText('41 trips · 4,820 km')).toBeInTheDocument();
  });

  it('links a card to where the API said', async () => {
    renderPage();
    const link = await screen.findByText('See all in Intelligence →');
    expect(link.getAttribute('href')).toBe('/intelligence?tab=runs');
  });

  it('shows a reconnect banner with the button that fixes it', async () => {
    renderPage();
    expect(await screen.findByText(/is disconnected/)).toBeInTheDocument();
    const button = screen.getByRole('link', { name: 'Reconnect' });
    expect(button.getAttribute('href')).toBe('/settings/fleetedge-accounts');
  });

  it('says nothing happened on a quiet day', async () => {
    getDigest.mockResolvedValue({ date: '2026-11-02', headline: '', story: [] });
    renderPage();
    expect(await screen.findByText(/Nothing happened on this day/)).toBeInTheDocument();
  });

  it('says it could not load the digest when the request failed', async () => {
    getDigest.mockRejectedValue(new Error('boom'));
    renderPage();
    expect(await screen.findByText(/could not load today/)).toBeInTheDocument();
  });

  it('asks for the digest once, for the day it is showing', async () => {
    renderPage();
    await waitFor(() => expect(getDigest).toHaveBeenCalledTimes(1));
    expect(getDigest.mock.calls[0][0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
