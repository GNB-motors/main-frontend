import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import ContactForm from './ContactForm';
import { sendEnquiry } from '../enquiryService';

vi.mock('../enquiryService', () => ({ sendEnquiry: vi.fn() }));

const type = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('ContactForm', () => {
  beforeEach(() => {
    sendEnquiry.mockReset();
  });

  it('shows what is missing and sends nothing', () => {
    render(<ContactForm />);
    fireEvent.click(screen.getByRole('button', { name: /Send enquiry/ }));

    expect(screen.getByText('Enter your name')).toBeInTheDocument();
    expect(screen.getByText('Add an email or a phone number so we can reply')).toBeInTheDocument();
    expect(screen.getByText('Pick your fleet size')).toBeInTheDocument();
    expect(sendEnquiry).not.toHaveBeenCalled();
  });

  it('sends the enquiry with the picked topics and thanks them in the same card', async () => {
    sendEnquiry.mockResolvedValue({ received: true });
    render(<ContactForm />);

    type('Your name', 'Ravi Kumar');
    type('Work email', 'ravi@raviroadlines.in');
    type('Fleet size', '26-100');
    const pricing = screen.getByRole('button', { name: 'Pricing' });
    fireEvent.click(pricing);
    expect(pricing).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /Send enquiry/ }));
    expect(screen.getByRole('button', { name: /Sending/ })).toBeDisabled();

    expect(await screen.findByText('Enquiry sent', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('ravi@raviroadlines.in')).toBeInTheDocument();
    expect(sendEnquiry).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ravi Kumar', fleetSize: '26-100', topics: ['PRICING'] }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Send another enquiry' }));
    expect(screen.getByLabelText('Your name')).toHaveValue('');
  });

  it('keeps what they typed and says why when sending fails', async () => {
    sendEnquiry.mockRejectedValue(
      Object.assign(new Error('fail'), {
        status: 429,
        displayMessage: 'Too many enquiries from here. Try again in an hour.',
      }),
    );
    render(<ContactForm />);
    type('Your name', 'Ravi Kumar');
    type('Phone', '9831012345');
    type('Fleet size', '1-5');
    fireEvent.click(screen.getByRole('button', { name: /Send enquiry/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many enquiries from here.');
    expect(screen.getByLabelText('Your name')).toHaveValue('Ravi Kumar');
  });
});
