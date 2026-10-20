import React from 'react';

/* The scrim is a TINT layer only — deliberately NO backdrop-filter:
   the old blur(8px) turned the board into a blurry white blanket
   behind the drawer. The selection-focus dimming lives in the canvas
   paint itself (kgDraw), so a theme-appropriate tint (dark ≈ 32%
   black, light ≈ 28% white) is enough for the drawer to read as
   foreground while the graph stays sharp underneath. It sits one
   z-step BELOW the drawer (45 vs 46) so the drawer stays fully
   crisp, and it never intercepts the pointer — clicking the board
   still selects/switches nodes. `contained` mirrors the drawer's
   own positioning: absolute inside the graph page's relative
   wrapper, fixed over the viewport on the embedded LEMU page. The
   shared class (.lemu-drawer-scrim, LemuLogsPage.css) carries no
   filter; the tint arrives as the --lemu-scrim var so both render
   sites stay theme-correct. */
const NodeDrawerScrim = ({ theme, contained }) => (
  <div
    className="lemu-drawer-scrim"
    aria-hidden="true"
    style={{
      '--lemu-scrim': theme === 'light' ? 'rgba(255,255,255,0.28)' : 'rgba(6,7,10,0.32)',
      position: contained ? 'absolute' : 'fixed',
    }}
  />
);

export default NodeDrawerScrim;
