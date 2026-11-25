import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from './ForgotPasswordPage';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../Support/supportContact';
import { PasswordResetService } from '../../services/PasswordResetService';

vi.mock('../../services/PasswordResetService', () => ({
  PasswordResetService: {
    requestReset: vi.fn(),
    verifyReset: vi.fn(),
    completeReset: vi.fn(),
  },
  default: { requestReset: vi.fn() },
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('goal: shows an email box with a "Send reset link" button, disabled until the address is valid', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    const button = screen.getByRole('button', { name: /Send reset link/i });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'asha@gnb.com' } });
    expect(button).not.toBeDisabled();
  });

  it('goal: sending the link shows "Check your email" with the address', async () => {
    PasswordResetService.requestReset.mockResolvedValue({ status: 'success' });
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'asha@gnb.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send reset link/i }));

    expect(await screen.findByRole('heading', { name: /Check your email/i })).toBeInTheDocument();
    expect(screen.getByText('asha@gnb.com')).toBeInTheDocument();
    expect(PasswordResetService.requestReset).toHaveBeenCalledWith('asha@gnb.com');
  });

  it('spec 2: a 429 answer shows the friendly text and stays on the form', async () => {
    PasswordResetService.requestReset.mockRejectedValue({ status: 429 });
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'asha@gnb.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send reset link/i }));

    expect(await screen.findByText(/Too many requests/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('goal: the driver and support help stays below the email box', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /No email on your account/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Still stuck/i })).toBeInTheDocument();
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

  it('goal: "Use a different email" goes back to the form', async () => {
    PasswordResetService.requestReset.mockResolvedValue({ status: 'success' });
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'asha@gnb.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send reset link/i }));
    await screen.findByRole('heading', { name: /Check your email/i });

    fireEvent.click(screen.getByRole('button', { name: /Use a different email/i }));
    await waitFor(() => expect(screen.getByLabelText('Email')).toBeInTheDocument());
  });
});
