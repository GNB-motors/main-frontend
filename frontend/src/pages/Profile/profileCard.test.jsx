import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ProfileCard } from './profileCard';

describe('ProfileCard Quick Stats (Company and GSTIN)', () => {
  it('renders company name and GSTIN with wrapping classes and without truncate', () => {
    const longCompany = 'BD ROADLINES PRIVATE LIMITED';
    const sampleGstin = '19CGTPP0000A1Z5';

    render(
      <ProfileCard
        user={{ firstName: 'Asha', lastName: 'Rao', email: 'asha@gnb.in', role: 'OWNER' }}
        organization={{ companyName: longCompany, gstin: sampleGstin }}
      />,
    );

    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('GSTIN')).toBeInTheDocument();

    // Verify company name is rendered in full
    const companyElements = screen.getAllByText(longCompany);
    expect(companyElements.length).toBeGreaterThan(0);

    // Verify GSTIN is rendered in full
    const gstinElement = screen.getByText(sampleGstin);
    expect(gstinElement).toBeInTheDocument();

    // Neither should have the truncate class which hides text with ellipsis
    expect(gstinElement.className).not.toContain('truncate');
    expect(gstinElement.className).toContain('break-words');

    const cardCompanyElement = companyElements.find((el) => el.className.includes('text-blue-700'));
    expect(cardCompanyElement).toBeDefined();
    expect(cardCompanyElement.className).not.toContain('truncate');
    expect(cardCompanyElement.className).toContain('break-words');
  });

  it('renders fallback dash when company name or GSTIN is absent', () => {
    render(<ProfileCard user={{ firstName: 'John', lastName: 'Doe' }} organization={{}} />);

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });
});
