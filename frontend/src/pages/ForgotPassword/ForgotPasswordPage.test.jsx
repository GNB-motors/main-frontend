import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from './ForgotPasswordPage';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../Support/supportContact';

describe('ForgotPasswordPage', () => {
  it('sends employees to their manager and owners to GNB support', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /I'm an employee/ })).toBeInTheDocument();
    expect(screen.getByText(/Contact your manager or company owner/)).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /I'm an owner or admin/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: SUPPORT_PHONE })).toHaveAttribute(
      'href',
      `tel:${SUPPORT_PHONE}`,
    );
    expect(screen.getByRole('link', { name: SUPPORT_EMAIL })).toHaveAttribute(
      'href',
      `mailto:${SUPPORT_EMAIL}`,
    );
    expect(screen.getByRole('link', { name: /Back to sign in/ })).toHaveAttribute('href', '/login');
  });
});
