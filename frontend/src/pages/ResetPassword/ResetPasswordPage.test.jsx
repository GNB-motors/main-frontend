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
    // A clean address bar and no stash: every test starts from scratch.
    window.history.replaceState(window.history.state, '', '/reset-password');
    try {
      window.sessionStorage.removeItem('gnb.resetToken');
    } catch {
      /* storage disabled */
    }
  });

  it('spec 1: without a token the page says the link does not work', async () => {
    renderPage();
    expect(
      await screen.findByRole('heading', { name: /This link does not work/i }),
    ).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('spec 1: a valid link shows the form for that person and drops the token from the URL', async () => {
    window.__gnbResetToken = 'tok-123';
    apiClient.post.mockResolvedValue({
      data: { data: { valid: true, firstName: 'Asha', orgName: 'GNB Motors', role: 'DRIVER' } },
    });

    renderPage();

    expect(await screen.findByText(/Asha/)).toBeInTheDocument();
    expect(screen.getByText(/GNB Motors/)).toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe('/reset-password'));
    expect(window.location.href).not.toContain('tok-123');
  });

  it('contract: the token is verified in the BODY, never in a URL', async () => {
    window.__gnbResetToken = 'tok-body';
    apiClient.post.mockResolvedValue({
      data: { data: { valid: true, firstName: 'Asha', orgName: 'GNB Motors', role: 'DRIVER' } },
    });

    renderPage();

    await screen.findByText(/Asha/);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/auth/password-reset/verify',
      { token: 'tok-body' },
      expect.objectContaining({ skipAuthRedirect: true }),
    );
    const [url] = apiClient.post.mock.calls[0];
    expect(url).not.toContain('tok-body');
  });

  it('review 4: a link with the token in the FRAGMENT works', async () => {
    window.location.hash = '#token=tok-frag';
    apiClient.post.mockResolvedValue({
      data: { data: { valid: true, firstName: 'Asha', orgName: 'GNB Motors', role: 'DRIVER' } },
    });

    renderPage();

    expect(await screen.findByText(/Asha/)).toBeInTheDocument();
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/auth/password-reset/verify',
      { token: 'tok-frag' },
      expect.objectContaining({ skipAuthRedirect: true }),
    );
    expect(window.location.href).not.toContain('tok-frag');
    expect(window.location.hash).toBe('');
  });

  it('review 4: the token the inline script left behind is used', async () => {
    window.sessionStorage.setItem('gnb.resetToken', 'tok-stash');
    apiClient.post.mockResolvedValue({
      data: { data: { valid: true, firstName: 'Asha', orgName: 'GNB Motors', role: 'DRIVER' } },
    });

    renderPage();

    expect(await screen.findByText(/Asha/)).toBeInTheDocument();
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/auth/password-reset/verify',
      { token: 'tok-stash' },
      expect.objectContaining({ skipAuthRedirect: true }),
    );
    expect(window.sessionStorage.getItem('gnb.resetToken')).toBeNull();
  });

  it('spec 1/D6: the token is read once and deleted from the page after the first read', async () => {
    window.__gnbResetToken = 'tok-456';
    apiClient.post.mockResolvedValue({ data: { data: { valid: true, firstName: 'Asha' } } });

    renderPage();

    await screen.findByText(/Asha/);
    expect(window.__gnbResetToken).toBeUndefined();
  });

  it('spec 2: the signed-out calls carry skipAuthRedirect and a 401 never redirects to /login', async () => {
    window.__gnbResetToken = 'tok-789';
    apiClient.post.mockRejectedValue({ response: { status: 401, data: { message: 'bad token' } } });

    renderPage();

    expect(
      await screen.findByRole('heading', { name: /This link does not work/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText('the login page')).not.toBeInTheDocument();
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/auth/password-reset/verify',
      { token: 'tok-789' },
      expect.objectContaining({ skipAuthRedirect: true }),
    );
  });

  it('spec 3: two different passwords show an inline error and never complete', async () => {
    window.__gnbResetToken = 'tok-abc';
    apiClient.post.mockResolvedValue({ data: { data: { valid: true, firstName: 'Asha' } } });

    renderPage();

    await screen.findByText(/Asha/);
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'longenough1' } });
    fireEvent.change(screen.getByLabelText(/Type it again/i), { target: { value: 'longenough2' } });
    fireEvent.click(screen.getByRole('button', { name: /Save new password/i }));

    expect(await screen.findByText('The two passwords do not match.')).toBeInTheDocument();
    // Only the verification call went out — the reset itself never did.
    expect(apiClient.post).toHaveBeenCalledTimes(1);
  });

  it('spec 3: a good password completes and shows "Password changed" with a Sign in button', async () => {
    window.__gnbResetToken = 'tok-ok';
    apiClient.post
      .mockResolvedValueOnce({ data: { data: { valid: true, firstName: 'Asha' } } })
      .mockResolvedValueOnce({ data: { status: 'success', message: 'done' } });

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
