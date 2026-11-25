import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { toast } from 'react-toastify';
import ResetPasswordDialog from './ResetPasswordDialog.jsx';

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const DRIVER = { id: 'u1', name: 'Asha', roleLabel: 'Driver', email: null };
const DRIVER_WITH_EMAIL = { id: 'u2', name: 'Ravi', roleLabel: 'Driver', email: 'ravi@gnb.com' };

describe('ResetPasswordDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('spec 5: the email mode is disabled when the person has no email', () => {
    render(
      <ResetPasswordDialog open user={DRIVER} onSubmit={vi.fn()} onClose={vi.fn()} />,
    );

    expect(screen.getByRole('radio', { name: /Email a reset link/i })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /Set a new password/i })).toBeEnabled();
  });

  it('goal: "Make one for me" fills both password fields with one readable password', () => {
    render(<ResetPasswordDialog open user={DRIVER} onSubmit={vi.fn()} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Make one for me/i }));

    const password = screen.getByLabelText(/^new password$/i).value;
    const confirm = screen.getByLabelText(/Type it again/i).value;
    expect(password).toHaveLength(10);
    expect(confirm).toBe(password);
  });

  it('spec 5: set mode submits exactly {mode:"set", password, signOut:true}', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ mode: 'set', signedOut: true });
    render(<ResetPasswordDialog open user={DRIVER} onSubmit={onSubmit} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'longenough1' } });
    fireEvent.change(screen.getByLabelText(/Type it again/i), { target: { value: 'longenough1' } });
    fireEvent.click(screen.getByRole('button', { name: /Change password/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        mode: 'set',
        password: 'longenough1',
        signOut: true,
      }),
    );
  });

  it('spec 5: unchecking the sign-out box submits signOut:false', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ mode: 'set', signedOut: false });
    render(<ResetPasswordDialog open user={DRIVER} onSubmit={onSubmit} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'longenough1' } });
    fireEvent.change(screen.getByLabelText(/Type it again/i), { target: { value: 'longenough1' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Change password/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        mode: 'set',
        password: 'longenough1',
        signOut: false,
      }),
    );
  });

  it('spec 5: email mode submits exactly {mode:"email"}', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ mode: 'email', queued: true, email: 'r***@gnb.com' });
    render(
      <ResetPasswordDialog open user={DRIVER_WITH_EMAIL} onSubmit={onSubmit} onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole('radio', { name: /Email a reset link/i }));
    fireEvent.click(screen.getByRole('button', { name: /Send link/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ mode: 'email' }));
  });

  it('spec 5: an error stays inside the dialog', async () => {
    const onSubmit = vi.fn().mockRejectedValue({ message: 'That did not work' });
    const onClose = vi.fn();
    render(<ResetPasswordDialog open user={DRIVER} onSubmit={onSubmit} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'longenough1' } });
    fireEvent.change(screen.getByLabelText(/Type it again/i), { target: { value: 'longenough1' } });
    fireEvent.click(screen.getByRole('button', { name: /Change password/i }));

    expect(await screen.findByText('That did not work')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('D9: the email success toast says the link was queued, never sent', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ mode: 'email', queued: true, email: 'r***@gnb.com' });
    render(
      <ResetPasswordDialog open user={DRIVER_WITH_EMAIL} onSubmit={onSubmit} onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole('radio', { name: /Email a reset link/i }));
    fireEvent.click(screen.getByRole('button', { name: /Send link/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    const message = toast.success.mock.calls[0][0];
    expect(message).toContain('queued');
    expect(message).toContain('Ravi');
    expect(message).toContain('r***@gnb.com');
    expect(message).not.toMatch(/\bsent\b/i);
  });

  it('D12: the submit refuses a missing email even when the email mode was picked', async () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <ResetPasswordDialog open user={DRIVER_WITH_EMAIL} onSubmit={onSubmit} onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole('radio', { name: /Email a reset link/i }));
    rerender(<ResetPasswordDialog open user={{ ...DRIVER_WITH_EMAIL, email: null }} onSubmit={onSubmit} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Send link/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('goal: Escape closes the dialog', () => {
    const onClose = vi.fn();
    render(<ResetPasswordDialog open user={DRIVER} onSubmit={vi.fn()} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
