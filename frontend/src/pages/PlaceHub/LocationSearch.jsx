import { useEffect, useRef, useState } from 'react';
import { Search, X, MapPin } from 'lucide-react';

/**
 * Google Places search box. One user-chosen point at a time — a prediction is
 * resolved to a location only when it is picked, never in a loop — so it stays
 * inside the on-demand geocoding rule.
 *
 * onPick({ lat, lng, label, result }) — `result` is the raw geocoder result so
 * a caller can lift address fields out of it.
 */
export default function LocationSearch({ isLoaded, onPick, placeholder = 'Search a location' }) {
  const [value, setValue] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [active, setActive] = useState(-1);
  const serviceRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (isLoaded && window.google?.maps?.places) {
      serviceRef.current = new window.google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  useEffect(() => {
    if (!serviceRef.current || value.trim().length < 3) {
      setPredictions([]);
      return undefined;
    }
    let alive = true;
    const timer = setTimeout(() => {
      serviceRef.current.getPlacePredictions(
        { input: value, componentRestrictions: { country: 'in' } },
        (preds, status) => {
          if (!alive) return;
          const ok = status === window.google.maps.places.PlacesServiceStatus.OK;
          setPredictions(ok && preds ? preds.slice(0, 6) : []);
          setActive(-1);
        },
      );
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setPredictions([]);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const pick = (prediction) => {
    setPredictions([]);
    setValue(prediction.structured_formatting?.main_text || prediction.description);
    new window.google.maps.Geocoder().geocode(
      { placeId: prediction.place_id },
      (results, status) => {
        const result = status === 'OK' ? results?.[0] : null;
        const loc = result?.geometry?.location;
        if (!loc) return;
        onPick({ lat: loc.lat(), lng: loc.lng(), label: prediction.description, result });
      },
    );
  };

  const onKeyDown = (e) => {
    if (!predictions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(predictions[Math.max(active, 0)]);
    } else if (e.key === 'Escape') {
      setPredictions([]);
    }
  };

  return (
    <div className="ph-search" ref={wrapRef}>
      <Search size={15} className="ph-search-icon" aria-hidden="true" />
      <input
        className="ph-search-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={isLoaded ? placeholder : 'Loading map…'}
        disabled={!isLoaded}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          className="ph-search-clear"
          onClick={() => {
            setValue('');
            setPredictions([]);
          }}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
      {predictions.length > 0 && (
        <ul className="ph-search-list">
          {predictions.map((p, i) => (
            <li key={p.place_id}>
              <button
                type="button"
                className={`ph-search-option${i === active ? ' is-active' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(p)}
              >
                <MapPin size={14} aria-hidden="true" />
                <span>
                  <strong>{p.structured_formatting?.main_text || p.description}</strong>
                  <small>{p.structured_formatting?.secondary_text || ''}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
