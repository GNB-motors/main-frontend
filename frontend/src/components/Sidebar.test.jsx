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
vi.mock('../utils/session', () => ({ getUserRole: () => 'OWNER', getThemeColor: () => null }));
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
it('keeps labels expanded until the user collapses navigation', () => {
  const { container } = mount();
  const sidebar = container.querySelector('aside');
  expect(sidebar).toHaveClass('open');
  fireEvent.mouseLeave(sidebar);
  expect(sidebar).toHaveClass('open');
  fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
  expect(sidebar).not.toHaveClass('open');
  fireEvent.mouseEnter(sidebar);
  expect(sidebar).not.toHaveClass('open');
});
it('opens the employee submenu when its icon is clicked from the collapsed rail', () => {
  const { container } = mount(false);
  fireEvent.click(screen.getByRole('button', { name: 'Employees' }));
  expect(container.querySelector('aside')).toHaveClass('open');
  expect(screen.getByRole('button', { name: 'Employees' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  expect(screen.getByRole('link', { name: 'Access control' })).toBeInTheDocument();
});
it('closes the selected submenu after navigation while keeping desktop labels visible', () => {
  const { container } = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Employees' }));
  fireEvent.click(screen.getByRole('link', { name: 'Employees' }));
  expect(screen.getByRole('status')).toHaveTextContent('/drivers');
  expect(screen.getByRole('button', { name: 'Employees' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  expect(screen.queryByRole('link', { name: 'Access control' })).not.toBeInTheDocument();
  expect(container.querySelector('aside')).toHaveClass('open');
});
it('closes the mobile drawer after choosing a page', () => {
  useMediaQuery.mockReturnValue(false);
  const { container } = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Employees' }));
  fireEvent.click(screen.getByRole('link', { name: 'Employees' }));
  expect(container.querySelector('aside')).not.toHaveClass('open');
});

it('reopens an existing submenu when its group is selected after collapsing the rail', () => {
  const { container } = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Employees' }));
  fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
  fireEvent.click(screen.getByRole('button', { name: 'Employees' }));
  expect(container.querySelector('aside')).toHaveClass('open');
  expect(screen.getByRole('button', { name: 'Employees' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  expect(screen.getByRole('link', { name: 'Access control' })).toBeInTheDocument();
});
