import { Check } from 'lucide-react';
import { LAYER_GLYPHS } from './mapPlaceIcon.js';

const GLYPH_KEY = { ourPlaces: 'plants' };

export default function PlaceLayerRow({ layer, on, onToggle, count, truncated, subtitle, disabled, color }) {
  const paths = LAYER_GLYPHS[GLYPH_KEY[layer.id] || layer.id] || LAYER_GLYPHS.sites;
  return <button type="button" className={`lt-place-layer-row ${on ? 'is-on' : ''}`} aria-pressed={on} disabled={disabled} onClick={onToggle}>
    <span className="lt-place-layer-icon" style={{ color, backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)` }}>
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths.map((d) => <path key={d} d={d} />)}</svg>
    </span>
    <span className="lt-place-layer-text"><strong>{layer.label}</strong>{subtitle ? <small>{subtitle}</small> : null}</span>
    {count != null ? <span className="lt-place-layer-count">{count.toLocaleString('en-IN')}{truncated ? '+' : ''}</span> : null}
    <span className="lt-place-layer-check" aria-hidden="true">{on ? <Check size={11} /> : null}</span>
  </button>;
}
