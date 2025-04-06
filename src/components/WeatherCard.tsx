import React from 'react';
import { motion } from 'framer-motion';
import { FiDroplet, FiWind, FiSunrise, FiSunset } from 'react-icons/fi';
import ReactCountryFlag from 'react-country-flag';

interface WeatherCardProps {
  city: string;
  country: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  sunrise: string;
  sunset: string;
  unit: 'C' | 'F';
  onUnitChange: (unit: 'C' | 'F') => void;
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  city,
  country,
  temperature,
  condition,
  icon,
  humidity,
  windSpeed,
  sunrise,
  sunset,
  unit,
  onUnitChange
}) => {
  const cardStyles = {
    padding: '1.5rem',
    marginTop: '2rem',
    background: 'var(--glass-background)',
    borderRadius: '1rem',
    backdropFilter: 'blur(10px)',
    border: '1px solid var(--glass-border)',
  };

  const metricContainerStyles = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    marginTop: '1.5rem',
  };

  const metricItemStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  };

  return (
    <motion.div 
      style={cardStyles}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{city}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ReactCountryFlag countryCode={country} svg style={{ fontSize: '1.5em' }} />
            <p style={{ color: 'var(--text-secondary)' }}>{country}</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {temperature}°{unit}
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <button
                onClick={() => onUnitChange('C')}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  backgroundColor: unit === 'C' ? 'var(--primary)' : 'transparent',
                  color: unit === 'C' ? 'white' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  border: '1px solid var(--primary)',
                }}
              >
                °C
              </button>
              <button
                onClick={() => onUnitChange('F')}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  backgroundColor: unit === 'F' ? 'var(--primary)' : 'transparent',
                  color: unit === 'F' ? 'white' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  border: '1px solid var(--primary)',
                }}
              >
                °F
              </button>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }} className="capitalize">{condition}</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0' }}>
        <img 
          src={`https://openweathermap.org/img/wn/${icon}@4x.png`} 
          alt={condition}
          style={{ width: '7rem', height: '7rem', objectFit: 'contain' }}
        />
      </div>
      
      <div style={metricContainerStyles}>
        <div style={metricItemStyles}>
          <FiDroplet style={{ color: 'var(--secondary)', flexShrink: 0 }} size={20} />
          <span style={{ color: 'var(--text-secondary)' }}>Humidity: {humidity}%</span>
        </div>
        <div style={metricItemStyles}>
          <FiWind style={{ color: 'var(--secondary)', flexShrink: 0 }} size={20} />
          <span style={{ color: 'var(--text-secondary)' }}>Wind: {windSpeed} m/s</span>
        </div>
        <div style={metricItemStyles}>
          <FiSunrise style={{ color: 'var(--primary)', flexShrink: 0 }} size={20} />
          <span style={{ color: 'var(--text-secondary)' }}>Sunrise: {sunrise}</span>
        </div>
        <div style={metricItemStyles}>
          <FiSunset style={{ color: 'var(--accent)', flexShrink: 0 }} size={20} />
          <span style={{ color: 'var(--text-secondary)' }}>Sunset: {sunset}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherCard; 