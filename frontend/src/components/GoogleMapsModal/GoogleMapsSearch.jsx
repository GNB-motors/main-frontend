import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

// Added onEnter prop: called when the user presses Enter without choosing
// a dropdown suggestion. Parent can geocode the typed text and confirm selection.
const GoogleMapsSearch = ({ isLoaded, searchValue, setSearchValue, onSuggestionSelect, onEnter, className }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const serviceRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const debounceRef = useRef(null);

  // Initialize Places service
  useEffect(() => {
    if (isLoaded && window.google) {
      serviceRef.current = new window.google.maps.places.AutocompleteService();
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    }
  }, [isLoaded]);

  // Debounced predictions
  useEffect(() => {
    if (!isLoaded || !window.google) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    // Don't show suggestions on initial load with pre-filled value
    if (isInitialLoad && searchValue) {
      setIsInitialLoad(false);
      return;
    }

    if (!searchValue || searchValue.length <= 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = window.setTimeout(() => {
      const svc = serviceRef.current;
      if (!svc) {
        setLoading(false);
        return;
      }

      svc.getPlacePredictions(
        {
          input: searchValue,
          sessionToken: sessionTokenRef.current || undefined,
        },
        (preds, status) => {
          setLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && preds) {
            setSuggestions(preds);
          } else {
            setSuggestions([]);
          }
        }
      );
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchValue, isLoaded, isInitialLoad]);

  const handleSuggestionClick = (suggestion) => {
    onSuggestionSelect(suggestion);
    setSuggestions([]);
    // Refresh session token
    if (window.google) {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If there are suggestions, pick the first one (behaves like selecting it).
      if (suggestions && suggestions.length > 0) {
        handleSuggestionClick(suggestions[0]);
      } else if (onEnter) {
        onEnter(searchValue);
      }
    }
  };

  return (
    <div className={`search-input-wrapper ${className || ''}`}>
      <Search size={20} className="search-icon" />
      <input
        type="text"
        placeholder="Search for a location..."
        value={searchValue}
        onChange={(e) => {
          setSearchValue(e.target.value);
          if (isInitialLoad) {
            setIsInitialLoad(false);
          }
        }}
        onKeyDown={handleKeyDown}
        className="search-input"
      />
      {suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id || index}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.description}
            </div>
          ))}
        </div>
      )}
      {loading && <div className="loading">Loading suggestions...</div>}
    </div>
  );
};

export default GoogleMapsSearch;