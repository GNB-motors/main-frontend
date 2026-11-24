import { useState } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useMediaQuery } from '../hooks/useMediaQuery';

vi.mock('../contexts/FeatureFlagsContext.jsx', () => ({
  useFeatureFlags: () => ({ canAccess: () => true, isEnabled: () => true }),
  useOrganization: () => ({ organization: null }),
}));
vi.mock('../hooks/useApprovalBadges', () => ({ default: () => ({ approvals: 0, bills: 0 }) }));
vi.mock('../hooks/useMediaQuery', () => ({ useMediaQuery: vi.fn(() => true) }));
vi.mock('../utils/session', async (actual) => ({
  ...(await actual()),
  getUserRole: () => 'OWNER',
  getThemeColor: () => null,
}));
vi.mock('../utils/colorTheme', () => ({ applyThemeToRoot: vi.fn() }));
vi.mock('./redesign/NavHint', () => ({ default: ({ children }) => children }));

function Harness({ initialOpen = true }) {
  const [open, setOpen] = useState(initialOpen);
  const location = useLocation();
  return (
    <>
      <button onClick={() => setOpen((value) => !value)}>Toggle</button>
      <Sidebar isSidebarOpen={open} setSidebarOpen={setOpen} />
      <output>{location.pathname}</output>
    </>
  );
}
const mount = (initialOpen = true) =>
  render(
    <MemoryRouter initialEntries={['/digest']}>
      <Harness initialOpen={initialOpen} />
    </MemoryRouter>,
  );
beforeEach(() => {
  vi.clearAllMocks();
  useMediaQuery.mockReturnValue(true);
});
it('uses desktop hover independently of the mobile drawer state', () => {
  const { container } = mount(false);
  const sidebar = container.querySelector('aside');
  fireEvent.mouseEnter(sidebar);
  fireEvent.click(screen.getByRole('button', { name: 'Employees' }));
  expect(screen.getByRole('link', { name: 'Access control' })).toBeInTheDocument();
  expect(sidebar).not.toHaveClass('open');
  fireEvent.mouseLeave(sidebar);
  expect(screen.queryByRole('link', { name: 'Access control' })).not.toBeInTheDocument();
  expect(sidebar).not.toHaveClass('open');
});
it('opens the employee submenu after hovering the desktop rail', () => {
  const { container } = mount(false);
  fireEvent.mouseEnter(container.querySelector('aside'));
  fireEvent.click(screen.getByRole('button', { name: 'Employees' }));
  expect(container.querySelector('aside')).not.toHaveClass('open');
  expect(screen.getByRole('button', { name: 'Employees' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  expect(screen.getByRole('link', { name: 'Access control' })).toBeInTheDocument();
});
it('keeps the active route group expanded while the desktop rail is hovered', () => {
  const { container } = mount();
  fireEvent.mouseEnter(container.querySelector('aside'));
  fireEvent.click(screen.getByRole('button', { name: 'Employees' }));
  fireEvent.click(screen.getByRole('link', { name: 'Employees' }));
  expect(screen.getByRole('status')).toHaveTextContent('/drivers');
  expect(screen.getByRole('button', { name: 'Employees' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  expect(screen.getByRole('link', { name: 'Access control' })).toBeInTheDocument();
  expect(container.querySelector('aside')).toHaveClass('open');
});
it('closes the mobile drawer after choosing a page', () => {
  useMediaQuery.mockReturnValue(false);
  const { container } = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Employees' }));
  fireEvent.click(screen.getByRole('link', { name: 'Employees' }));
  expect(container.querySelector('aside')).not.toHaveClass('open');
});

it('shows the active route submenu again when the pointer returns', () => {
  const { container } = mount();
  const sidebar = container.querySelector('aside');
  fireEvent.mouseEnter(sidebar);
  fireEvent.click(screen.getByRole('button', { name: 'Employees' }));
  fireEvent.click(screen.getByRole('link', { name: 'Employees' }));
  fireEvent.mouseLeave(sidebar);
  expect(screen.queryByRole('link', { name: 'Access control' })).not.toBeInTheDocument();
  fireEvent.mouseEnter(sidebar);
  expect(screen.getByRole('button', { name: 'Employees' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  expect(screen.getByRole('link', { name: 'Access control' })).toBeInTheDocument();
});

it('keeps page links available without a screen finder', () => {
  const { container } = mount();
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Daily Digest' })).toBeInTheDocument();
  fireEvent.mouseEnter(container.querySelector('aside'));
  fireEvent.click(screen.getByRole('button', { name: 'Employees' }));
  expect(screen.getByRole('link', { name: 'Access control' })).toBeVisible();
});
