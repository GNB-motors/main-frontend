import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  scrubResetToken,
  takeResetToken,
  releaseResetToken,
  readTokenFromLocation,
  RESET_PATH,
  TOKEN_STORAGE_KEY,
} from './resetTokenScrub.js';

const makeStorage = (initial = {}) => {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    map,
  };
};

const makeTarget = (href, storage = makeStorage()) => {
  const url = new URL(href);
  const location = {
    href: url.href,
    pathname: url.pathname,
    hash: url.hash,
    search: url.search,
  };
  const calls = [];
  const history = {
    state: { from: 'the email' },
    replaceState: (state, title, next) => {
      calls.push({ state, title, next });
      const nextUrl = new URL(next, url.origin);
      location.href = nextUrl.href;
      location.pathname = nextUrl.pathname;
      location.hash = nextUrl.hash;
      location.search = nextUrl.search;
    },
  };
  return { target: { location, history, sessionStorage: storage }, calls, storage };
};

beforeEach(() => {
  releaseResetToken();
});

describe('reset token scrub', () => {
  it('D6: the token is moved out of the address bar and kept for the page', () => {
    const { target, calls, storage } = makeTarget('https://app.gnb.in/reset-password?token=tok-123');

    const token = scrubResetToken({ target });

    expect(token).toBe('tok-123');
    expect(target.__gnbResetToken).toBe('tok-123');
    expect(storage.getItem(TOKEN_STORAGE_KEY)).toBe('tok-123');
    expect(calls).toEqual([{ state: { from: 'the email' }, title: '', next: '/reset-password' }]);
  });

  it('review 4: the token is taken from the FRAGMENT of the link', () => {
    const { target, calls, storage } = makeTarget('https://app.gnb.in/reset-password#token=tok-frag');

    const token = scrubResetToken({ target });

    expect(token).toBe('tok-frag');
    expect(target.__gnbResetToken).toBe('tok-frag');
    expect(storage.getItem(TOKEN_STORAGE_KEY)).toBe('tok-frag');
    expect(calls[0].next).toBe('/reset-password');
  });

  it('review 4: the fragment wins over the legacy query string', () => {
    const { target } = makeTarget(
      'https://app.gnb.in/reset-password?token=tok-query#token=tok-frag',
    );

    expect(scrubResetToken({ target })).toBe('tok-frag');
  });

  it('review 4: the address bar becomes exactly /reset-password', () => {
    const { target, calls } = makeTarget(
      'https://app.gnb.in/reset-password?token=tok-123&other=keep&x=1#section',
    );

    scrubResetToken({ target });

    expect(calls[0].next).toBe('/reset-password');
    expect(target.location.href).toBe('https://app.gnb.in/reset-password');
  });

  it('review 4: a fragment link leaves nothing of the link behind', () => {
    const { target, calls } = makeTarget('https://app.gnb.in/reset-password#token=tok-123&x=1');

    scrubResetToken({ target });

    expect(calls[0].next).toBe('/reset-password');
    expect(target.location.href).toBe('https://app.gnb.in/reset-password');
    expect(target.location.hash).toBe('');
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

  it('review 4: the token is read from the fragment, then the query, then the stash', () => {
    const hash = makeTarget('https://app.gnb.in/reset-password#token=tok-hash');
    expect(readTokenFromLocation(hash.target.location)).toBe('tok-hash');

    const query = makeTarget('https://app.gnb.in/reset-password?token=tok-query');
    expect(readTokenFromLocation(query.target.location)).toBe('tok-query');

    const stashed = makeStorage({ [TOKEN_STORAGE_KEY]: 'tok-stash' });
    const fromStash = makeTarget('https://app.gnb.in/reset-password', stashed);
    expect(takeResetToken({ target: fromStash.target })).toBe('tok-stash');
  });

  it('review 4: the page takes the token, clears the stash and cleans the URL', () => {
    const { target, calls, storage } = makeTarget('https://app.gnb.in/reset-password#token=tok-hash');

    const token = takeResetToken({ target });

    expect(token).toBe('tok-hash');
    expect(storage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(target.__gnbResetToken).toBeUndefined();
    expect(calls[0].next).toBe('/reset-password');
    expect(target.location.href).toBe('https://app.gnb.in/reset-password');
  });

  it('review 4: an in-app navigation to /reset-password#token=… works too', () => {
    const { target, calls } = makeTarget('https://app.gnb.in/reset-password');
    // The router pushes the state; the hash is in the address bar.
    target.location.hash = '#token=tok-inapp';
    target.location.href = 'https://app.gnb.in/reset-password#token=tok-inapp';

    const token = takeResetToken({ target });

    expect(token).toBe('tok-inapp');
    expect(calls[0].next).toBe('/reset-password');
  });

  it('review 4: the inline script is the first element in <head> and handles the fragment', () => {
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
    // The fragment is read first, the legacy query string still works.
    expect(head).toContain('window.location.hash');
    expect(head).toContain('window.location.search');
    // The token is put aside for the page.
    expect(head).toContain(`'${TOKEN_STORAGE_KEY}'`);
  });
});
