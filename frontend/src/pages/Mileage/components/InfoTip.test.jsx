import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import InfoTip from './InfoTip';

// Base UI's popover stalls jsdom on open; see test/baseUiStubs.jsx.
vi.mock('@/components/ui/popover', async () => (await import('../../../test/baseUiStubs')).popover);

const explanation = {
  title: 'Bill is more than the tank got',
  text: 'The bill says more diesel than reached the tank.',
  lines: [
    ['Gauge rose', '76.4 L'],
    ['Allowed', '± 7.5 L'],
  ],
};

describe('InfoTip', () => {
  it('keeps the maths hidden until ⓘ is pressed', async () => {
    render(<InfoTip explanation={explanation} />);
    expect(screen.queryByText('Gauge rose')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'How is this worked out?' }));
    expect(await screen.findByText('Bill is more than the tank got')).toBeInTheDocument();
    expect(screen.getByText('Gauge rose')).toBeInTheDocument();
    expect(screen.getByText('± 7.5 L')).toBeInTheDocument();
  });

  it('does not open the row it sits in', () => {
    const onRow = vi.fn();
    render(
      <table>
        <tbody>
          <tr onClick={onRow}>
            <td>
              <InfoTip explanation={explanation} />
            </td>
          </tr>
        </tbody>
      </table>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'How is this worked out?' }));
    expect(onRow).not.toHaveBeenCalled();
  });

  it('renders nothing when there is nothing to explain', () => {
    const { container } = render(<InfoTip explanation={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
