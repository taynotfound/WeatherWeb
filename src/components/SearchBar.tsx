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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setSelectedIndex(-1);
    
    if (value.length > 1) {
      const filtered = (cities as City[])
        .filter(city => 
          city.name.toLowerCase().includes(value.toLowerCase()) ||
          city.country.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 7);
      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex > -1) {
          handleSuggestionClick(suggestions[selectedIndex].name);
        } else if (query) {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
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

  return (
    <div className="search-container" style={{
      position: 'relative',
      width: '100%',
      maxWidth: '32rem',
      margin: '0 auto',
    }} ref={wrapperRef}>
      <style jsx global>{`

        .suggestion-container {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: var(--glass-background);
          border: 1px solid var(--glass-border);
          border-radius: 0.75rem;
          overflow: hidden;
          z-index: 1000;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .suggestion-item {
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid var(--glass-border);
          background: var(--glass-background);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-item:hover,
        .suggestion-item.selected {
          background: var(--glass-hover-bg);
          transform: translateX(4px);
        }

        .suggestion-item .city-name {
          font-weight: 500;
          color: var(--text-primary);
        }

        .suggestion-item .country-name {
          font-size: 0.875rem;
          color: var(--text-secondary);
          opacity: 0.8;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          border-radius: 0.75rem;
          border: 1px solid var(--glass-border);
          background: var(--glass-background);
          color: var(--text-primary);
          font-size: 1rem;
          outline: none;
          transition: all 0.2s ease;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .search-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.2);
          background: var(--glass-hover-bg);
        }
      `}</style>

      <div className="glass" style={{
        padding: '0.5rem',
        borderRadius: '1rem',
      }}>
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
          }}>
            <div style={{
              position: 'absolute',
              left: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              pointerEvents: 'none',
            }}>
              <FiSearch size={20} />
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for a city..."
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="search-input glass-hover"
            />
          </div>
          <button
            type="submit"
            className="glass-hover"
            style={{
              padding: '0.75rem',
              borderRadius: '0.75rem',
              background: 'var(--primary)',
              border: 'none',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(var(--primary-rgb), 0.3)',
            }}
          >
            <FiSearch size={20} />
          </button>
        </form>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="suggestion-container">
          {suggestions.map((city, index) => (
            <div
              key={`${city.name}-${city.country}-${index}`}
              className={`suggestion-item ${selectedIndex === index ? 'selected' : ''}`}
              onClick={() => handleSuggestionClick(city.name)}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span className="city-name">{city.name}</span>
                <span className="country-name">{city.country}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 