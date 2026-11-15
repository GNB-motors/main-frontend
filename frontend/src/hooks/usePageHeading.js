import { useEffect, useState } from 'react';

/**
 * usePageHeading — the heading the page itself shows.
 *
 * The top bar used to name a page after its route ("Alert inbox") while the
 * page below said something else ("Alert Inbox"): the same page, two names,
 * on screen at once. The page's own H1 is the truth, so the top bar reads it
 * and shows exactly those words.
 *
 * Pages without an H1 (the live map, for one) keep the route name.
 */

const readHeading = (root) => {
  if (!root) return '';
  const heading = root.querySelector('h1');
  return heading ? heading.textContent.replace(/\s+/g, ' ').trim() : '';
};

export function usePageHeading(rootId = 'main-content') {
  const [title, setTitle] = useState(null);

  useEffect(() => {
    let root = document.getElementById(rootId);
    let observer = null;

    const apply = () => {
      const text = readHeading(root);
      setTitle((prev) => (prev === text ? prev : text || null));
    };

    const watchRoot = () => {
      observer = new MutationObserver(apply);
      observer.observe(root, { childList: true, subtree: true, characterData: true });
    };

    if (root) {
      apply();
      watchRoot();
      return () => observer.disconnect();
    }

    // The page area can arrive after this hook mounts (the layout waits for
    // the session before it draws), so the document is watched until the
    // page area shows up.
    const bodyObserver = new MutationObserver(() => {
      root = document.getElementById(rootId);
      if (!root) return;
      bodyObserver.disconnect();
      apply();
      watchRoot();
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
    return () => bodyObserver.disconnect();
  }, [rootId]);

  return title;
}

export default usePageHeading;
