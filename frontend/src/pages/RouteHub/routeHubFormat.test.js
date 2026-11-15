import { describe, it, expect } from 'vitest';
import { inr, inrK } from './routeHubFormat';

describe('routeHubFormat money', () => {
  it('shows a dash when an amount is unknown', () => {
    expect(inr(null)).toBe('—');
    expect(inr(undefined)).toBe('—');
    expect(inrK(null)).toBe('—');
    expect(inrK(undefined)).toBe('—');
  });

  it('keeps a measured zero as a real zero', () => {
    expect(inr(0)).toBe('₹0');
    expect(inrK(0)).toBe('₹0');
  });

  it('groups rupees the Indian way', () => {
    expect(inr(17636)).toBe('₹17,636');
    expect(inr(1500000)).toBe('₹15,00,000');
  });

  it('shortens big amounts', () => {
    expect(inrK(1500)).toBe('₹1.5k');
    expect(inrK(250000)).toBe('₹2.50L');
  });
});
