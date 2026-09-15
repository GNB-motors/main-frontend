import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ConfirmDialogHost } from './ConfirmDialog';
import { useConfirm } from './confirmContext';

function Probe({ onReady }) {
  const confirm = useConfirm();
  React.useEffect(() => {
    onReady(confirm);
  }, [confirm, onReady]);
  return null;
}

function setup() {
  const holder = {};
  render(
    <ConfirmDialogHost>
      <Probe onReady={(confirm) => { holder.confirm = confirm; }} />
    </ConfirmDialogHost>,
  );
  return holder;
}

describe('ConfirmDialogHost', () => {
  it('resolves true when the user confirms', async () => {
    const holder = setup();
    const promise = holder.confirm({ title: 'Delete zone?' });
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }));
    await expect(promise).resolves.toBe(true);
  });

  it('resolves false when the user cancels', async () => {
    const holder = setup();
    const promise = holder.confirm({ title: 'Delete zone?' });
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await expect(promise).resolves.toBe(false);
  });

  it('resolves false when the backdrop is clicked', async () => {
    const holder = setup();
    const promise = holder.confirm({ title: 'Delete zone?' });
    const dialog = await screen.findByRole('alertdialog');
    fireEvent.click(dialog.parentElement);
    await expect(promise).resolves.toBe(false);
  });

  it('uses custom labels and shows the body', async () => {
    const holder = setup();
    const promise = holder.confirm({
      title: 'Revoke role?',
      body: 'They lose access immediately.',
      confirmLabel: 'Revoke',
    });
    await screen.findByText('They lose access immediately.');
    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    await expect(promise).resolves.toBe(true);
  });

  it('a second confirm while one is open resolves false immediately', async () => {
    const holder = setup();
    const first = holder.confirm({ title: 'First' });
    const second = holder.confirm({ title: 'Second' });
    await expect(second).resolves.toBe(false);
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }));
    await expect(first).resolves.toBe(true);
  });

  it('dialog is gone after settling', async () => {
    const holder = setup();
    const promise = holder.confirm({ title: 'Delete zone?' });
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }));
    await promise;
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
  });
});
