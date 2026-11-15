import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ToneBadge from './ToneBadge';

describe('ToneBadge', () => {
  it('names the good tone Good', () => {
    render(<ToneBadge tone="good" />);
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('names the act tone Needs you', () => {
    render(<ToneBadge tone="act" />);
    expect(screen.getByText('Needs you')).toBeInTheDocument();
  });

  it('names the watch tone Watch', () => {
    render(<ToneBadge tone="watch" />);
    expect(screen.getByText('Watch')).toBeInTheDocument();
  });

  it('takes custom words when the meaning is specific', () => {
    render(<ToneBadge tone="watch">Inferred</ToneBadge>);
    expect(screen.getByText('Inferred')).toBeInTheDocument();
  });
});
