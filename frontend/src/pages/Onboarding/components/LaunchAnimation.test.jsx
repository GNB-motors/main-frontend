import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('lottie-react', () => ({
  default: () => <div data-testid="lottie" />,
}));
vi.mock('../OnboardingService.js', () => ({
  OnboardingService: { getLandingRoute: vi.fn(async () => '/') },
}));

import LaunchAnimation from './LaunchAnimation.jsx';

const renderIt = () =>
  render(
    <MemoryRouter>
      <LaunchAnimation />
    </MemoryRouter>,
  );

describe('LaunchAnimation', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('plays the animation once its data file loads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ layers: [] }) })),
    );
    renderIt();
    await waitFor(() => expect(screen.getByTestId('lottie')).toBeTruthy());
    expect(screen.getByText('All Set!')).toBeTruthy();
  });

  it('still shows the launch text when the animation file cannot load', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('offline');
    });
    vi.stubGlobal('fetch', fetchMock);
    renderIt();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByText('Launching your dashboard...')).toBeTruthy();
    expect(screen.queryByTestId('lottie')).toBeNull();
  });
});
