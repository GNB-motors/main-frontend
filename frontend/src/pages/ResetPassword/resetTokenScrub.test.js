import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { scrubResetToken, RESET_PATH } from './resetTokenScrub.js';

const makeTarget = (href) => {
  const url = new URL(href);
  const location = {
    href: url.href,
    pathname: url.pathname,
  };
  const calls = [];
  const history = {
    state: { from: 'the email' },
    replaceState: (state, title, next) => {
      calls.push({ state, title, next });
      location.href = new URL(next, url.origin).href;
      location.pathname = new URL(next, url.origin).pathname;
    },
  };
  return { target: { location, history }, calls };
};

describe('reset token scrub', () => {
  it('D6: the token is moved out of the address bar and kept for the page', () => {
    const { target, calls } = makeTarget('https://app.gnb.in/reset-password?token=tok-123');

    const token = scrubResetToken({ target });

    expect(token).toBe('tok-123');
    expect(target.__gnbResetToken).toBe('tok-123');
    expect(calls).toEqual([{ state: { from: 'the email' }, title: '', next: '/reset-password' }]);
  });

  it('review 3: the address bar becomes exactly /reset-password', () => {
    const { target, calls } = makeTarget(
      'https://app.gnb.in/reset-password?token=tok-123&other=keep&x=1#section',
    );

    scrubResetToken({ target });

    expect(calls[0].next).toBe('/reset-password');
    expect(target.location.href).toBe('https://app.gnb.in/reset-password');
  });

  it('review 3: the history state survives the rewrite', () => {
    const { target, calls } = makeTarget('https://app.gnb.in/reset-password?token=tok-123');

    scrubResetToken(target);

    expect(calls[0].state).toEqual({ from: 'the email' });
  });

  it('review 3: another page, or a link without a token, is left alone', () => {
    const other = makeTarget('https://app.gnb.in/drivers?token=tok-123');
    expect(scrubResetToken({ target: other.target })).toBeNull();
    expect(other.calls).toHaveLength(0);

    const noToken = makeTarget('https://app.gnb.in/reset-password');
    expect(scrubResetToken({ target: noToken.target })).toBeNull();
    expect(noToken.calls).toHaveLength(0);
  });

  it('review 3: the inline script is the first element in <head> and rewrites to /reset-password', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));

    // The script comes before the charset, the favicon and every link.
    const scriptAt = head.indexOf('<script>');
    expect(scriptAt).toBeGreaterThan(-1);
    expect(scriptAt).toBeLessThan(head.indexOf('<meta charset'));
    expect(scriptAt).toBeLessThan(head.indexOf('<link'));
    expect(scriptAt).toBeLessThan(head.indexOf('<title'));

    // It keeps the history state and rewrites to exactly /reset-password.
    expect(head).toContain('window.history.replaceState(window.history.state');
    expect(head).toContain(`'', '${RESET_PATH}'`);
    expect(head).toContain('window.__gnbResetToken = token');
  });
});
