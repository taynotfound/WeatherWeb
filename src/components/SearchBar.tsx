import React, { useState, useEffect, useRef } from 'react';
import { FiSearch } from 'react-icons/fi';
import cities from 'cities.json';

interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

interface SearchBarProps {
  onSearch: (city: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length > 2) {
      const filtered = (cities as City[])
        .filter(city => 
          city.name.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 5);
      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query) {
      onSearch(query);
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (cityName: string) => {
    setQuery(cityName);
    onSearch(cityName);
    setIsOpen(false);
  };

  const containerStyles = {
    position: 'relative' as const,
    width: '100%',
  };

  const inputContainerStyles = {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  };

  const inputStyles = {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 2.5rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--glass-border)',
    background: 'var(--glass-background)',
    backdropFilter: 'blur(10px)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const iconStyles = {
    position: 'absolute' as const,
    left: '1rem',
    color: 'var(--text-secondary)',
  };

  const suggestionsContainerStyles = {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '0.5rem',
    background: 'var(--glass-background)',
    borderRadius: '0.75rem',
    border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(10px)',
    maxHeight: '15rem',
    overflowY: 'auto' as const,
    zIndex: 10,
  };

  const suggestionItemStyles = {
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'background-color 0.2s ease',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  };

  return (
    <div style={containerStyles} ref={wrapperRef}>
      <form onSubmit={handleSubmit}>
        <div style={inputContainerStyles}>
          <FiSearch style={iconStyles} size={18} />
          <input
            type="text"
            placeholder="Search for a city..."
            value={query}
            onChange={handleInputChange}
            style={inputStyles}
          />
        </div>
      </form>

      {isOpen && suggestions.length > 0 && (
        <div style={suggestionsContainerStyles}>
          {suggestions.map((city, index) => (
            <div
              key={`${city.name}-${city.country}-${index}`}
              style={suggestionItemStyles}
              onClick={() => handleSuggestionClick(city.name)}
            >
              <span>{city.name}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {city.country}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 