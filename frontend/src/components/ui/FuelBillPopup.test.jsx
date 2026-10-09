import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import FuelBillPopup from './FuelBillPopup';

describe('FuelBillPopup', () => {
  it('shows the bill framed, and closes from the corner button, Esc or the backdrop', () => {
    const onClose = vi.fn();
    render(<FuelBillPopup imageSrc="https://s3.example/bill.jpg" onClose={onClose} />);

    const img = screen.getByRole('img', { name: 'Fuel Bill' });
    expect(img).toHaveAttribute('src', 'https://s3.example/bill.jpg');
    expect(img).toHaveStyle({ padding: '16px', borderRadius: '16px' });

    fireEvent.click(img); // clicking the bill itself keeps it open
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Close bill' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(img.parentElement.parentElement);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
