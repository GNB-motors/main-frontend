import { useEffect, useRef } from 'react';
import './gnb-interactions.css';

// Shared page shell for all GNB Edge marketing pages. Wraps content in the
// .gnb-edge-v2 token scope and wires the runtime interactions that the design
// expected but the static export left out:
//   • darkzone theme flip  (only fires where [data-darkzone] exists — landing)
//   • metrics count-up      (any [data-count] span)
//   • scroll-reveal fade-in (any [data-reveal] / [data-reveal-group] element)
//
// Reveal + count-up are driven by a scroll handler with an immediate initial
// pass, so content is revealed deterministically and can never stay hidden.
//
// Reveal REPLAYS: every target keeps its pending marker for the life of the
// page and is re-armed once it leaves the viewport, so scrolling back up and
// down animates it again. Count-up stays one-shot on purpose — a number that
// re-counts every pass reads as a glitch, not an effect.

function animateCount(el, reduce) {
  const target = parseFloat(el.getAttribute('data-count')) || 0;
  const suffix = el.getAttribute('data-suffix') || '';
  const fmt = (n) => Math.round(n).toLocaleString('en-IN');
  if (reduce) { el.textContent = fmt(target) + suffix; return; }
  const dur = 1200;
  let start = null;
  const step = (ts) => {
    if (start === null) start = ts;
    const t = Math.min(1, (ts - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = fmt(target * eased) + suffix;
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = fmt(target) + suffix;
  };
  requestAnimationFrame(step);
}

export default function GnbPage({ children }) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanups = [];

    // 1. Darkzone → flip the page to dark while the marked section holds the viewport.
    const zones = root.querySelectorAll('[data-darkzone]');
    if (zones.length) {
      const io = new IntersectionObserver(
        (entries) => {
          const active = entries.some((e) => e.isIntersecting);
          if (active) root.setAttribute('data-theme', 'dark');
          else root.removeAttribute('data-theme');
        },
        { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
      );
      zones.forEach((z) => io.observe(z));
      cleanups.push(() => io.disconnect());
    }

    // 2. Collect count-up + reveal targets.
    const counters = [...root.querySelectorAll('[data-count]')];
    const counted = new Set();

    const revealTargets = [];
    if (!reduce) {
      revealTargets.push(...root.querySelectorAll('[data-reveal]'));
      root.querySelectorAll('[data-reveal-group]').forEach((g) => {
        [...g.children].forEach((c, i) => {
          if (!c.hasAttribute('data-reveal')) {
            c.setAttribute('data-reveal', '');
            // Stagger index only — the CSS applies it on the way IN, so
            // re-arming on exit is uniform and does not unwind slowly.
            c.style.setProperty('--gnb-reveal-i', i);
            revealTargets.push(c);
          }
        });
      });
      // Every target gets the pending marker: it carries the transition, so an
      // element without it snaps in with no animation at all. Above-fold items
      // are additionally marked revealed right away, which is what prevents the
      // first-paint flash without costing them their transition on later passes.
      const vh0 = window.innerHeight || 800;
      revealTargets.forEach((t) => {
        t.setAttribute('data-reveal-pending', '');
        if (t.getBoundingClientRect().top <= vh0 * 0.9) t.setAttribute('data-revealed', '');
      });
    }

    // 3. One pass that reveals + counts anything that has entered view.
    const run = () => {
      const vh = window.innerHeight || 800;
      counters.forEach((el) => {
        if (!counted.has(el) && el.getBoundingClientRect().top < vh * 0.85) {
          counted.add(el);
          animateCount(el, reduce);
        }
      });
      if (!reduce) {
        // Targets are never removed from the list — that is what makes the
        // reveal repeatable. Re-arm only once an element is fully clear of the
        // viewport, so a section straddling the fold cannot flicker mid-scroll.
        revealTargets.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.top < vh * 0.92 && r.bottom > 0) {
            el.setAttribute('data-revealed', '');
          } else if (r.top >= vh || r.bottom <= 0) {
            el.removeAttribute('data-revealed');
          }
        });
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; run(); });
    };
    run(); // initial pass for whatever is already in view
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll);
    cleanups.push(() => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div className="gnb-edge-v2" ref={ref}>
      {children}
    </div>
  );
}
