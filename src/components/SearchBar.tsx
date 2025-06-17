import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiMapPin } from 'react-icons/fi';
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
  lat?: number;
  lon?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({ onCitySelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length >= 2) {
        try {
          const response = await fetch(
            `/api/cities-autocomplete?query=${encodeURIComponent(query)}`
          );
          const data = await response.json();
          if (data.data) {
            setSuggestions(data.data);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Error fetching city suggestions:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };
    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
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

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `http://geodb-cities-api.wirefreethought.com/v1/geo/cities?location=${latitude},${longitude}&radius=50&limit=1`
            );
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
              const city = data.data[0];
              setQuery(city.name);
              onCitySelect(city.name);
              setShowSuggestions(false);
            }
          } catch (error) {
            console.error('Error fetching nearby city:', error);
            alert('Unable to detect location.');
          }
        },
        (error) => {
          alert('Unable to detect location.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
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
          <button
            type="button"
            onClick={handleDetectLocation}
            title="Detect my location"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              marginLeft: '0.5rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FiMapPin size={20} />
          </button>
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
                    <span>{suggestion.country}</span>
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