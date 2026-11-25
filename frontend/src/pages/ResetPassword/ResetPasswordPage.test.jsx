import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import apiClient from '../../utils/axiosConfig';
import ResetPasswordPage from './ResetPasswordPage';

vi.mock('../../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/reset-password']}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<div>the login page</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.__gnbResetToken;
  });

  it('spec 1: without a token the page says the link does not work', async () => {
    renderPage();
    expect(
      await screen.findByRole('heading', { name: /This link does not work/i }),
    ).toBeInTheDocument();
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('spec 1: a valid link shows the form for that person and drops the token from the URL', async () => {
    window.__gnbResetToken = 'tok-123';
    apiClient.get.mockResolvedValue({
      data: { data: { valid: true, firstName: 'Asha', orgName: 'GNB Motors', role: 'DRIVER' } },
    });

    renderPage();

    expect(await screen.findByText(/Asha/)).toBeInTheDocument();
    expect(screen.getByText(/GNB Motors/)).toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe('/reset-password'));
    expect(window.location.href).not.toContain('tok-123');
  });

  it('spec 1/D6: the token is read once and deleted from the page after the first read', async () => {
    window.__gnbResetToken = 'tok-456';
    apiClient.get.mockResolvedValue({ data: { data: { valid: true, firstName: 'Asha' } } });

    renderPage();

    await screen.findByText(/Asha/);
    expect(window.__gnbResetToken).toBeUndefined();
  });

  it('spec 2: the signed-out calls carry skipAuthRedirect and a 401 never redirects to /login', async () => {
    window.__gnbResetToken = 'tok-789';
    apiClient.get.mockRejectedValue({ response: { status: 401, data: { message: 'bad token' } } });

    renderPage();

    expect(
      await screen.findByRole('heading', { name: /This link does not work/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText('the login page')).not.toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/auth/password-reset/verify',
      expect.objectContaining({ skipAuthRedirect: true, params: { token: 'tok-789' } }),
    );
  });

  it('spec 3: two different passwords show an inline error and never complete', async () => {
    window.__gnbResetToken = 'tok-abc';
    apiClient.get.mockResolvedValue({ data: { data: { valid: true, firstName: 'Asha' } } });

    renderPage();

    await screen.findByText(/Asha/);
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'longenough1' } });
    fireEvent.change(screen.getByLabelText(/Type it again/i), { target: { value: 'longenough2' } });
    fireEvent.click(screen.getByRole('button', { name: /Save new password/i }));

    expect(await screen.findByText('The two passwords do not match.')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('spec 3: a good password completes and shows "Password changed" with a Sign in button', async () => {
    window.__gnbResetToken = 'tok-ok';
    apiClient.get.mockResolvedValue({ data: { data: { valid: true, firstName: 'Asha' } } });
    apiClient.post.mockResolvedValue({ data: { status: 'success', message: 'done' } });

    renderPage();

    await screen.findByText(/Asha/);
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'longenough1' } });
    fireEvent.change(screen.getByLabelText(/Type it again/i), { target: { value: 'longenough1' } });
    fireEvent.click(screen.getByRole('button', { name: /Save new password/i }));

    expect(await screen.findByRole('heading', { name: /Password changed/i })).toBeInTheDocument();
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/auth/password-reset/complete',
      { token: 'tok-ok', password: 'longenough1' },
      expect.objectContaining({ skipAuthRedirect: true }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('the login page')).toBeInTheDocument();
  });
});
