import React, { useState, useEffect, useRef } from 'react';
import { FiSearch } from 'react-icons/fi';
import ReactCountryFlag from 'react-country-flag';

interface SearchBarProps {
  onCitySelect: (city: string) => void;
}

interface LocationSuggestion {
  city: string;
  country: string;
  countryCode: string;
  state?: string;
  zip?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onCitySelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Common cities with additional information
  const locations: LocationSuggestion[] = [
    { city: 'London', country: 'United Kingdom', countryCode: 'GB', state: 'England', zip: 'SW1A 1AA' },
    { city: 'New York', country: 'United States', countryCode: 'US', state: 'New York', zip: '10001' },
    { city: 'Tokyo', country: 'Japan', countryCode: 'JP', state: 'Tokyo', zip: '100-0001' },
    { city: 'Paris', country: 'France', countryCode: 'FR', state: 'Île-de-France', zip: '75001' },
    { city: 'Berlin', country: 'Germany', countryCode: 'DE', state: 'Berlin', zip: '10115' },
    { city: 'Madrid', country: 'Spain', countryCode: 'ES', state: 'Community of Madrid', zip: '28001' },
    { city: 'Rome', country: 'Italy', countryCode: 'IT', state: 'Lazio', zip: '00100' },
    { city: 'Moscow', country: 'Russia', countryCode: 'RU', state: 'Moscow', zip: '101000' },
    { city: 'Beijing', country: 'China', countryCode: 'CN', state: 'Beijing', zip: '100000' },
    { city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', state: 'Dubai', zip: '00000' },
  ];

  // Fuzzy search function
  const fuzzySearch = (searchQuery: string, locations: LocationSuggestion[]): LocationSuggestion[] => {
    const lowerQuery = searchQuery.toLowerCase();
    return locations
      .filter(location => {
        const lowerCity = location.city.toLowerCase();
        const lowerCountry = location.country.toLowerCase();
        const lowerState = location.state?.toLowerCase() || '';
        const lowerZip = location.zip?.toLowerCase() || '';
        
        return (
          lowerCity.includes(lowerQuery) ||
          lowerCountry.includes(lowerQuery) ||
          lowerState.includes(lowerQuery) ||
          lowerZip.includes(lowerQuery)
        );
      })
      .sort((a, b) => {
        // Prioritize matches that start with the query
        const aStartsWithQuery = a.city.toLowerCase().startsWith(lowerQuery);
        const bStartsWithQuery = b.city.toLowerCase().startsWith(lowerQuery);
        if (aStartsWithQuery && !bStartsWithQuery) return -1;
        if (!aStartsWithQuery && bStartsWithQuery) return 1;
        return a.city.localeCompare(b.city);
      })
      .slice(0, 5); // Limit to 5 suggestions
  };

  useEffect(() => {
    if (query.length >= 2) {
      const fuzzyResults = fuzzySearch(query, locations);
      setSuggestions(fuzzyResults);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onCitySelect(query.trim());
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={searchRef} style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <div className="glass" style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          borderRadius: '0.75rem',
          gap: '0.5rem',
          width: '100%'
        }}>
          <FiSearch size={20} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            placeholder="Search for a city..."
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              width: '100%',
              fontSize: '1rem'
            }}
          />
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="glass" style={{
          position: 'absolute',
          top: 'calc(100% + 0.5rem)',
          left: 0,
          right: 0,
          borderRadius: '0.75rem',
          overflow: 'hidden',
          zIndex: 10
        }}>
          <style jsx>{`
            .suggestion-button {
              width: 100%;
              padding: 0.75rem 1rem;
              background: none;
              border: none;
              text-align: left;
              color: var(--text-primary);
              cursor: pointer;
              transition: background-color 0.2s;
            }
            .suggestion-button:hover {
              background-color: rgba(255, 255, 255, 0.1);
            }
          `}</style>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-button"
              onClick={() => {
                setQuery(suggestion.city);
                onCitySelect(suggestion.city);
                setShowSuggestions(false);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ReactCountryFlag countryCode={suggestion.countryCode} svg style={{ width: '1.5em', height: '1.5em' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>{suggestion.city}</div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}>
                    <span>{suggestion.state && `${suggestion.state}, `}{suggestion.country}</span>
                    {suggestion.zip && <span>ZIP: {suggestion.zip}</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 