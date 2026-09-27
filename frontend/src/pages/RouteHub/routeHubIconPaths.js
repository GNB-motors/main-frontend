/**
 * Route Hub icon set — the mockup's own inline-SVG glyphs, copied verbatim so
 * the port matches stroke-for-stroke (lucide's equivalents differ subtly in
 * geometry and weight). Paths are static developer-authored strings, which is
 * why injecting them as markup is safe here.
 */

export const ICON_PATHS = {
  refresh:
    '<path d="M21 3v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 21v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>',
  download:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  truck:
    '<path d="M14 17V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1.5"/><path d="M9.5 17h3"/><path d="M19.5 17H21a1 1 0 0 0 1-1v-3.3a1 1 0 0 0-.2-.6l-3-3.7a1 1 0 0 0-.8-.4H14"/><circle cx="17" cy="17.5" r="2"/><circle cx="6.8" cy="17.5" r="2"/>',
  route:
    '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>',
  split:
    '<path d="M6 3v6a6 6 0 0 0 6 6h6"/><path d="m15 12 3 3-3 3"/><circle cx="6" cy="19" r="2"/><path d="M6 15v2"/>',
  gauge:
    '<path d="M4.9 19.1A10 10 0 1 1 19.1 19.1"/><path d="M12 13l4-5"/><circle cx="12" cy="13" r="1.4" fill="currentColor" stroke="none"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  arrowUR: '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
  arrowL: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  arrowR: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  chevDown: '<path d="M6 9l6 6 6-6"/>',
  building:
    '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h.01"/><path d="M15 7h.01"/><path d="M9 11h.01"/><path d="M15 11h.01"/><path d="M10 21v-4h4v4"/>',
  alert: '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  checkS: '<path d="M20 6 9 17l-5-5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  rupee: '<path d="M6 4h12"/><path d="M6 9h12"/><path d="M6 4h3a5 5 0 0 1 0 10H6l8 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  zap: '<path d="M13 2 3.5 14H12l-1 8 9.5-12H13z"/>',
  play: '<path d="M7 4.5 19 12 7 19.5z" fill="currentColor"/>',
  pause: '<path d="M8 4.5v15"/><path d="M16 4.5v15"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/>',
  ledger:
    '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>',
  fuel: '<path d="M3 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16"/><path d="M3 11h11"/><path d="M14 8h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  moon: '<path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.2 4.2 5.6 5.6"/><path d="M18.4 18.4l1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.2 19.8 5.6 18.4"/><path d="M18.4 5.6l1.4-1.4"/>',
  target:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
};

/** Raw <svg> markup, for the few places that build HTML strings (Leaflet divIcons). */
export function icoHTML(name, size = 16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ''}</svg>`;
}
