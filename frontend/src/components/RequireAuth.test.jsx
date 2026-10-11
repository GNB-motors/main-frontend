import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RequireAuth from './RequireAuth';
import { setSession, clearSession } from '../utils/session';

const jwtExpiringAt = (exp) => `header.${btoa(JSON.stringify({ exp }))}.signature`;
const nowSeconds = () => Math.floor(Date.now() / 1000);

function renderProtected() {
  render(
    <MemoryRouter initialEntries={['/profile']}>
      <Routes>
        <Route path="/login" element={<p>login page</p>} />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <p>dashboard shell</p>
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAuth', () => {
  beforeEach(() => {
    clearSession();
  });

  it('sends an anonymous visitor to /login without rendering the shell', () => {
    renderProtected();
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('dashboard shell')).not.toBeInTheDocument();
  });

  it('treats an expired token as signed out', () => {
    setSession({ token: jwtExpiringAt(nowSeconds() - 60) });
    renderProtected();
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('dashboard shell')).not.toBeInTheDocument();
  });

  it('renders the shell for a valid token', () => {
    setSession({ token: jwtExpiringAt(nowSeconds() + 3600) });
    renderProtected();
    expect(screen.getByText('dashboard shell')).toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });
});
